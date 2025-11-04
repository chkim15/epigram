import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

const FREE_TIER_LIMITS = {
  personalized_practice: 3,
  mock_exam: 3,
  ai_tutor: 3,
};

export async function POST(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    // Verify the user's session
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { feature } = body as { feature: 'personalized_practice' | 'mock_exam' | 'ai_tutor' };

    if (!feature || !['personalized_practice', 'mock_exam', 'ai_tutor'].includes(feature)) {
      return NextResponse.json(
        { error: 'Invalid feature type' },
        { status: 400 }
      );
    }

    // Check if user is Pro (Pro users have unlimited usage)
    const { data: subscription } = await supabaseAdmin
      .from('user_subscriptions')
      .select('status')
      .eq('user_id', user.id)
      .single();

    const isPro = subscription && (subscription.status === 'active' || subscription.status === 'trialing');

    if (isPro) {
      return NextResponse.json({
        success: true,
        usage_count: -1, // -1 indicates unlimited
        remaining: -1,
        isPro: true,
      });
    }

    // Get or create usage tracking record
    const { data: existingUsage } = await supabaseAdmin
      .from('usage_tracking')
      .select('*')
      .eq('user_id', user.id)
      .eq('feature_type', feature)
      .single();

    let newCount = 1;

    if (existingUsage) {
      newCount = existingUsage.usage_count + 1;

      // Check if limit exceeded
      if (newCount > FREE_TIER_LIMITS[feature]) {
        return NextResponse.json(
          {
            error: 'Usage limit exceeded',
            usage_count: existingUsage.usage_count,
            limit: FREE_TIER_LIMITS[feature],
          },
          { status: 429 }
        );
      }

      // Update usage count
      await supabaseAdmin
        .from('usage_tracking')
        .update({
          usage_count: newCount,
          last_used_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('feature_type', feature);
    } else {
      // Create new usage record
      await supabaseAdmin
        .from('usage_tracking')
        .insert({
          user_id: user.id,
          feature_type: feature,
          usage_count: 1,
          last_used_at: new Date().toISOString(),
        });
    }

    return NextResponse.json({
      success: true,
      usage_count: newCount,
      remaining: FREE_TIER_LIMITS[feature] - newCount,
      limit: FREE_TIER_LIMITS[feature],
    });
  } catch (error) {
    console.error('Usage tracking error:', error);
    return NextResponse.json(
      { error: 'Failed to track usage' },
      { status: 500 }
    );
  }
}

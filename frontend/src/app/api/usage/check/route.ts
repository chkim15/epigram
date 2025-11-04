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
  personalized_practice: 5,
  mock_exam: 5,
  ai_tutor: 5,
};

export async function GET(request: NextRequest) {
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

    // Check if user is Pro
    const { data: subscription } = await supabaseAdmin
      .from('user_subscriptions')
      .select('status')
      .eq('user_id', user.id)
      .single();

    const isPro = subscription && (subscription.status === 'active' || subscription.status === 'trialing');

    if (isPro) {
      return NextResponse.json({
        personalized_practice: -1, // -1 indicates unlimited
        mock_exam: -1,
        ai_tutor: -1,
        isPro: true,
      });
    }

    // Get all usage records for user
    const { data: usageRecords } = await supabaseAdmin
      .from('usage_tracking')
      .select('*')
      .eq('user_id', user.id);

    // Build usage object
    const usage = {
      personalized_practice: 0,
      mock_exam: 0,
      ai_tutor: 0,
    };

    if (usageRecords) {
      usageRecords.forEach((record) => {
        usage[record.feature_type as keyof typeof usage] = record.usage_count;
      });
    }

    // Calculate remaining for each feature
    const remaining = {
      personalized_practice: FREE_TIER_LIMITS.personalized_practice - usage.personalized_practice,
      mock_exam: FREE_TIER_LIMITS.mock_exam - usage.mock_exam,
      ai_tutor: FREE_TIER_LIMITS.ai_tutor - usage.ai_tutor,
    };

    return NextResponse.json({
      ...usage,
      remaining,
      limits: FREE_TIER_LIMITS,
      isPro: false,
    });
  } catch (error) {
    console.error('Usage check error:', error);
    return NextResponse.json(
      { error: 'Failed to check usage' },
      { status: 500 }
    );
  }
}

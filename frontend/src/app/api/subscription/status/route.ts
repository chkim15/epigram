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

    // Fetch user's subscription and profile in parallel
    const [{ data: subscription, error: subError }, { data: profile }] = await Promise.all([
      supabaseAdmin.from('user_subscriptions').select('*').eq('user_id', user.id).single(),
      supabaseAdmin.from('user_profiles').select('is_team').eq('user_id', user.id).single(),
    ]);

    const isTeam = profile?.is_team ?? false;

    // If no subscription found, user is on free plan
    if (subError || !subscription) {
      const { data: freePlan } = await supabaseAdmin
        .from('subscription_plans')
        .select('*')
        .eq('id', 'free')
        .single();

      return NextResponse.json({
        subscription: null,
        plan: freePlan,
        status: isTeam ? 'team' : 'free',
        isTeam,
      });
    }

    // Fetch plan details
    const { data: plan } = await supabaseAdmin
      .from('subscription_plans')
      .select('*')
      .eq('id', subscription.plan_id)
      .single();

    return NextResponse.json({
      subscription,
      plan,
      status: isTeam ? 'team' : subscription.status,
      isTeam,
    });
  } catch (error) {
    console.error('Subscription status error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription status' },
      { status: 500 }
    );
  }
}

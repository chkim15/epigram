import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
});

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

    // Get user's subscription
    const { data: subscription, error: subError } = await supabaseAdmin
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (subError || !subscription) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    // Verify user hasn't already used retention discount
    if (subscription.retention_discount_used) {
      return NextResponse.json(
        { error: 'Retention discount has already been used' },
        { status: 400 }
      );
    }

    if (!subscription.stripe_subscription_id) {
      return NextResponse.json(
        { error: 'No Stripe subscription ID found' },
        { status: 404 }
      );
    }

    // Determine discount duration based on plan
    let durationInMonths = 1;
    let couponName = 'Monthly/Yearly Retention 50%';

    if (subscription.plan_id === 'pro_weekly') {
      // For weekly: 2 billing cycles = ~0.5 months
      // We'll use a repeating coupon for 2 weeks
      durationInMonths = 0.5;
      couponName = 'Weekly Retention 50%';
    }

    // Create a one-time or repeating coupon for 50% off
    const coupon = await stripe.coupons.create({
      percent_off: 50,
      duration: subscription.plan_id === 'pro_weekly' ? 'repeating' : 'once',
      ...(subscription.plan_id === 'pro_weekly' ? { duration_in_months: 1 } : {}),
      name: couponName,
      metadata: {
        user_id: user.id,
        retention_discount: 'true',
      },
    });

    // Apply coupon to subscription
    await stripe.subscriptions.update(subscription.stripe_subscription_id, {
      coupon: coupon.id,
    });

    // Mark retention discount as used
    await supabaseAdmin
      .from('user_subscriptions')
      .update({
        retention_discount_used: true,
      })
      .eq('user_id', user.id);

    return NextResponse.json({
      success: true,
      message: '50% discount applied to your subscription',
      coupon: {
        percent_off: coupon.percent_off,
        duration: coupon.duration,
        duration_in_months: coupon.duration_in_months,
      },
    });
  } catch (error) {
    console.error('Retention discount error:', error);
    return NextResponse.json(
      { error: 'Failed to apply retention discount' },
      { status: 500 }
    );
  }
}

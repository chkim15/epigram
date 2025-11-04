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

    // Parse request body
    const body = await request.json().catch(() => ({}));
    const { declineOffer } = body as { declineOffer?: boolean };

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

    // Check if user is eligible for retention discount
    const eligibleForDiscount = !subscription.retention_discount_used;

    // If eligible and user hasn't explicitly declined, show retention offer
    if (eligibleForDiscount && !declineOffer) {
      return NextResponse.json({
        showRetentionOffer: true,
        message: 'User is eligible for retention discount',
      });
    }

    // User declined offer or already used discount - proceed with cancellation
    if (!subscription.stripe_subscription_id) {
      return NextResponse.json(
        { error: 'No Stripe subscription ID found' },
        { status: 404 }
      );
    }

    // Cancel subscription at period end in Stripe
    await stripe.subscriptions.update(subscription.stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    // Update database
    await supabaseAdmin
      .from('user_subscriptions')
      .update({
        cancel_at_period_end: true,
        canceled_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    return NextResponse.json({
      showRetentionOffer: false,
      message: 'Subscription will be canceled at the end of the billing period',
      current_period_end: subscription.current_period_end,
    });
  } catch (error) {
    console.error('Subscription cancellation error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}

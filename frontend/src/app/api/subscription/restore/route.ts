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
        { error: 'No subscription found' },
        { status: 404 }
      );
    }

    if (!subscription.stripe_subscription_id) {
      return NextResponse.json(
        { error: 'No Stripe subscription found' },
        { status: 400 }
      );
    }

    try {
      // First check if the subscription exists in Stripe
      const stripeSubscription = await stripe.subscriptions.retrieve(
        subscription.stripe_subscription_id
      );

      // Check subscription status
      if (stripeSubscription.status === 'canceled') {
        // If fully cancelled, we can't restore it - user needs to create a new subscription
        return NextResponse.json(
          { error: 'Subscription is fully cancelled. Please start a new subscription.' },
          { status: 400 }
        );
      }

      // If it's scheduled for cancellation but not yet cancelled, we can restore it
      if (stripeSubscription.cancel_at_period_end) {
        await stripe.subscriptions.update(
          subscription.stripe_subscription_id,
          {
            cancel_at_period_end: false,
          }
        );
      }

      // Update the database
      await supabaseAdmin
        .from('user_subscriptions')
        .update({
          cancel_at_period_end: false,
          cancel_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

    } catch (stripeError) {
      console.error('Stripe error:', stripeError);

      // If Stripe subscription doesn't exist or is cancelled, update DB to reflect this
      const error = stripeError as { code?: string; statusCode?: number };
      if (error.code === 'resource_missing' || error.statusCode === 404) {
        await supabaseAdmin
          .from('user_subscriptions')
          .update({
            status: 'canceled',
            cancel_at_period_end: false,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);

        return NextResponse.json(
          { error: 'Subscription not found. Please start a new subscription.' },
          { status: 400 }
        );
      }

      throw stripeError;
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription restored successfully',
    });
  } catch (error) {
    console.error('Error restoring subscription:', error);
    return NextResponse.json(
      { error: 'Failed to restore subscription' },
      { status: 500 }
    );
  }
}
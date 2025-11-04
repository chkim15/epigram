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
    const body = await request.json();
    const { planType } = body as { planType: 'weekly' | 'monthly' | 'yearly' };

    if (!planType || !['weekly', 'monthly', 'yearly'].includes(planType)) {
      return NextResponse.json(
        { error: 'Invalid plan type. Must be weekly, monthly, or yearly' },
        { status: 400 }
      );
    }

    // Get price ID based on plan type
    const priceIds = {
      weekly: process.env.STRIPE_PRICE_WEEKLY!,
      monthly: process.env.STRIPE_PRICE_MONTHLY!,
      yearly: process.env.STRIPE_PRICE_YEARLY!,
    };

    const priceId = priceIds[planType];

    // Check if user already has a subscription
    const { data: existingSubscription } = await supabaseAdmin
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Check if user has already used their trial
    const hasUsedTrial = existingSubscription?.has_used_trial || false;

    // Get or create Stripe customer
    let customerId = existingSubscription?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email!,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      customerId = customer.id;
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      subscription_data: {
        // Only add trial if user hasn't used it before
        ...(hasUsedTrial
          ? {}
          : {
              trial_period_days: 7,
            }),
        metadata: {
          supabase_user_id: user.id,
          plan_type: planType,
        },
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/home?checkout=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/?checkout=canceled`,
      metadata: {
        supabase_user_id: user.id,
        plan_type: planType,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Checkout session creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
});

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

// Disable body parsing for webhook signature verification
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature found' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.supabase_user_id;
  if (!userId) {
    console.error('No user ID in checkout session metadata');
    return;
  }

  const subscriptionId = session.subscription as string;
  if (!subscriptionId) {
    console.error('No subscription ID in checkout session');
    return;
  }

  // Fetch subscription details from Stripe
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  // Determine plan ID based on price
  const priceId = subscription.items.data[0]?.price.id;
  let planId = 'free';

  if (priceId === process.env.STRIPE_PRICE_WEEKLY) {
    planId = 'pro_weekly';
  } else if (priceId === process.env.STRIPE_PRICE_MONTHLY) {
    planId = 'pro_monthly';
  } else if (priceId === process.env.STRIPE_PRICE_YEARLY) {
    planId = 'pro_yearly';
  }

  // Create or update subscription record
  const { error } = await supabaseAdmin
    .from('user_subscriptions')
    .upsert({
      user_id: userId,
      plan_id: planId,
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: subscriptionId,
      status: subscription.status as any,
      trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
      trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      has_used_trial: subscription.trial_end ? true : false,
      cancel_at_period_end: subscription.cancel_at_period_end,
    }, {
      onConflict: 'user_id',
    });

  if (error) {
    console.error('Error upserting subscription:', error);
    return;
  }

  // Update user profile subscription tier
  await supabaseAdmin
    .from('user_profiles')
    .update({ subscription_tier: planId })
    .eq('user_id', userId);

  console.log(`Subscription created for user ${userId}: ${subscriptionId}`);
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.supabase_user_id;
  if (!userId) {
    // Try to find user by customer ID
    const { data: existingSubscription } = await supabaseAdmin
      .from('user_subscriptions')
      .select('user_id')
      .eq('stripe_subscription_id', subscription.id)
      .single();

    if (!existingSubscription) {
      console.error('No user found for subscription:', subscription.id);
      return;
    }
  }

  // Determine plan ID based on price
  const priceId = subscription.items.data[0]?.price.id;
  let planId = 'free';

  if (priceId === process.env.STRIPE_PRICE_WEEKLY) {
    planId = 'pro_weekly';
  } else if (priceId === process.env.STRIPE_PRICE_MONTHLY) {
    planId = 'pro_monthly';
  } else if (priceId === process.env.STRIPE_PRICE_YEARLY) {
    planId = 'pro_yearly';
  }

  // Update subscription record
  const { error } = await supabaseAdmin
    .from('user_subscriptions')
    .update({
      plan_id: planId,
      status: subscription.status as any,
      trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
      trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('Error updating subscription:', error);
    return;
  }

  // Update user profile subscription tier
  const { data: sub } = await supabaseAdmin
    .from('user_subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', subscription.id)
    .single();

  if (sub) {
    await supabaseAdmin
      .from('user_profiles')
      .update({ subscription_tier: planId })
      .eq('user_id', sub.user_id);
  }

  console.log(`Subscription updated: ${subscription.id}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  // Update subscription status to canceled
  const { data: sub } = await supabaseAdmin
    .from('user_subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id)
    .select('user_id')
    .single();

  if (sub) {
    // Update user profile to free tier
    await supabaseAdmin
      .from('user_profiles')
      .update({ subscription_tier: 'free' })
      .eq('user_id', sub.user_id);

    console.log(`Subscription deleted for user: ${sub.user_id}`);
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;
  if (!subscriptionId) {
    return;
  }

  // Get user from subscription
  const { data: subscription } = await supabaseAdmin
    .from('user_subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', subscriptionId)
    .single();

  if (!subscription) {
    console.error('No subscription found for invoice:', invoice.id);
    return;
  }

  // Log payment in history
  await supabaseAdmin.from('payment_history').insert({
    user_id: subscription.user_id,
    subscription_id: (await supabaseAdmin
      .from('user_subscriptions')
      .select('id')
      .eq('stripe_subscription_id', subscriptionId)
      .single()).data?.id,
    stripe_payment_intent_id: invoice.payment_intent as string,
    stripe_invoice_id: invoice.id,
    amount_cents: invoice.amount_paid,
    currency: invoice.currency,
    status: 'succeeded',
    payment_method: invoice.charge ? 'card' : null,
    receipt_url: invoice.hosted_invoice_url,
  });

  console.log(`Payment succeeded for invoice: ${invoice.id}`);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;
  if (!subscriptionId) {
    return;
  }

  // Update subscription status to past_due
  await supabaseAdmin
    .from('user_subscriptions')
    .update({ status: 'past_due' })
    .eq('stripe_subscription_id', subscriptionId);

  // Get user from subscription
  const { data: subscription } = await supabaseAdmin
    .from('user_subscriptions')
    .select('user_id, id')
    .eq('stripe_subscription_id', subscriptionId)
    .single();

  if (subscription) {
    // Log failed payment in history
    await supabaseAdmin.from('payment_history').insert({
      user_id: subscription.user_id,
      subscription_id: subscription.id,
      stripe_payment_intent_id: invoice.payment_intent as string,
      stripe_invoice_id: invoice.id,
      amount_cents: invoice.amount_due,
      currency: invoice.currency,
      status: 'failed',
      payment_method: invoice.charge ? 'card' : null,
      receipt_url: invoice.hosted_invoice_url,
    });
  }

  console.log(`Payment failed for invoice: ${invoice.id}`);
}

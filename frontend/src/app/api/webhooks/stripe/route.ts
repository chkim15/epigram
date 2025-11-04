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
    console.log(`[Webhook] Received event: ${event.type} (ID: ${event.id})`);

    switch (event.type) {
      case 'checkout.session.completed':
        console.log('[Webhook] Processing checkout.session.completed');
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        console.log(`[Webhook] Processing ${event.type}`);
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        console.log('[Webhook] Processing customer.subscription.deleted');
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        console.log('[Webhook] Processing invoice.payment_succeeded');
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        console.log('[Webhook] Processing invoice.payment_failed');
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    console.log(`[Webhook] Successfully processed event: ${event.type}`);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Webhook] Handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log(`[Checkout] Session ID: ${session.id}, Customer: ${session.customer}`);

  const userId = session.metadata?.supabase_user_id;
  if (!userId) {
    console.error('[Checkout] ERROR: No user ID in checkout session metadata');
    return;
  }
  console.log(`[Checkout] User ID from metadata: ${userId}`);

  const subscriptionId = session.subscription as string;
  if (!subscriptionId) {
    console.error('[Checkout] ERROR: No subscription ID in checkout session');
    return;
  }
  console.log(`[Checkout] Subscription ID: ${subscriptionId}`);

  // Fetch subscription details from Stripe
  const subscription: Stripe.Subscription = await stripe.subscriptions.retrieve(subscriptionId);
  console.log(`[Checkout] Subscription status: ${subscription.status}, trial_end: ${subscription.trial_end}`);

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
  console.log(`[Checkout] Mapped price ${priceId} to plan: ${planId}`);

  // Create or update subscription record
  const subData = subscription as unknown as {
    status: string;
    trial_start: number | null;
    trial_end: number | null;
    current_period_start: number;
    current_period_end: number;
    cancel_at_period_end: boolean;
  };

  // Safely convert timestamps
  const safeTimestamp = (timestamp: number | null | undefined) => {
    if (!timestamp || timestamp === 0) return null;
    try {
      return new Date(timestamp * 1000).toISOString();
    } catch (e) {
      console.error(`[Checkout] Invalid timestamp: ${timestamp}`, e);
      return null;
    }
  };

  const { error } = await supabaseAdmin
    .from('user_subscriptions')
    .upsert({
      user_id: userId,
      plan_id: planId,
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: subscriptionId,
      status: subData.status,
      trial_start: safeTimestamp(subData.trial_start),
      trial_end: safeTimestamp(subData.trial_end),
      current_period_start: safeTimestamp(subData.current_period_start),
      current_period_end: safeTimestamp(subData.current_period_end),
      has_used_trial: subData.trial_end ? true : false,
      cancel_at_period_end: subData.cancel_at_period_end || false,
    }, {
      onConflict: 'user_id',
    });

  if (error) {
    console.error('[Checkout] ERROR upserting subscription:', error);
    return;
  }
  console.log(`[Checkout] Successfully upserted subscription for user ${userId}`);

  // Update user profile subscription tier
  const { error: profileError } = await supabaseAdmin
    .from('user_profiles')
    .update({ subscription_tier: planId })
    .eq('user_id', userId);

  if (profileError) {
    console.error('[Checkout] ERROR updating user profile:', profileError);
  } else {
    console.log(`[Checkout] Successfully updated user profile for user ${userId}`);
  }

  console.log(`[Checkout] ✅ Subscription created for user ${userId}: ${subscriptionId} (${planId})`);
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
  const subData = subscription as unknown as {
    status: string;
    trial_start: number | null;
    trial_end: number | null;
    current_period_start: number;
    current_period_end: number;
    cancel_at_period_end: boolean;
    canceled_at: number | null;
  };

  // Safely convert timestamps
  const safeTimestamp = (timestamp: number | null | undefined) => {
    if (!timestamp || timestamp === 0) return null;
    try {
      return new Date(timestamp * 1000).toISOString();
    } catch (e) {
      console.error(`[Subscription] Invalid timestamp: ${timestamp}`, e);
      return null;
    }
  };

  const { error } = await supabaseAdmin
    .from('user_subscriptions')
    .update({
      plan_id: planId,
      status: subData.status,
      trial_start: safeTimestamp(subData.trial_start),
      trial_end: safeTimestamp(subData.trial_end),
      current_period_start: safeTimestamp(subData.current_period_start),
      current_period_end: safeTimestamp(subData.current_period_end),
      cancel_at_period_end: subData.cancel_at_period_end || false,
      canceled_at: safeTimestamp(subData.canceled_at),
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
  const invoiceData = invoice as unknown as { subscription: string | null };
  const subscriptionId = invoiceData.subscription;
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
  const invoicePayment = invoice as unknown as {
    payment_intent: string | null;
    id: string;
    amount_paid: number;
    currency: string;
    charge: string | null;
    hosted_invoice_url: string | null;
  };

  await supabaseAdmin.from('payment_history').insert({
    user_id: subscription.user_id,
    subscription_id: (await supabaseAdmin
      .from('user_subscriptions')
      .select('id')
      .eq('stripe_subscription_id', subscriptionId)
      .single()).data?.id,
    stripe_payment_intent_id: invoicePayment.payment_intent,
    stripe_invoice_id: invoicePayment.id,
    amount_cents: invoicePayment.amount_paid,
    currency: invoicePayment.currency,
    status: 'succeeded',
    payment_method: invoicePayment.charge ? 'card' : null,
    receipt_url: invoicePayment.hosted_invoice_url,
  });

  console.log(`Payment succeeded for invoice: ${invoice.id}`);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const invoiceData = invoice as unknown as { subscription: string | null };
  const subscriptionId = invoiceData.subscription;
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
    const invoicePayment = invoice as unknown as {
      payment_intent: string | null;
      id: string;
      amount_due: number;
      currency: string;
      charge: string | null;
      hosted_invoice_url: string | null;
    };

    await supabaseAdmin.from('payment_history').insert({
      user_id: subscription.user_id,
      subscription_id: subscription.id,
      stripe_payment_intent_id: invoicePayment.payment_intent,
      stripe_invoice_id: invoicePayment.id,
      amount_cents: invoicePayment.amount_due,
      currency: invoicePayment.currency,
      status: 'failed',
      payment_method: invoicePayment.charge ? 'card' : null,
      receipt_url: invoicePayment.hosted_invoice_url,
    });
  }

  console.log(`Payment failed for invoice: ${invoice.id}`);
}

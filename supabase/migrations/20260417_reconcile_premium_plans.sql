-- Reconcile subscription plans to the landing-page scheme:
--   Monthly Premium ($19/mo) and 6-Month Premium ($89/6mo).
-- Retire pro_weekly / pro_yearly and update pro_monthly pricing.

-- Allow 'six_month' as a billing interval in addition to the existing values.
ALTER TABLE public.subscription_plans
  DROP CONSTRAINT IF EXISTS subscription_plans_billing_interval_check;

ALTER TABLE public.subscription_plans
  ADD CONSTRAINT subscription_plans_billing_interval_check
  CHECK (billing_interval IN ('week', 'month', 'year', 'six_month'));

-- Upsert the new/updated paid plans. stripe_price_id is left NULL;
-- populate via .env.local and the checkout / webhook routes.
INSERT INTO public.subscription_plans (id, name, price_cents, billing_interval, stripe_price_id, features, is_active)
VALUES
  ('pro_monthly', 'Premium (Monthly)', 1900, 'month', NULL,
    '["Full access to The 4-Week Intensive curriculum", "Exclusive problems not found online", "Unlimited mock interviews", "Company filters", "Priority access to new premium problems", "Up to 3 expert email responses per week"]'::jsonb,
    true),
  ('pro_six_month', 'Premium (6 Months)', 8900, 'six_month', NULL,
    '["Everything in 1-month Premium", "Best value for full interview prep cycle", "Lock in price for 6 months"]'::jsonb,
    true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price_cents = EXCLUDED.price_cents,
  billing_interval = EXCLUDED.billing_interval,
  features = EXCLUDED.features,
  is_active = true,
  updated_at = NOW();

-- Deactivate retired plans. We do NOT delete them so existing
-- user_subscriptions rows referencing those plan IDs remain valid.
UPDATE public.subscription_plans
SET is_active = false, updated_at = NOW()
WHERE id IN ('pro_weekly', 'pro_yearly');

-- =====================================================
-- Subscription System Migration
-- Created: 2025-02-03
-- Purpose: Add subscription plans, user subscriptions, payment history, and usage tracking
-- =====================================================

-- =====================================================
-- 1. SUBSCRIPTION PLANS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  billing_interval TEXT NOT NULL CHECK (billing_interval IN ('week', 'month', 'year')),
  stripe_price_id TEXT UNIQUE,
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comment
COMMENT ON TABLE public.subscription_plans IS 'Available subscription plans for the platform';

-- =====================================================
-- 2. USER SUBSCRIPTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES public.subscription_plans(id),
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('active', 'trialing', 'canceled', 'past_due', 'unpaid', 'incomplete')),
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMPTZ,
  has_used_trial BOOLEAN DEFAULT FALSE,
  retention_discount_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Add comment
COMMENT ON TABLE public.user_subscriptions IS 'User subscription records linked to Stripe';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_customer_id ON public.user_subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON public.user_subscriptions(status);

-- =====================================================
-- 3. PAYMENT HISTORY TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.user_subscriptions(id) ON DELETE SET NULL,
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_invoice_id TEXT,
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'usd',
  status TEXT NOT NULL CHECK (status IN ('succeeded', 'failed', 'pending', 'refunded')),
  payment_method TEXT,
  receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comment
COMMENT ON TABLE public.payment_history IS 'Payment transaction history';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_payment_history_user_id ON public.payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_subscription_id ON public.payment_history(subscription_id);

-- =====================================================
-- 4. USAGE TRACKING TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_type TEXT NOT NULL CHECK (feature_type IN ('personalized_practice', 'mock_exam', 'ai_tutor')),
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, feature_type)
);

-- Add comment
COMMENT ON TABLE public.usage_tracking IS 'Track feature usage limits for free tier users';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_id ON public.usage_tracking(user_id);

-- =====================================================
-- 5. UPDATE USER_PROFILES TABLE
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema = 'public'
                 AND table_name = 'user_profiles'
                 AND column_name = 'subscription_tier') THEN
    ALTER TABLE public.user_profiles ADD COLUMN subscription_tier TEXT DEFAULT 'free';
  END IF;
END $$;

-- =====================================================
-- 6. SEED SUBSCRIPTION PLANS
-- =====================================================
INSERT INTO public.subscription_plans (id, name, price_cents, billing_interval, stripe_price_id, features, is_active)
VALUES
  ('free', 'Free', 0, 'month', NULL, '["Access to first 3 topics", "5 personalized practice attempts", "5 mock exam attempts", "5 AI tutor problems"]'::jsonb, true),
  ('pro_weekly', 'Pro Weekly', 499, 'week', 'price_1SPTLqJnnNLrjCqIYUt8CNRl', '["Unlimited problems", "Unlimited AI tutoring", "Unlimited practice exams", "Priority support", "7-day free trial"]'::jsonb, true),
  ('pro_monthly', 'Pro Monthly', 1499, 'month', 'price_1SPTM4JnnNLrjCqIvnb500qh', '["Unlimited problems", "Unlimited AI tutoring", "Unlimited practice exams", "Priority support", "7-day free trial"]'::jsonb, true),
  ('pro_yearly', 'Pro Yearly', 9999, 'year', 'price_1SPTMiJnnNLrjCqIH7yNFvsl', '["Unlimited problems", "Unlimited AI tutoring", "Unlimited practice exams", "Priority support", "7-day free trial", "Best value - 2 months free"]'::jsonb, true)
ON CONFLICT (id) DO UPDATE SET
  stripe_price_id = EXCLUDED.stripe_price_id,
  price_cents = EXCLUDED.price_cents,
  features = EXCLUDED.features,
  updated_at = NOW();

-- =====================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;

-- Subscription Plans: Everyone can read (public)
DROP POLICY IF EXISTS "Subscription plans are viewable by everyone" ON public.subscription_plans;
CREATE POLICY "Subscription plans are viewable by everyone"
  ON public.subscription_plans FOR SELECT
  USING (true);

-- User Subscriptions: Users can only view their own
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.user_subscriptions;
CREATE POLICY "Users can view their own subscription"
  ON public.user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- User Subscriptions: Service role can do everything (for webhook handler)
DROP POLICY IF EXISTS "Service role can manage all subscriptions" ON public.user_subscriptions;
CREATE POLICY "Service role can manage all subscriptions"
  ON public.user_subscriptions FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Payment History: Users can only view their own
DROP POLICY IF EXISTS "Users can view their own payment history" ON public.payment_history;
CREATE POLICY "Users can view their own payment history"
  ON public.payment_history FOR SELECT
  USING (auth.uid() = user_id);

-- Payment History: Service role can manage all (for webhook handler)
DROP POLICY IF EXISTS "Service role can manage all payments" ON public.payment_history;
CREATE POLICY "Service role can manage all payments"
  ON public.payment_history FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Usage Tracking: Users can view and update their own
DROP POLICY IF EXISTS "Users can view their own usage" ON public.usage_tracking;
CREATE POLICY "Users can view their own usage"
  ON public.usage_tracking FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own usage" ON public.usage_tracking;
CREATE POLICY "Users can update their own usage"
  ON public.usage_tracking FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own usage" ON public.usage_tracking;
CREATE POLICY "Users can insert their own usage"
  ON public.usage_tracking FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Usage Tracking: Service role can manage all
DROP POLICY IF EXISTS "Service role can manage all usage" ON public.usage_tracking;
CREATE POLICY "Service role can manage all usage"
  ON public.usage_tracking FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- 8. HELPER FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_subscription_plans_updated_at ON public.subscription_plans;
CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON public.user_subscriptions;
CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_usage_tracking_updated_at ON public.usage_tracking;
CREATE TRIGGER update_usage_tracking_updated_at
  BEFORE UPDATE ON public.usage_tracking
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

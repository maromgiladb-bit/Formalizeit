-- Add Stripe billing columns to organizations table
ALTER TABLE "organizations"
  ADD COLUMN "stripe_customer_id"        TEXT,
  ADD COLUMN "stripe_subscription_id"    TEXT,
  ADD COLUMN "stripe_price_id"           TEXT,
  ADD COLUMN "stripe_current_period_end" TIMESTAMPTZ;

-- Unique constraints (Stripe guarantees 1:1 mapping per org)
CREATE UNIQUE INDEX "organizations_stripe_customer_id_key"
  ON "organizations"("stripe_customer_id");

CREATE UNIQUE INDEX "organizations_stripe_subscription_id_key"
  ON "organizations"("stripe_subscription_id");

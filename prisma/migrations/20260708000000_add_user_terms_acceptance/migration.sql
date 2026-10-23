-- Additive: evidence of Terms of Service / Privacy Policy acceptance per user.
ALTER TABLE "users" ADD COLUMN "terms_accepted_at" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN "terms_version" TEXT;

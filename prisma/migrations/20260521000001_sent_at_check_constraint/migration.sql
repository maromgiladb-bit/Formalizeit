-- Backfill sent_at for any existing SENT/SIGNED rows that pre-date the column.
-- Uses updated_at as a proxy since that was the last state-change timestamp.
UPDATE "nda_drafts"
    SET "sent_at" = "updated_at"
    WHERE status IN ('SENT', 'SIGNED')
      AND "sent_at" IS NULL;

-- Enforce that any row with status SENT or SIGNED must have sent_at populated.
-- Drafts and other statuses are allowed to have sent_at = null.
ALTER TABLE "nda_drafts"
    ADD CONSTRAINT "nda_drafts_sent_status_requires_sent_at"
    CHECK (
        status NOT IN ('SENT', 'SIGNED') OR "sent_at" IS NOT NULL
    );

-- Add composite index to support frequent count() queries filtered by
-- organization_id, status, and optionally sent_at (for quarterly plan limits).
-- Column order: organization_id first (highest selectivity), then status,
-- then sent_at so the index covers both the lifetime and quarterly WHERE clauses.
CREATE INDEX "nda_drafts_org_status_sent_at_idx"
    ON "nda_drafts" ("organization_id", "status", "sent_at");

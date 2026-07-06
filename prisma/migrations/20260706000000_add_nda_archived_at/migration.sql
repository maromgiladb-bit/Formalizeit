-- Add archive marker for finalized NDAs (dashboard Archived list)
ALTER TABLE "nda_drafts" ADD COLUMN "archived_at" TIMESTAMP(3);

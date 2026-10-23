-- Receiver opt-out: set when the receiver clicks Stop these reminders (cron skips the NDA)
ALTER TABLE "nda_drafts" ADD COLUMN "reminders_stopped_at" TIMESTAMP(3);

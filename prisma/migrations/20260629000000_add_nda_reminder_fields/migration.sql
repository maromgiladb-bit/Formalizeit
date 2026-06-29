-- AlterTable
ALTER TABLE "nda_drafts" ADD COLUMN     "reminder_48h_sent_at" TIMESTAMP(3),
ADD COLUMN     "reminder_5d_sent_at" TIMESTAMP(3);

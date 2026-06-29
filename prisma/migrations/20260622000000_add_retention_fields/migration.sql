-- AlterTable
ALTER TABLE "nda_drafts" ADD COLUMN     "completed_at" TIMESTAMP(3),
ADD COLUMN     "retention_notice_sent_at" TIMESTAMP(3);

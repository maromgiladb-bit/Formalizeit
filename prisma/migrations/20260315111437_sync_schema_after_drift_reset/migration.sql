-- CreateEnum
CREATE TYPE "notification_type" AS ENUM ('NDA_SIGNED', 'NDA_CHANGES_REQUESTED', 'NDA_COMPLETED', 'NDA_SENT_TO_YOU');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "nda_event_type" ADD VALUE 'CHANGES_SUGGESTED';
ALTER TYPE "nda_event_type" ADD VALUE 'CHANGES_ACCEPTED';
ALTER TYPE "nda_event_type" ADD VALUE 'CHANGES_REQUESTED';
ALTER TYPE "nda_event_type" ADD VALUE 'PDF_EXPORTED';

-- AlterTable
ALTER TABLE "nda_revisions" ADD COLUMN     "activity_label" TEXT,
ADD COLUMN     "author_email" TEXT,
ADD COLUMN     "author_name" TEXT,
ADD COLUMN     "author_role" TEXT;

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "type" "notification_type" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "draft_id" UUID,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_user_id_read_idx" ON "notifications"("user_id", "read");

-- CreateIndex
CREATE INDEX "notifications_user_id_created_at_idx" ON "notifications"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_events_draft_id_idx" ON "audit_events"("draft_id");

-- CreateIndex
CREATE INDEX "audit_events_organization_id_idx" ON "audit_events"("organization_id");

-- CreateIndex
CREATE INDEX "nda_drafts_created_by_user_id_idx" ON "nda_drafts"("created_by_user_id");

-- CreateIndex
CREATE INDEX "nda_drafts_organization_id_idx" ON "nda_drafts"("organization_id");

-- CreateIndex
CREATE INDEX "nda_drafts_template_id_idx" ON "nda_drafts"("template_id");

-- CreateIndex
CREATE INDEX "nda_revisions_draft_id_idx" ON "nda_revisions"("draft_id");

-- CreateIndex
CREATE INDEX "nda_templates_organization_id_idx" ON "nda_templates"("organization_id");

-- CreateIndex
CREATE INDEX "sign_requests_draft_id_idx" ON "sign_requests"("draft_id");

-- CreateIndex
CREATE INDEX "sign_requests_organization_id_idx" ON "sign_requests"("organization_id");

-- CreateIndex
CREATE INDEX "signers_sign_request_id_idx" ON "signers"("sign_request_id");

-- CreateIndex
CREATE INDEX "signers_user_id_idx" ON "signers"("user_id");

-- CreateIndex
CREATE INDEX "signers_email_idx" ON "signers"("email");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_draft_id_fkey" FOREIGN KEY ("draft_id") REFERENCES "nda_drafts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

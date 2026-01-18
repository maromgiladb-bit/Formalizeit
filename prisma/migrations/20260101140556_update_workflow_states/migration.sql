/*
  Warnings:

  - The values [FILLING,AWAITING_INPUT,REVIEWING_CHANGES,READY_TO_SIGN,AWAITING_SIGNATURE,SIGNING_COMPLETE] on the enum `nda_workflow_state` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "nda_workflow_state_new" AS ENUM ('DRAFT', 'AWAITING_PARTY_B_REVIEW', 'AWAITING_PARTY_A_REVIEW', 'AWAITING_PARTY_B_SIGNATURE', 'AWAITING_PARTY_A_SIGNATURE', 'COMPLETE');
ALTER TABLE "nda_drafts" ALTER COLUMN "workflow_state" DROP DEFAULT;
ALTER TABLE "nda_drafts" ALTER COLUMN "workflow_state" TYPE "nda_workflow_state_new" USING ("workflow_state"::text::"nda_workflow_state_new");
ALTER TYPE "nda_workflow_state" RENAME TO "nda_workflow_state_old";
ALTER TYPE "nda_workflow_state_new" RENAME TO "nda_workflow_state";
DROP TYPE "nda_workflow_state_old";
ALTER TABLE "nda_drafts" ALTER COLUMN "workflow_state" SET DEFAULT 'DRAFT';
COMMIT;

-- AlterTable
ALTER TABLE "nda_drafts" ADD COLUMN     "last_edited_by" TEXT,
ALTER COLUMN "workflow_state" SET DEFAULT 'DRAFT';

-- ============================================================
-- Role system refactor: OWNER/ADMIN/MEMBER/VIEWER
--                    -> OWNER/APPROVER/CONTRIBUTOR
-- + isApprover flag on memberships
-- + PENDING_INTERNAL_APPROVAL workflow state
-- + internal approval notification types
-- ============================================================

-- Step 1: Drop column default before modifying the enum (default references old value 'MEMBER')
ALTER TABLE "memberships" ALTER COLUMN "role" DROP DEFAULT;

-- Step 2: Rename existing enum values (preserves all existing row data automatically)
ALTER TYPE "membership_role" RENAME VALUE 'ADMIN' TO 'APPROVER';
ALTER TYPE "membership_role" RENAME VALUE 'MEMBER' TO 'CONTRIBUTOR';

-- Step 3: Migrate remaining VIEWER rows → CONTRIBUTOR before removing VIEWER from the enum
UPDATE "memberships" SET role = 'CONTRIBUTOR' WHERE role = 'VIEWER';

-- Step 4: Recreate the enum without VIEWER
--   4a. Cast column to TEXT so we can drop the type
ALTER TABLE "memberships" ALTER COLUMN "role" TYPE TEXT;
--   4b. Drop old enum
DROP TYPE "membership_role";
--   4c. Create new enum
CREATE TYPE "membership_role" AS ENUM ('OWNER', 'APPROVER', 'CONTRIBUTOR');
--   4d. Restore column using new enum (all stored values are now valid)
ALTER TABLE "memberships" ALTER COLUMN "role" TYPE "membership_role" USING ("role"::"membership_role");

-- Step 5: Set new default
ALTER TABLE "memberships" ALTER COLUMN "role" SET DEFAULT 'CONTRIBUTOR';

-- Step 6: Add isApprover flag (owner can opt in to approval powers)
ALTER TABLE "memberships" ADD COLUMN "is_approver" BOOLEAN NOT NULL DEFAULT false;

-- Step 7: Add internal-approval workflow state
ALTER TYPE "nda_workflow_state" ADD VALUE 'PENDING_INTERNAL_APPROVAL';

-- Step 8: Add internal approval notification types
ALTER TYPE "notification_type" ADD VALUE 'NDA_APPROVAL_REQUESTED';
ALTER TYPE "notification_type" ADD VALUE 'NDA_APPROVAL_APPROVED';
ALTER TYPE "notification_type" ADD VALUE 'NDA_APPROVAL_REJECTED';

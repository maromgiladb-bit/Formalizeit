-- CreateEnum
CREATE TYPE "membership_status" AS ENUM ('PENDING_INVITE', 'ACTIVE');

-- AlterTable
ALTER TABLE "memberships" ADD COLUMN     "status" "membership_status" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active';

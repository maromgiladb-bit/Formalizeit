-- AlterTable
ALTER TABLE "users" ADD COLUMN "acknowledged_nda_version" TEXT,
ADD COLUMN "acknowledged_nda_version_at" TIMESTAMP(3);

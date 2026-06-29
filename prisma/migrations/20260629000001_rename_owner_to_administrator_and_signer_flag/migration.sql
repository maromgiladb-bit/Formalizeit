-- Rename MembershipRole enum value OWNER → ADMINISTRATOR (strategy terminology).
-- SignerRole (Party A/B in the NDA signing flow) is a separate enum and is NOT affected.
ALTER TYPE "membership_role" RENAME VALUE 'OWNER' TO 'ADMINISTRATOR';

-- Rename Membership.is_approver → is_signer (the "also a signer" toggle on administrators).
ALTER TABLE "memberships" RENAME COLUMN "is_approver" TO "is_signer";

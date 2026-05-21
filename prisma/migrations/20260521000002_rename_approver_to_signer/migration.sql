-- Rename MembershipRole enum value APPROVER → SIGNER.
-- SignerRole.APPROVER (Party A in the NDA signing flow) is a separate enum and is NOT affected.
ALTER TYPE "membership_role" RENAME VALUE 'APPROVER' TO 'SIGNER';

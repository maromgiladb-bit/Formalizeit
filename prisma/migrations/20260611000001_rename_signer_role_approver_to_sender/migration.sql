-- Rename SignerRole enum value APPROVER → SENDER
ALTER TYPE "signer_role" RENAME VALUE 'APPROVER' TO 'SENDER';

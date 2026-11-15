import type { ReactNode } from 'react';
import { formatEvidenceDate, shortHash } from './evidence-format';

export { formatEvidenceDate, shortHash };

/** One Geist Mono line; items joined by " · ". */
export function EvidenceLine({ items, className = '' }: { items: ReactNode[]; className?: string }) {
  return (
    <div className={`font-doc-mono text-xs leading-relaxed text-ink [overflow-wrap:anywhere] ${className}`}>
      {items.map((item, i) => (
        <span key={i}>
          {i > 0 ? ' · ' : ''}
          {item}
        </span>
      ))}
    </div>
  );
}

interface EvidenceBlockProps {
  signerName: string;
  signedAt: Date | string;
  ipAddress?: string | null;
  templateVersion: string;
  agreementHash?: string | null;
  className?: string;
}

/** Signature evidence: signer, timestamp and IP, template version and short hash. */
export function EvidenceBlock({
  signerName,
  signedAt,
  ipAddress,
  templateVersion,
  agreementHash,
  className = '',
}: EvidenceBlockProps) {
  const when = formatEvidenceDate(signedAt);
  const line2 = [when, ipAddress ? `IP ${ipAddress}` : null].filter((v): v is string => !!v);
  const line3 = [
    templateVersion ? `Template v${templateVersion.replace(/^v/i, '')}` : null,
    agreementHash ? `SHA-256 ${shortHash(agreementHash)}` : null,
  ].filter((v): v is string => !!v);

  return (
    <div className={`rounded-control border border-line bg-ground px-4 py-3 ${className}`}>
      {signerName ? <EvidenceLine items={[`Signed by ${signerName}`]} /> : null}
      {line2.length > 0 ? <EvidenceLine items={line2} /> : null}
      {line3.length > 0 ? <EvidenceLine items={line3} /> : null}
    </div>
  );
}

import { Scale } from 'lucide-react';

/**
 * Persistent "not legal advice" disclaimer shown in the product UI on the
 * NDA fill, review, and sign pages. FormalizeIt is a document workflow tool,
 * not a law firm — this must be visible in-product, not only in Terms/FAQ.
 *
 * Follows the Calm Precision banner rule: white card + gray-200 border +
 * teal-800 icon chip (never teal-50/teal-600 tints in banners).
 */
export function LegalDisclaimer({ className = '' }: { className?: string }) {
  return (
    <div
      role="note"
      className={`flex items-start gap-3 bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-card ${className}`}
    >
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-800">
        <Scale className="h-4 w-4 text-white" aria-hidden="true" />
      </div>
      <p className="text-xs leading-relaxed text-gray-500">
        <span className="font-semibold text-ink">
          FormalizeIt is not a law firm and does not provide legal advice.
        </span>{' '}
        This is a document workflow tool. Review the NDA before accepting or
        signing; consult a qualified attorney for high-stakes or unusual
        situations.
      </p>
    </div>
  );
}

export default LegalDisclaimer;

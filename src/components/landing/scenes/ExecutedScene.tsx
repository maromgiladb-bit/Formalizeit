'use client';

import type { CSSProperties } from 'react';
import { Seal } from '@/components/ui/seal';
import { SAMPLE_DEAL, SAMPLE_EVIDENCE } from '@/lib/landing/sampleDeal';
import { STORY_CARD, SceneFrame } from './_shared';

/** Labelled evidence rows, as in the copy deck. Every row is a field the product records. */
const ROWS: [string, string][] = [
  ['Signer', SAMPLE_EVIDENCE.signerEmail],
  ['Signed', SAMPLE_EVIDENCE.signedAtLabel],
  ['IP address', SAMPLE_EVIDENCE.ipAddress],
  ['NDA version', SAMPLE_EVIDENCE.versionLabel],
  ['Hash', `SHA-256  ${SAMPLE_EVIDENCE.hashShort}`],
  ['Authority', SAMPLE_EVIDENCE.authorityLine],
];

// Seal stamp per Ink & Seal: scale 1.15 to 1 + fade, 220ms; the Seal itself rests at -6deg.
const STAMP = 'transition-[opacity,transform] duration-[220ms] ease-[cubic-bezier(.2,.9,.3,1)] motion-reduce:transition-none';
const LINE = 'transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none';

export interface ExecutedSceneProps {
  /** false = not yet stamped (seal and evidence hidden), true = stamped. Default true. */
  stamped?: boolean;
  /** Seal size in px. Default 104. */
  sealSize?: number;
  /** Wait before the stamp lands when `stamped` turns true (lets an entering sheet settle). Default 0. */
  stampDelayMs?: number;
  className?: string;
  label?: string;
}

/** The executed NDA: the Seal stamps, then the signature evidence prints. Marked "Sample". */
export function ExecutedScene({ stamped = true, sealSize = 104, stampDelayMs = 0, className = '', label }: ExecutedSceneProps) {
  // The stamp and the evidence well land together; the lines print into it from 120ms, 50ms apart.
  const sealStyle: CSSProperties = { transitionDelay: stamped ? `${stampDelayMs}ms` : '0ms' };
  const lineStyle = (i: number): CSSProperties => ({
    transitionDelay: stamped ? `${stampDelayMs + 120 + i * 50}ms` : '0ms',
  });

  return (
    <SceneFrame
      className={className}
      label={label ?? `Sample signature evidence: signer email, timestamp, IP address, NDA version v${SAMPLE_DEAL.templateVersion} and a short agreement hash.`}
    >
      <div className={STORY_CARD}>
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Phones cap the seal at 112px so it sits beside the heading (layout size, not animated). */}
          <span className={`inline-block shrink-0 max-sm:[&>span]:h-28! max-sm:[&>span]:w-28! max-sm:[&_svg]:h-28! max-sm:[&_svg]:w-28! ${STAMP} ${stamped ? 'scale-100 opacity-100' : 'scale-[1.15] opacity-0'}`} style={sealStyle}>
            <Seal size={sealSize} version={SAMPLE_DEAL.templateVersion} label={`Signed ${SAMPLE_EVIDENCE.signedAtLabel}`} />
          </span>
          <div className="min-w-0">
            <p className="font-display text-xl font-bold leading-tight tracking-[-0.03em] text-ink sm:text-2xl">Signed by both parties</p>
            <p className="mt-1 font-doc-mono text-xs text-muted-ink">Sample record</p>
          </div>
        </div>

        {/* The evidence well lands with the seal (never an empty box waiting for its lines). */}
        <dl
          className={`mt-6 grid grid-cols-[auto_minmax(0,1fr)] gap-x-5 gap-y-1.5 rounded-control bg-ground px-4 py-3.5 font-doc-mono text-xs leading-relaxed ${LINE} ${
            stamped ? 'opacity-100' : 'opacity-0'
          }`}
          style={sealStyle}
        >
          {ROWS.map(([k, v], i) => (
            <div
              key={k}
              className={`col-span-2 grid grid-cols-subgrid ${LINE} ${stamped ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'}`}
              style={lineStyle(i)}
            >
              <dt className="text-muted-ink">{k}</dt>
              <dd className="min-w-0 whitespace-pre-wrap text-ink [overflow-wrap:anywhere]">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </SceneFrame>
  );
}

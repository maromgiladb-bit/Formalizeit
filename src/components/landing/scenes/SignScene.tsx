'use client';

import { Check, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SAMPLE_DEAL } from '@/lib/landing/sampleDeal';
import { greatVibes } from './fonts';
import { STORY_CARD, SceneFrame, T_COLOR, T_FADE, useTimeline } from './_shared';

const SIGNER = SAMPLE_DEAL.partyB.signatoryName;

/*
 * Frames: 0 rest (empty), 1 box ticked, 2 signature writes in (clip-path, 900ms),
 * 3 button wakes once the ink is down, 4 pressed (scale 0.97), 5 Signed.
 * Final state (SSR, reduced motion) = 5.
 */
const AT_MS = [250, 650, 1000, 1950, 2400, 2540] as const;
const SIGNED = AT_MS.length - 1;

export interface SignSceneProps {
  /** Plays the signing once when it turns true (off under reduced motion). */
  autoplay?: boolean;
  className?: string;
  label?: string;
}

/** Review-and-sign step: the NDA title, one authority line, the signature and the button. */
export function SignScene({ autoplay = false, className = '', label }: SignSceneProps) {
  const f = useTimeline(AT_MS, autoplay) ?? SIGNED;
  const ticked = f >= 1;
  const written = f >= 2;
  const ready = f >= 3;
  const pressed = f === 4;
  const signed = f >= 5;

  return (
    <SceneFrame
      className={className}
      label={label ?? 'The other side signs in their browser: a typed signature and a Submit Signature button that turns to Signed. No login screen.'}
    >
      <div className={STORY_CARD}>
        <div className="inline-flex items-center gap-1.5 font-doc-mono text-xs text-muted-ink">
          <Lock className="h-3.5 w-3.5" aria-hidden="true" />
          Secure NDA link
        </div>
        <p className="mt-1.5 font-display text-xl font-bold leading-tight tracking-[-0.03em] text-ink sm:text-2xl">{SAMPLE_DEAL.title}</p>

        <div className="mt-6 flex min-h-[104px] items-center justify-center rounded-control border border-line bg-white px-4 py-4">
          <span
            className={`${greatVibes.className} inline-block text-[44px] leading-none text-ink transition-[clip-path] duration-[900ms] ease-[cubic-bezier(.45,.05,.4,1)] motion-reduce:transition-none`}
            style={{ clipPath: written ? 'inset(-20% -5% -20% 0)' : 'inset(-20% 100% -20% 0)' }}
          >
            {SIGNER}
          </span>
        </div>

        <div className="mt-4 flex items-center gap-2.5 text-sm text-ink">
          <span
            className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border ${T_COLOR} ${
              ticked ? 'border-teal-800 bg-teal-800' : 'border-gray-300 bg-white'
            }`}
          >
            <Check className={`h-3 w-3 text-white ${T_FADE} ${ticked ? '' : 'scale-75 opacity-0'}`} strokeWidth={3} aria-hidden="true" />
          </span>
          I&apos;m authorized to sign for {SAMPLE_DEAL.partyB.name}
        </div>

        <Button
          type="button"
          shape="crisp"
          size="lg"
          tabIndex={-1}
          className={`mt-6 w-full transition-[background-color,opacity,transform] duration-150 ease-out motion-reduce:transition-none ${
            pressed ? 'scale-[0.97]' : 'scale-100'
          } ${signed ? 'bg-teal-700 hover:bg-teal-700' : ready ? '' : 'opacity-50'}`}
        >
          <span className="inline-grid">
            <span className={`col-start-1 row-start-1 ${T_FADE} ${signed ? 'opacity-0' : ''}`}>Submit Signature</span>
            <span className={`col-start-1 row-start-1 inline-flex items-center justify-center gap-1.5 ${T_FADE} ${signed ? '' : 'scale-95 opacity-0'}`}>
              <Check aria-hidden="true" />
              Signed
            </span>
          </span>
        </Button>
      </div>
    </SceneFrame>
  );
}

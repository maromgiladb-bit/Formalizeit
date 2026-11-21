'use client';

import type { CSSProperties } from 'react';
import { Lock } from 'lucide-react';
import { Sheet } from '@/components/ui/sheet';
import { FAN_OUT_DEALS, SAMPLE_DEAL } from '@/lib/landing/sampleDeal';
import { notoSerif } from './fonts';
import { NDA_BLOCKS, NDA_COUNTS, SceneFrame, T_FADE, blockText, clamp, useAutoplayStep } from './_shared';

const VERSION = `v${SAMPLE_DEAL.templateVersion}`;
/** Opening words of the real agreement, as the locked text's face. */
const OPENING = `${blockText(NDA_BLOCKS[1]).split(' ').slice(0, 18).join(' ')}...`;

export interface FanOutSceneProps {
  /** 0..3 deals fanned out from the one locked text. Default 3. */
  step?: number;
  /** Plays `step` 0..3 once on a timer (off under reduced motion). */
  autoplay?: boolean;
  /** 'lg' for a scene that carries a desktop column on its own. Default 'md'. */
  size?: 'md' | 'lg';
  className?: string;
  label?: string;
}

/** "One text, many deals": the locked standard NDA fanning out to three deals. */
export function FanOutScene({ step = FAN_OUT_DEALS.length, autoplay = false, size = 'md', className = '', label }: FanOutSceneProps) {
  const lg = size === 'lg';
  const shown = clamp(Math.round(useAutoplayStep(step, FAN_OUT_DEALS.length, autoplay, 900)), 0, FAN_OUT_DEALS.length);
  const delay = (i: number): CSSProperties => ({ transitionDelay: `${i * 60}ms` });

  return (
    <SceneFrame
      className={className}
      label={label ?? 'The same locked NDA text fanning out to three deals, each with its own company name and date.'}
    >
      {/* Laid out by its own width (container query), not the viewport: side by side only when the
          scene itself is at least 36rem wide; in a half column it stacks, so the cards never crush. */}
      <div className="@container">
        <div
          className={`grid items-center gap-4 @xl:grid-cols-[minmax(0,15rem)_4rem_minmax(0,1fr)] ${
            lg ? '@3xl:grid-cols-[minmax(0,19rem)_4.5rem_minmax(0,1fr)] @3xl:gap-5' : ''
          }`}
        >
          <Sheet
            meta={
              <span className="inline-flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                One legal text · {VERSION}
              </span>
            }
          >
            <p className={`${notoSerif.className} px-4 py-3 text-xs leading-relaxed text-ink ${lg ? 'lg:px-5 lg:py-4 lg:text-sm' : ''}`}>{OPENING}</p>
            <p className="border-t border-line px-4 py-2 font-doc-mono text-xs text-muted-ink">
              {NDA_COUNTS.legalWords.toLocaleString('en-US')} words, fixed
            </p>
          </Sheet>
  
          <svg viewBox="0 0 64 120" preserveAspectRatio="none" className={`hidden h-full min-h-32 text-teal-800 @xl:block ${lg ? 'w-16 @3xl:w-[4.5rem]' : 'w-16'}`} aria-hidden="true">
            {[20, 60, 100].map((y, i) => (
              <path
                key={y}
                d={`M0 60 C 32 60, 32 ${y}, 64 ${y}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.25"
                vectorEffect="non-scaling-stroke"
                className={`transition-opacity duration-200 motion-reduce:transition-none ${i < shown ? 'opacity-60' : 'opacity-0'}`}
                style={delay(i)}
              />
            ))}
          </svg>
  
          <ul className={`flex flex-col justify-between gap-2.5 ${lg ? 'lg:gap-4' : ''}`}>
            {FAN_OUT_DEALS.map((deal, i) => (
              <li
                key={deal.party}
                className={`flex items-center gap-3 rounded-sheet border border-line bg-white px-3.5 py-2.5 ${lg ? 'lg:px-5 lg:py-4' : ''} ${T_FADE} ${
                  i < shown ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0'
                }`}
                style={delay(i)}
              >
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-sm font-semibold text-ink ${lg ? 'lg:text-base' : ''}`}>{deal.party}</p>
                  <p className="font-doc-mono text-xs text-muted-ink">{deal.date}</p>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1 rounded bg-tint px-2 py-1 font-doc-mono text-xs font-medium text-teal-800">
                  <Lock className="h-3 w-3" aria-hidden="true" />
                  {VERSION}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </SceneFrame>
  );
}

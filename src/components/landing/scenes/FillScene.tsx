'use client';

import { Lock } from 'lucide-react';
import { FILL_ORDER, SAMPLE_DEAL, type FillFieldId } from '@/lib/landing/sampleDeal';
import { STORY_CARD, SceneFrame, T_COLOR, useTimeline } from './_shared';

/** The four fields that type in (Party A comes from the saved company profile in the app). */
const TYPED_IDS: FillFieldId[] = ['partyB', 'purpose', 'effectiveDate', 'term'];
const FIELDS = TYPED_IDS.map((id) => FILL_ORDER.find((f) => f.id === id)).filter(
  (f): f is (typeof FILL_ORDER)[number] => f !== undefined,
);

/** The fill page's own placeholders (src/app/fillndahtml/page.tsx). */
const PLACEHOLDER: Partial<Record<FillFieldId, string>> = {
  partyB: 'Enter party name',
  purpose: 'e.g., evaluating a potential business relationship',
  effectiveDate: 'Pick a date',
  term: 'e.g., 12',
};

/*
 * Typing timeline, built once. Frame = { field, chars }. A person types in bursts: 33-49ms per
 * character (deterministic jitter, so every play is identical), a little longer after a space or
 * comma, and a ~250ms beat moving to the next field. About 4s in all, then it rests.
 */
type Frame = { field: number; chars: number };
const FRAMES: Frame[] = [];
const AT_MS: number[] = [];
{
  let t = 250;
  FIELDS.forEach((f, fi) => {
    FRAMES.push({ field: fi, chars: 0 });
    AT_MS.push(t);
    t += 120; // focus lands, then the first key
    for (let c = 1; c <= f.value.length; c++) {
      FRAMES.push({ field: fi, chars: c });
      AT_MS.push(t);
      const prev = f.value[c - 1];
      const jitter = (c * 7919 + fi * 104729) % 17; // 0..16
      t += 33 + jitter + (prev === ' ' || prev === ',' ? 30 : 0);
    }
    t += 250;
  });
  FRAMES.push({ field: FIELDS.length, chars: 0 }); // done: no active field
  AT_MS.push(t - 100);
}

export interface FillSceneProps {
  /** Types the fields in once, character by character, when it turns true (off under reduced motion). */
  autoplay?: boolean;
  className?: string;
  label?: string;
}

/** Fill step: a few calm fields that type themselves in. Final state (SSR, reduced motion): all filled. */
export function FillScene({ autoplay = false, className = '', label }: FillSceneProps) {
  const frameIndex = useTimeline(AT_MS, autoplay);
  const frame = frameIndex === null ? null : FRAMES[frameIndex];

  return (
    <SceneFrame
      className={className}
      label={label ?? 'Form fields for the other party, purpose, effective date and term, typing themselves in.'}
    >
      <div className={STORY_CARD}>
        <div className="inline-flex items-center gap-1.5 font-doc-mono text-xs text-muted-ink">
          <Lock className="h-3.5 w-3.5" aria-hidden="true" />
          Legal text locked
        </div>
        <p className="mt-1.5 font-display text-xl font-bold leading-tight tracking-[-0.03em] text-ink sm:text-2xl">{SAMPLE_DEAL.title}</p>

        <div className="mt-5 space-y-3.5">
          {FIELDS.map((field, i) => {
            const active = frame !== null && frame.field === i;
            const text = frame === null || i < frame.field ? field.value : active ? field.value.slice(0, frame.chars) : '';
            return (
              <div key={field.id}>
                <div className="mb-1.5 text-sm font-medium text-muted-ink">{field.label}</div>
                <div
                  className={`flex h-11 items-center rounded-control border bg-white px-3.5 text-[15px] text-ink ${T_COLOR} ${
                    active ? 'border-teal-700 ring-2 ring-teal-700/25' : 'border-line'
                  }`}
                >
                  {text ? <span className="truncate whitespace-pre">{text}</span> : null}
                  {!text && !active ? <span className="truncate text-gray-500">{PLACEHOLDER[field.id]}</span> : null}
                  {/* Solid caret while typing, as a real one is; no blink. */}
                  {active ? <span className="ml-px inline-block h-5 w-[1.5px] shrink-0 bg-teal-800" aria-hidden="true" /> : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </SceneFrame>
  );
}

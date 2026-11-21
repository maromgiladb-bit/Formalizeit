'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { prefersReducedMotion, usePlayOnce } from '@/components/landing/motion/hooks';
import { NDA_TEXT } from '@/lib/landing/ndaText.generated';
import type { NdaBlock, NdaSegment } from '@/lib/landing/ndaText';
import { TEMPLATE_KEY_FILL_STEP } from '@/lib/landing/sampleDeal';

/** Color-family transitions (paint only). Named properties, never `transition-all`. */
export const T_COLOR =
  'transition-[color,background-color,border-color] duration-200 ease-out motion-reduce:transition-none';
/** Fade/slide transitions (composite only). */
export const T_FADE = 'transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none';

/**
 * Wraps a scene as one illustration: screen readers get `label`, and the inner mock UI is
 * `inert` (not focusable, not announced), so fake buttons and links never take focus.
 */
export function SceneFrame({ label, className = '', children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <figure role="img" aria-label={label} className={`m-0 ${className}`}>
      <div inert>{children}</div>
    </figure>
  );
}

export const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/**
 * Optional autoplay for scenes: when `enabled` turns true, plays 0..max once and rests on max
 * (never loops, so no pause control is needed). Turning it off freezes; on again replays.
 * Server render, reduced motion and "not started" return `value`, the controlled state.
 */
export function useAutoplayStep(
  value: number,
  max: number,
  enabled: boolean,
  intervalMs = 1400,
  opts: { startDelayMs?: number } = {},
): number {
  const index = usePlayOnce(max, { enabled, intervalMs, startDelayMs: opts.startDelayMs });
  return index ?? value;
}

/**
 * Play-once timeline with uneven beats: when `enabled` turns true, steps through frames 0..n-1,
 * frame i landing `atMs[i]` ms after start, then rests on the last. Returns null before it
 * starts (server render, reduced motion, never enabled) so callers render their final state.
 * Turning `enabled` off freezes on the current frame; on again replays from the start.
 */
export function useTimeline(atMs: readonly number[], enabled: boolean): number | null {
  const [frame, setFrame] = useState<number | null>(null);
  useEffect(() => {
    if (!enabled || prefersReducedMotion()) return;
    const timers = atMs.map((t, i) => window.setTimeout(() => setFrame(i), t));
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [atMs, enabled]);
  return frame;
}

/** The calm card every story scene sits on: one white sheet, generous padding. */
export const STORY_CARD = 'rounded-sheet border border-line bg-white p-5 shadow-sheet sm:p-7';

/* ─── NDA text helpers (from the real template, see src/lib/landing/ndaText.ts) ─── */

export const NDA_BLOCKS = NDA_TEXT.blocks;
export const NDA_COUNTS = NDA_TEXT.counts;

export function blockText(block: NdaBlock): string {
  return block.segments.map((s) => s.text).join('');
}

/** Heading of section `n` plus its first `clauses` text blocks. */
export function sectionBlocks(n: number, clauses = 1): NdaBlock[] {
  const start = NDA_BLOCKS.findIndex((b) => b.kind === 'heading' && blockText(b).startsWith(`${n})`));
  if (start === -1) return [];
  const out: NdaBlock[] = [NDA_BLOCKS[start]];
  for (let i = start + 1; i < NDA_BLOCKS.length && out.length <= clauses; i++) {
    if (NDA_BLOCKS[i].kind !== 'text') break;
    out.push(NDA_BLOCKS[i]);
  }
  return out;
}

/** Fill step (1-based, FILL_ORDER) that supplies a variable; 0 = always shown. */
export function fillStepOf(seg: NdaSegment): number {
  return (seg.key && TEMPLATE_KEY_FILL_STEP[seg.key]) || 0;
}

/** A variable blank in the readable document: underlined gap until filled, then teal tint. */
export function DocVariable({ filled, children }: { filled: boolean; children: ReactNode }) {
  return (
    <span
      className={`border-b px-px ${T_COLOR} ${
        filled ? 'border-teal-300 bg-teal-50 text-ink' : 'border-gray-400 bg-transparent text-transparent'
      }`}
    >
      {children}
    </span>
  );
}

/** Renders one text block's segments, filling variables whose step is <= `filled`. */
export function DocRun({ block, filled }: { block: NdaBlock; filled: number }) {
  return (
    <>
      {block.segments.map((seg, i) =>
        seg.isVariable ? (
          <DocVariable key={i} filled={fillStepOf(seg) <= filled}>
            {seg.text}
          </DocVariable>
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </>
  );
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

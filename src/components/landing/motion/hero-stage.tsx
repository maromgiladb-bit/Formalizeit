'use client';

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { MotionStyles } from './motion-styles';
import { failsafeFired, gateAttrs, prefersReducedMotion, usePlayOnce, type GateState } from './hooks';

interface HeroStageProps {
  /** Last index of the sequence (the final, resting state). */
  last: number;
  /** Time between indexes, ms. */
  intervalMs: number;
  /** Extra hold on index 0 before the first step, ms (covers the reveal). */
  startDelayMs?: number;
  /** Delay before the visual rises in once hydrated, ms. */
  revealDelayMs?: number;
  className?: string;
  /** Render the visual for an index; `null` means the final state (server, no-JS, reduced, late). */
  children: (index: number | null) => ReactNode;
}

/**
 * Above-the-fold product sequence that never shows final-then-empty.
 *
 * - Server / no-JS: the final state, visible.
 * - Scripted (`html.js`): the visual is hidden until hydration. Hydration sets index 0 while still
 *   hidden, then the visual rises in (450ms, house ease-out) already at its start, and plays once.
 * - Hydration slower than FAILSAFE_MS (1800ms): CSS has already shown the final state, so it stays
 *   final and static. No snap back, ever.
 * - Reduced motion: final state, shown at once.
 */
export function HeroStage({ last, intervalMs, startDelayMs = 0, revealDelayMs = 0, className, children }: HeroStageProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<GateState>('idle');
  const [play, setPlay] = useState(false);
  const index = usePlayOnce(last, { enabled: play, intervalMs, startDelayMs: startDelayMs + revealDelayMs });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion() || failsafeFired(el)) {
      setState('in');
      return;
    }
    setState('armed');
    setPlay(true);
  }, []);

  // Reveal only after index 0 is on the page, two frames later so the start state is painted hidden.
  useEffect(() => {
    if (index !== 0 || state !== 'armed') return;
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setState('in'));
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [index, state]);

  return (
    <div ref={ref} className={className} {...gateAttrs('manual', state)}>
      <MotionStyles />
      <div data-lm-t="rise" style={revealDelayMs ? ({ ['--lm-delay' as string]: `${revealDelayMs}ms` } as CSSProperties) : undefined}>
        {children(index)}
      </div>
    </div>
  );
}

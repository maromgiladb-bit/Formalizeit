'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';
import { useInView, useMotionValueEvent, useScroll, type MotionValue, type UseScrollOptions } from 'framer-motion';
import { FAILSAFE_MS } from './tokens';

export type MotionTrigger = 'load' | 'view' | 'manual';
export type GateState = 'idle' | 'armed' | 'in';

const REDUCED_QUERY = '(prefers-reduced-motion: reduce)';

/** Synchronous reduced-motion read for effects (false on the server). */
export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia(REDUCED_QUERY).matches;
}

/** True once the CSS failsafe has already revealed this element (hydration was late). */
export function failsafeFired(el: HTMLElement): boolean {
  if (typeof el.getAnimations !== 'function') return performance.now() > FAILSAFE_MS - 150;
  return el.getAnimations({ subtree: true }).some((a) => {
    if (!(a instanceof CSSAnimation) || a.animationName !== 'lm-failsafe') return false;
    const t = a.currentTime;
    return a.playState === 'finished' || (typeof t === 'number' && t >= FAILSAFE_MS);
  });
}

interface GateOptions {
  trigger: MotionTrigger;
  /** For `manual`: whether the host is in its final state. */
  active?: boolean;
  /** IntersectionObserver rootMargin for `view`. */
  margin?: string;
  /** Set false to turn the gate off (state stays `idle`, nothing is hidden). */
  enabled?: boolean;
}

/**
 * Drives `data-lm-state` on a host (see motion-styles.tsx). Two renders at most per host:
 * armed on mount, in when it enters the viewport (`view`) or when `active` turns true (`manual`).
 * Reduced motion and late hydration go straight to `in`. `load` hosts need no JavaScript at all.
 */
export function useMotionGate<T extends HTMLElement>({
  trigger,
  active = true,
  margin = '0px 0px -12% 0px',
  enabled = true,
}: GateOptions): { ref: RefObject<T | null>; state: GateState } {
  const ref = useRef<T>(null);
  const [state, setState] = useState<GateState>('idle');
  const settled = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!enabled || trigger === 'load' || !el) return;
    if (prefersReducedMotion() || failsafeFired(el) || typeof IntersectionObserver === 'undefined') {
      settled.current = true;
      setState('in');
      return;
    }
    if (trigger === 'manual') {
      setState(active ? 'in' : 'armed');
      return;
    }
    setState('armed');
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setState('in');
          io.disconnect();
        }
      },
      { rootMargin: margin },
    );
    io.observe(el);
    return () => io.disconnect();
    // `active` is handled by the effect below; re-arming on every toggle would replay the gate.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, trigger, margin]);

  useEffect(() => {
    if (!enabled || trigger !== 'manual' || settled.current) return;
    setState((s) => (s === 'idle' ? s : active ? 'in' : 'armed'));
  }, [enabled, trigger, active]);

  return { ref, state };
}

/** Attributes a gated host spreads onto its element. */
export function gateAttrs(trigger: MotionTrigger, state: GateState): Record<string, string | undefined> {
  return {
    'data-lm-trigger': trigger,
    'data-lm-state': state === 'idle' ? undefined : state,
  };
}

/** True once the element has entered the viewport. Never flips back. */
export function useInViewOnce<T extends Element>(ref: RefObject<T | null>, margin = '0px 0px -12% 0px'): boolean {
  return useInView(ref, { once: true, margin: margin as NonNullable<Parameters<typeof useInView>[1]>['margin'] });
}

export type ScrollOffset = UseScrollOptions['offset'];

interface ScrollStepResult {
  /** Discrete step, 0..count-1. Re-renders only when it changes. */
  step: number;
  /** Raw 0..1 progress through the section, for scenes that take `progress` (no re-renders). */
  progress: MotionValue<number>;
}

/**
 * Maps a section's scroll progress to a step index. Before mount the step is the last one, so the
 * server and no-JS render show the scene's final state. Reduced motion still gets steps (they are
 * state, not movement); the scenes decide not to animate between them.
 */
export function useScrollStep<T extends HTMLElement>(
  ref: RefObject<T | null>,
  count: number,
  offset: ScrollOffset = ['start center', 'end center'],
): ScrollStepResult {
  const { scrollYProgress } = useScroll({ target: ref, offset });
  const [step, setStep] = useState(Math.max(0, count - 1));

  const toStep = (v: number) => Math.min(count - 1, Math.max(0, Math.floor(v * count)));

  useEffect(() => {
    setStep(toStep(scrollYProgress.get()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, scrollYProgress]);

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    const next = toStep(v);
    setStep((s) => (s === next ? s : next));
  });

  return { step, progress: scrollYProgress };
}

interface PlayOnceOptions {
  /** Start (or restart from 0) when this turns true. Turning it false freezes the current index. */
  enabled: boolean;
  /** Index 0 shows at once and holds for `startDelayMs + intervalMs`; then one step per interval. */
  startDelayMs?: number;
  /** Time between indexes, ms. */
  intervalMs: number;
}

/**
 * Plays 0..last once, then rests on `last`. Returns null while it has not started (render the
 * controlled/final value then). Never loops, so it needs no pause control. Reduced motion: null.
 * Index 0 is set the moment it starts: only start it on content that is hidden or off screen
 * (pinned story steps, HeroStage), never on a server-rendered final state the visitor can see.
 */
export function usePlayOnce(last: number, { enabled, startDelayMs = 0, intervalMs }: PlayOnceOptions): number | null {
  const [index, setIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!enabled || prefersReducedMotion()) return;
    const timers: number[] = [];
    setIndex(0);
    for (let i = 1; i <= last; i++) {
      timers.push(window.setTimeout(() => setIndex(i), startDelayMs + i * intervalMs));
    }
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [enabled, last, startDelayMs, intervalMs]);

  return index;
}

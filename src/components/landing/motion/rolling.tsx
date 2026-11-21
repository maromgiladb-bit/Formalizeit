'use client';

import { useEffect, useState } from 'react';
import { MotionStyles } from './motion-styles';
import { gateAttrs, useMotionGate } from './hooks';
import { CSS_EASE, DUR, STAGGER } from './tokens';

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'] as const;
/**
 * Each digit column is a 1em window (line-height 1em, so it never grows the parent's line box and
 * stays inside display type set at 0.9 leading). Strip rows are taller than the window (1.4em), so
 * a neighbouring digit is 0.4em clear of the edge: mid-roll the incoming and outgoing digits never
 * show above or below the line.
 */
const LINE = '1em';
const ROW = '1.4em';

interface RollingTextProps {
  text: string;
  instant: boolean;
  durationMs: number;
  staggerMs: number;
  /** Pull separators in (monospace fonts give a colon a full digit cell). */
  tight: boolean;
}

/**
 * Odometer text. Every character keeps its natural advance (an invisible copy of the real glyph
 * sizes each digit column), so separators sit tight exactly as in plain text with the parent's
 * letter-spacing and figures. Over each sizer sits a 0-9 strip moved with translateY only:
 * one composited transform per column per change, no React work per frame. Each column clips its
 * own strip with clip-path, which does not change layout or the baseline. Columns are keyed from the
 * right so "9" to "10" keeps the ones column in place.
 */
function RollingText({ text, instant, durationMs, staggerMs, tight }: RollingTextProps) {
  const chars = Array.from(text);
  const n = chars.length;
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-block',
        lineHeight: LINE,
        whiteSpace: 'nowrap',
      }}
    >
      {chars.map((c, i) => {
        const fromRight = n - i;
        if (!/[0-9]/.test(c)) {
          return (
            <span key={`s${fromRight}`} style={tight ? { marginInline: '-0.14em' } : undefined}>
              {c}
            </span>
          );
        }
        const d = Number(c);
        return (
          <span key={`d${fromRight}`} style={{ position: 'relative', display: 'inline-block', clipPath: 'inset(0 -0.1em)' }}>
            <span style={{ visibility: 'hidden' }}>{c}</span>
            <span
              data-lm-roll=""
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                textAlign: 'center',
                transform: `translate3d(0, ${-d * 10}%, 0)`,
                transition: instant ? 'none' : `transform ${durationMs}ms ${CSS_EASE.inOut} ${i * staggerMs}ms`,
              }}
            >
              {DIGITS.map((x) => (
                <span key={x} style={{ display: 'block', height: ROW, lineHeight: LINE }}>
                  {x}
                </span>
              ))}
            </span>
          </span>
        );
      })}
    </span>
  );
}

interface RollingValueProps {
  /** Final text, rendered on the server and read by assistive tech. */
  value: string;
  /** If set, the value rolls from this text on first viewport entry. Same length as `value`. */
  from?: string;
  /** Accessible text; defaults to `value`. */
  label?: string;
  className?: string;
  durationMs?: number;
  staggerMs?: number;
  /** Jump to `value` without rolling (e.g. resetting a sequence before it plays). */
  instant?: boolean;
  /** Pull separators in; set for monospace fonts. */
  tightSeparators?: boolean;
}

type Phase = 'final' | 'from' | 'rolling';

/**
 * Shared engine for Counter and Clock. Without `from` it is controlled: change `value` and the
 * digits roll to it (280ms, inOut, 40ms column stagger). With `from` it fades in on view showing
 * `from`, then rolls to `value`. Server, no-JS and reduced motion: `value`, static.
 */
export function RollingValue({
  value,
  from,
  label,
  className,
  durationMs = DUR.sheet,
  staggerMs = STAGGER.digit,
  instant: forceInstant = false,
  tightSeparators = false,
}: RollingValueProps) {
  const gated = from !== undefined;
  const { ref, state } = useMotionGate<HTMLSpanElement>({ trigger: 'view', enabled: gated });
  const [mounted, setMounted] = useState(false);
  const [phase, setPhase] = useState<Phase>('final');

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!gated) return;
    if (state === 'armed') setPhase('from');
    if (state !== 'in') return;
    let raf2 = 0;
    // Two frames so the `from` digits are committed before the roll starts.
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setPhase((p) => (p === 'from' ? 'rolling' : p)));
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [gated, state]);

  const text = phase === 'from' && from !== undefined ? from : value;
  const instant = forceInstant || !mounted || phase === 'from';

  return (
    <span ref={ref} className={className} {...(gated ? gateAttrs('view', state) : {})}>
      {gated ? <MotionStyles /> : null}
      <span className="sr-only">{label ?? value}</span>
      <span data-lm-t={gated ? 'fade' : undefined}>
        <RollingText text={text} instant={instant} durationMs={durationMs} staggerMs={staggerMs} tight={tightSeparators} />
      </span>
    </span>
  );
}

interface CounterProps {
  /** A real number (word counts, variable counts). Never an invented metric. */
  value: number;
  /** Roll up from zeros on first view. Default true. */
  rollIn?: boolean;
  format?: (n: number) => string;
  label?: string;
  className?: string;
}

const defaultFormat = (n: number) => n.toLocaleString('en-US');

/**
 * A number that rolls up from 0 on first view, odometer style: 800ms per column (marketing pace,
 * inOut so it settles softly), 60ms apart left to right.
 */
export function Counter({ value, rollIn = true, format = defaultFormat, label, className }: CounterProps) {
  const text = format(value);
  return (
    <RollingValue
      value={text}
      from={rollIn ? text.replace(/[0-9]/g, '0') : undefined}
      label={label ?? text}
      durationMs={800}
      staggerMs={STAGGER.item}
      className={className}
    />
  );
}

interface ClockProps {
  /** "HH:MM". Change it (from a scroll step or a timeline) and the digits roll there. */
  time: string;
  /** Optional "HH:MM" to roll from on first view (e.g. "09:00" to "09:41"). */
  from?: string;
  /** Accessible label, e.g. "09:41, example time". Defaults to `time`. */
  label?: string;
  className?: string;
  /** Roll duration per change, ms. Default 280; use 160 when scroll drives it minute by minute. */
  durationMs?: number;
  /** Jump without rolling (resetting a sequence). */
  instant?: boolean;
}

/**
 * Mono deal clock for direction C. Not a live region (aria-live off): screen readers get one
 * stable label, never a stream of ticks. Use `font-doc-mono` in `className`.
 */
export function Clock({ time, from, label, className, durationMs, instant }: ClockProps) {
  return (
    <span aria-live="off">
      <RollingValue value={time} from={from} label={label ?? time} className={className} durationMs={durationMs} instant={instant} tightSeparators />
    </span>
  );
}

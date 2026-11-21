'use client';

import { createContext, createElement, useContext, type CSSProperties, type ReactNode } from 'react';
import { MotionStyles } from './motion-styles';
import { gateAttrs, useMotionGate, type MotionTrigger } from './hooks';
import { STAGGER } from './tokens';

type HostTag = 'div' | 'section' | 'header' | 'ul' | 'ol' | 'span' | 'figure';
type ItemTag = 'div' | 'span' | 'li' | 'p' | 'figure';
export type RevealKind = 'rise' | 'fade' | 'stamp';

const StaggerContext = createContext<number>(STAGGER.block);

function delayStyle(ms: number, style?: CSSProperties): CSSProperties | undefined {
  if (!ms) return style;
  return { ...style, ['--lm-delay' as string]: `${Math.round(ms)}ms` } as CSSProperties;
}

interface SequenceProps {
  children: ReactNode;
  /**
   * load: plays from first paint in pure CSS (hero). view: once, on viewport entry.
   * manual: follows `active` both ways (scroll-story steps); leaving is fast and unstaggered.
   */
  trigger?: MotionTrigger;
  active?: boolean;
  /** Milliseconds between `order` steps of the items. Default 80. */
  stagger?: number;
  as?: HostTag;
  className?: string;
  /** IntersectionObserver rootMargin for `view`. */
  margin?: string;
}

/**
 * A choreographed group. Items inside (SeqItem) rise, fade or stamp in by `order`.
 * Server and no-JS render: everything visible. Reduced motion: final state, no movement.
 */
export function Sequence({
  children,
  trigger = 'view',
  active = true,
  stagger = STAGGER.block,
  as = 'div',
  className,
  margin,
}: SequenceProps) {
  const { ref, state } = useMotionGate<HTMLElement>({ trigger, active, margin });
  return (
    <StaggerContext.Provider value={stagger}>
      <MotionStyles />
      {createElement(as, { ref, className, ...gateAttrs(trigger, state) }, children)}
    </StaggerContext.Provider>
  );
}

interface SeqItemProps {
  children: ReactNode;
  kind?: RevealKind;
  /** Position in the sequence; delay = order x stagger. */
  order?: number;
  /** Absolute delay in ms; overrides `order`. */
  delayMs?: number;
  as?: ItemTag;
  className?: string;
  style?: CSSProperties;
}

/** One animated element inside a Sequence. Rise = fade up 24px, 450ms; stamp = 1.15 to 1, 220ms. */
export function SeqItem({ children, kind = 'rise', order = 0, delayMs, as = 'div', className, style }: SeqItemProps) {
  const stagger = useContext(StaggerContext);
  const ms = delayMs ?? order * stagger;
  return createElement(as, { className, 'data-lm-t': kind, style: delayStyle(ms, style) }, children);
}

interface StampInProps {
  children: ReactNode;
  trigger?: MotionTrigger;
  active?: boolean;
  delayMs?: number;
  className?: string;
}

/**
 * The seal moment: scale 1.15 to 1 with opacity, 220ms, house ease-out. Wrap a `<Seal />` (without
 * its own `animate` prop). For evidence lines that follow, use a Sequence with a stamp item at
 * order 0 and rise items at delayMs 160, 220, 280 instead.
 */
export function StampIn({ children, trigger = 'view', active = true, delayMs = 0, className }: StampInProps) {
  return (
    <Sequence as="span" trigger={trigger} active={active} className={className}>
      <SeqItem as="span" kind="stamp" delayMs={delayMs}>
        {children}
      </SeqItem>
    </Sequence>
  );
}

type LineTag = 'h1' | 'h2' | 'h3' | 'p';

interface LineRevealProps {
  /** One entry per visual line. Keep lines short enough not to wrap at 375px, or accept a wrapped block. */
  lines: readonly ReactNode[];
  as?: LineTag;
  /** view (default) or load. Avoid on the hero h1: the headline must be readable at first paint. */
  trigger?: Exclude<MotionTrigger, 'manual'>;
  /** Delay before the first line, ms. */
  delayMs?: number;
  /** Between lines, ms. Default 80. */
  stagger?: number;
  className?: string;
  lineClassName?: string;
  margin?: string;
}

/**
 * Masked heading reveal: each line rises out of its own clip (translateY 105% to 0, 450ms, house
 * ease-out, 80ms apart). Transform only, so the text is real, selectable and read normally by
 * screen readers. No-JS and reduced motion: plain heading.
 */
export function LineReveal({
  lines,
  as = 'h2',
  trigger = 'view',
  delayMs = 0,
  stagger = STAGGER.block,
  className,
  lineClassName,
  margin,
}: LineRevealProps) {
  const { ref, state } = useMotionGate<HTMLHeadingElement>({ trigger, margin });
  const content = lines.map((line, i) => (
    <span key={i} data-lm-mask="">
      <span data-lm-t="line" className={lineClassName} style={delayStyle(delayMs + i * stagger)}>
        {line}
      </span>
      {i < lines.length - 1 ? ' ' : null}
    </span>
  ));
  return (
    <>
      <MotionStyles />
      {createElement(as, { ref, className, ...gateAttrs(trigger, state) }, content)}
    </>
  );
}

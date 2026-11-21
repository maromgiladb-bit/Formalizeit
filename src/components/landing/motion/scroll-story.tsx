'use client';

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useInView, useScroll, type MotionValue } from 'framer-motion';
import { MotionStyles } from './motion-styles';

/** Matches the pinned-layout media query in motion-styles.tsx. */
const PINNED_QUERY = '(min-width: 1024px) and (prefers-reduced-motion: no-preference)';

export interface ScrollStoryStep {
  id: string;
  /** The step's text (heading + paragraph). Rendered once; never duplicated. */
  content: ReactNode;
}

export interface StoryVisualContext {
  /** True for the stacked pinned visuals; false for the static per-step visuals. */
  pinned: boolean;
  /** Pinned only: this step is the one on screen. Start autoplay / stamps on this. */
  active: boolean;
  /** 0..1 through the whole story (pinned visuals only). Read it with framer hooks, not state. */
  progress: MotionValue<number> | null;
}

interface ScrollStoryProps {
  steps: readonly ScrollStoryStep[];
  /** Render the scene for a step. Called twice per step: static (stacked) and pinned. */
  renderVisual: (step: number, ctx: StoryVisualContext) => ReactNode;
  visualSide?: 'left' | 'right';
  /** Sticky offset of the visual column from the viewport top (clears the nav). Default 7rem. */
  stickyTop?: string;
  className?: string;
  /** Class on each step's text block. */
  stepClassName?: string;
  /** Class on the per-step static visual (stacked layout). */
  inlineVisualClassName?: string;
  /** Called when the active step changes (pinned layout only). */
  onStepChange?: (step: number) => void;
}

/**
 * Pinned scrollytelling for direction A.
 *
 * Desktop (>=1024px), scripted, motion OK: two columns. Text steps are top-aligned and start right
 * under the section heading; the visual column sticks `stickyTop` from the viewport top. The active
 * step is the one crossing a line 40% down the viewport. All step visuals share one grid cell, so
 * the column never changes height; a change is one deliberate move: the old visual leaves in 150ms
 * (fade, 8px up), the new one settles in 280ms after a 100ms beat (fade, 12px rise, 0.985 to 1).
 * Inactive text dims to 45%.
 * Mobile, no-JS and reduced motion: stacked; each step's text is followed by its own static visual.
 * The switch is pure CSS, so there is no hydration mismatch and no layout jump.
 */
export function ScrollStory({
  steps,
  renderVisual,
  visualSide = 'right',
  stickyTop = '7rem',
  className,
  stepClassName,
  inlineVisualClassName,
  onStepChange,
}: ScrollStoryProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<Array<HTMLLIElement | null>>([]);
  const [active, setActive] = useState(0);
  const { scrollYProgress } = useScroll({ target: rootRef, offset: ['start start', 'end end'] });
  // `active` in the visual context is only true while the story is actually on screen, so
  // scenes never play their one-shot sequence out of sight.
  const onScreen = useInView(rootRef, { margin: '0px 0px -40% 0px' });
  const onStepChangeRef = useRef(onStepChange);

  useEffect(() => {
    onStepChangeRef.current = onStepChange;
  }, [onStepChange]);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const mq = window.matchMedia(PINNED_QUERY);
    let io: IntersectionObserver | null = null;

    const start = () => {
      io?.disconnect();
      io = null;
      if (!mq.matches) return;
      io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            const i = stepRefs.current.indexOf(entry.target as HTMLLIElement);
            if (i >= 0) setActive(i);
          }
        },
        // A zero-height line 40% down the viewport.
        { rootMargin: '-40% 0px -60% 0px' },
      );
      for (const el of stepRefs.current) if (el) io.observe(el);
    };

    start();
    mq.addEventListener('change', start);
    return () => {
      mq.removeEventListener('change', start);
      io?.disconnect();
    };
  }, [steps.length]);

  useEffect(() => {
    onStepChangeRef.current?.(active);
  }, [active]);

  return (
    <div
      ref={rootRef}
      className={className ? `lm-story ${className}` : 'lm-story'}
      data-side={visualSide}
      style={{ '--lm-story-top': stickyTop } as CSSProperties}
    >
      <MotionStyles />
      <ol className="lm-story-steps">
        {steps.map((s, i) => (
          <li
            key={s.id}
            ref={(el) => {
              stepRefs.current[i] = el;
            }}
            data-lm-step=""
            data-active={i === active ? '' : undefined}
          >
            <div className={stepClassName ? `lm-story-text ${stepClassName}` : 'lm-story-text'}>{s.content}</div>
            <div className={inlineVisualClassName ? `lm-story-inline ${inlineVisualClassName}` : 'lm-story-inline'}>
              {renderVisual(i, { pinned: false, active: false, progress: null })}
            </div>
          </li>
        ))}
      </ol>
      <div className="lm-story-pin">
        <div className="lm-story-pin-inner">
          {steps.map((s, i) => (
            <div
              key={s.id}
              className="lm-story-visual"
              data-active={i === active ? '' : undefined}
              data-past={i < active ? '' : undefined}
              aria-hidden={i === active ? undefined : true}
            >
              {renderVisual(i, { pinned: true, active: onScreen && i === active, progress: scrollYProgress })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

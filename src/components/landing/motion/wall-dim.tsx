'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { useScroll } from 'framer-motion';
import { MotionStyles } from './motion-styles';
import { prefersReducedMotion, type ScrollOffset } from './hooks';

export type WallMode = 'dim' | 'lit';

interface WallDimProps {
  /**
   * Render the wall in a mode. Both renders must have identical layout (same text, font, size,
   * padding); only colour and background may differ.
   * - dim: legal text faded (e.g. text-gray-300), variables lit (teal text, bg-tint). The final
   *   state, and the only copy assistive tech reads.
   * - lit: everything in ink, variables plain. The "before" picture.
   */
  children: (mode: WallMode) => ReactNode;
  /** Background of the lit layer; must match the surface so it fully covers the dim layer. */
  litClassName?: string;
  className?: string;
  /** Scroll range over which the wall dims. Default: wall top from 80% to 25% of the viewport. */
  offset?: ScrollOffset;
}

/**
 * Direction B's signature moment: the standard NDA as a wall of text that dims as you scroll,
 * leaving only the variables lit.
 *
 * Two stacked copies: the dim copy (final state) underneath, an ink copy on top whose opacity is
 * tied linearly to scroll (1 to 0). One composited opacity per frame, no colour animation over
 * thousands of glyphs, no React renders while scrolling. Server, no-JS and reduced motion: only
 * the dim copy shows (the lit copy starts at opacity 0 and is display:none under reduced motion).
 */
export function WallDim({
  children,
  litClassName = 'bg-white',
  className,
  offset = ['start 0.8', 'start 0.25'],
}: WallDimProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const litRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: rootRef, offset });

  useEffect(() => {
    const el = litRef.current;
    if (!el || prefersReducedMotion()) return;
    const apply = (v: number) => {
      el.style.opacity = String(1 - Math.min(1, Math.max(0, v)));
    };
    apply(scrollYProgress.get());
    return scrollYProgress.on('change', apply);
  }, [scrollYProgress]);

  return (
    <div ref={rootRef} className={className} style={{ position: 'relative' }}>
      <MotionStyles />
      {children('dim')}
      <div
        ref={litRef}
        data-lm-wall-lit=""
        inert
        aria-hidden="true"
        className={litClassName}
        style={{ position: 'absolute', inset: 0, opacity: 0, pointerEvents: 'none' }}
      >
        {children('lit')}
      </div>
    </div>
  );
}

'use client';

import { useEffect, useRef, type ReactNode } from 'react';

/*
 * Site-wide scroll reveal, visible by default.
 *
 * The server renders every block fully visible. The root layout adds a `js`
 * class to <html> before first paint; only then does globals.css hide
 * `.reveal` / `.reveal-group > *` blocks that are not yet `.is-in`. An
 * IntersectionObserver adds `.is-in` when the block enters the viewport.
 * With scripting off, in link previews and under prefers-reduced-motion, the
 * content is simply shown (see the reveal rules in globals.css).
 */
function useRevealRef<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      el.classList.add('is-in');
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: '0px 0px -60px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return ref;
}

interface RevealProps {
  children: ReactNode;
  /** Delay in seconds before the block fades up. */
  delay?: number;
  className?: string;
}

/** Fades a block up once, on first viewport entry. */
export function Reveal({ children, delay = 0, className }: RevealProps) {
  const ref = useRevealRef<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={className ? `reveal ${className}` : 'reveal'}
      style={delay ? { transitionDelay: `${delay}s` } : undefined}
    >
      {children}
    </div>
  );
}

interface RevealGroupProps {
  children: ReactNode;
  className?: string;
}

/** Staggers its direct children as the group enters the viewport. */
export function RevealGroup({ children, className }: RevealGroupProps) {
  const ref = useRevealRef<HTMLDivElement>();
  return (
    <div ref={ref} className={className ? `reveal-group ${className}` : 'reveal-group'}>
      {children}
    </div>
  );
}

/** A child of <RevealGroup>; the group's CSS handles its timing. */
export function RevealItem({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

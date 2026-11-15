'use client';

import { useEffect, useId, useRef, useState } from 'react';

interface SealProps {
  size?: number;
  /** Plays the stamp (scale 1.15 to 1, opacity 0 to 1, 220ms). Toggle off and on to replay. */
  animate?: boolean;
  label?: string;
  className?: string;
}

const SEAL_FONT = 'var(--font-geist-mono), ui-monospace, monospace';

/** Teal circular seal. Rests at rotate(-6deg). Transform and opacity only. */
export function Seal({ size = 96, animate = false, label = 'Signed', className = '' }: SealProps) {
  const pathId = useId();
  const ref = useRef<HTMLSpanElement>(null);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!animate || reduced || !el || typeof el.animate !== 'function') return;
    const anim = el.animate(
      [
        { opacity: 0, transform: 'rotate(-6deg) scale(1.15)' },
        { opacity: 1, transform: 'rotate(-6deg) scale(1)' },
      ],
      { duration: 220, easing: 'cubic-bezier(.2,.9,.3,1)', fill: 'backwards' },
    );
    return () => anim.cancel();
  }, [animate, reduced]);

  return (
    <span
      ref={ref}
      className={`inline-block text-teal-800 ${className}`}
      style={{ width: size, height: size, transform: 'rotate(-6deg)' }}
    >
      <svg viewBox="0 0 120 120" width={size} height={size} role="img" aria-label={label} fill="none" stroke="currentColor">
        <circle cx="60" cy="60" r="56" fill="#fff" fillOpacity="0.8" stroke="none" />
        <circle cx="60" cy="60" r="56" strokeWidth="2" />
        <circle cx="60" cy="60" r="51" strokeWidth="1" />
        <circle cx="60" cy="60" r="31" strokeWidth="1" />
        <path id={pathId} d="M60,60 m-41,0 a41,41 0 1,1 82,0 a41,41 0 1,1 -82,0" stroke="none" />
        <text aria-hidden="true" fill="currentColor" stroke="none" fontFamily={SEAL_FONT} fontWeight={500} fontSize={12}>
          <textPath href={`#${pathId}`} textLength={252} lengthAdjust="spacing">
            {'EXECUTED · FORMALIZEIT · V1.0 · '}
          </textPath>
        </text>
        <path d="M47 52l8 8 17-17" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
        <text
          x="60"
          y="78"
          textAnchor="middle"
          aria-hidden="true"
          fill="currentColor"
          stroke="none"
          fontFamily={SEAL_FONT}
          fontWeight={500}
          fontSize={12}
        >
          SIGNED
        </text>
      </svg>
    </span>
  );
}

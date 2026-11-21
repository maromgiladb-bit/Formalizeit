'use client';

import type { CSSProperties } from 'react';
import { OLD_WAY_ITEMS } from '@/lib/landing/sampleDeal';
import { SceneFrame, clamp, useAutoplayStep } from './_shared';

export interface OldWaySceneProps {
  /** 0..5 items struck through, top to bottom. Default 5 (all struck: the old way is over). */
  step?: number;
  /** Plays `step` 0..5 once on a timer (off under reduced motion). */
  autoplay?: boolean;
  /** 'lg' for a scene that carries a desktop column on its own. Default 'md'. */
  size?: 'md' | 'lg';
  className?: string;
  label?: string;
}

/** The old way: an emailed NDA thread stretching over days; items strike through one by one. */
export function OldWayScene({ step = OLD_WAY_ITEMS.length, autoplay = false, size = 'md', className = '', label }: OldWaySceneProps) {
  const lg = size === 'lg';
  const struck = clamp(Math.round(useAutoplayStep(step, OLD_WAY_ITEMS.length, autoplay, 600)), 0, OLD_WAY_ITEMS.length);

  return (
    <SceneFrame className={className} label={label ?? 'A chain of emailed NDA drafts stretching over days.'}>
      <ul className={lg ? 'space-y-2.5 lg:space-y-4' : 'space-y-2.5'}>
        {OLD_WAY_ITEMS.map((item, i) => {
          const isStruck = i < struck;
          const delay: CSSProperties = { transitionDelay: isStruck ? `${i * 40}ms` : '0ms' };
          return (
            <li key={item.label} className={`flex ${item.fromRight ? 'justify-end' : 'justify-start'}`}>
              <span
                className={`relative inline-block max-w-[80%] rounded-sheet border border-line bg-ground transition-colors duration-200 motion-reduce:transition-none ${
                  lg ? 'px-3 py-1.5 text-sm lg:px-5 lg:py-3 lg:text-lg' : 'px-3 py-1.5 text-sm'
                } ${
                  isStruck ? 'text-gray-500' : 'text-ink'
                }`}
                style={delay}
              >
                {item.label}
                {/* Strike line: scales in from the left (transform only). */}
                <span
                  aria-hidden="true"
                  className={`pointer-events-none absolute inset-x-2 top-1/2 h-px origin-left bg-muted-ink transition-transform duration-[280ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none ${
                    isStruck ? 'scale-x-100' : 'scale-x-0'
                  }`}
                  style={delay}
                />
              </span>
            </li>
          );
        })}
      </ul>
    </SceneFrame>
  );
}

'use client';

import { SAMPLE_TEAM, type TeamRole } from '@/lib/landing/sampleDeal';
import { SceneFrame, T_COLOR, T_FADE, initials } from './_shared';

function SignToggle({ on }: { on: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs font-semibold text-muted-ink">
      Can sign
      <span className={`inline-flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 ${T_COLOR} ${on ? 'bg-teal-800' : 'bg-gray-200'}`}>
        <span className={`block h-4 w-4 rounded-full bg-white shadow-card ${T_FADE} ${on ? 'translate-x-4' : 'translate-x-0'}`} />
      </span>
    </span>
  );
}

export interface RolesSceneProps {
  /** Spotlight one role; the others recede. Default none (all equal). */
  highlight?: TeamRole | null;
  /** The administrator's "can sign" toggle (administrators opt in to signing). Default true. */
  adminCanSign?: boolean;
  className?: string;
  label?: string;
}

/** The team: Administrator, Signer, Contributor, what each can do, and who can sign. */
export function RolesScene({ highlight = null, adminCanSign = true, className = '', label }: RolesSceneProps) {
  return (
    <SceneFrame
      className={className}
      label={
        label ??
        'Team roles: an administrator who manages the workspace and can sign, a signer who signs for the company, and a contributor who drafts and sends but cannot sign.'
      }
    >
      <ul className="overflow-hidden rounded-sheet border border-line bg-white">
        {SAMPLE_TEAM.map((m) => {
          const canSign = m.role === 'administrator' ? adminCanSign : m.canSign;
          const dimmed = highlight !== null && highlight !== m.role;
          const lit = highlight === m.role;
          return (
            <li
              key={m.role}
              className={`border-b border-line px-4 py-4 last:border-b-0 sm:px-5 ${T_COLOR} ${lit ? 'bg-teal-50/60' : 'bg-white'}`}
            >
              <div className={`flex items-start gap-3 transition-opacity duration-200 motion-reduce:transition-none ${dimmed ? 'opacity-45' : 'opacity-100'}`}>
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${T_COLOR} ${
                    lit ? 'border-teal-800 bg-teal-800 text-white' : 'border-line bg-tint text-teal-800'
                  }`}
                >
                  {initials(m.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">{m.name}</p>
                      <p className="truncate text-xs text-gray-500">{m.email}</p>
                    </div>
                    <span className="rounded-control bg-ground px-2 py-0.5 text-xs font-semibold text-ink ring-1 ring-inset ring-line">
                      {m.roleLabel}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                    <p className="text-sm text-muted-ink">{m.does}</p>
                    {m.role === 'administrator' ? (
                      <SignToggle on={canSign} />
                    ) : (
                      <span className={`text-xs font-semibold ${canSign ? 'text-teal-800' : 'text-muted-ink'}`}>
                        {canSign ? 'Signs for the company' : 'Cannot sign'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </SceneFrame>
  );
}

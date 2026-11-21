'use client';

import type { ComponentType } from 'react';
import { Check, Copy, Lock, Mail } from 'lucide-react';
import { GmailLogo, OutlookLogo, WhatsAppLogo } from '@/components/ui/brand-icons';
import { SAMPLE_SHARE } from '@/lib/landing/sampleDeal';
import { STORY_CARD, SceneFrame, T_COLOR, T_FADE, useAutoplayStep } from './_shared';

/** Real ShareSheet channels and brand tints (src/components/ui/share-sheet.tsx), trimmed to four. */
const CHANNELS: { id: string; label: string; Icon: ComponentType<{ className?: string }>; tint: string }[] = [
  { id: 'gmail', label: 'Gmail', Icon: GmailLogo, tint: '#fdecea' },
  { id: 'outlook', label: 'Outlook', Icon: OutlookLogo, tint: '#e6f1fb' },
  { id: 'whatsapp', label: 'WhatsApp', Icon: WhatsAppLogo, tint: '#e3f8ec' },
  { id: 'email', label: 'Email app', Icon: Mail, tint: '#eef2f2' },
];

export interface ShareSceneProps {
  /** 0 = the share card, 1 = link copied (Copy morphs to Copied). Default 1. */
  step?: number;
  /** Plays `step` 0..1 once when it turns true (off under reduced motion). */
  autoplay?: boolean;
  className?: string;
  label?: string;
}

/** Send step: the secure link with a copy button and the ways to send it. Links-only send. */
export function ShareScene({ step = 1, autoplay = false, className = '', label }: ShareSceneProps) {
  const copied = useAutoplayStep(step, 1, autoplay, 1100, { startDelayMs: 300 }) >= 1;

  return (
    <SceneFrame className={className} label={label ?? 'A secure link with a copy button, and Gmail, Outlook, WhatsApp and email options to send it.'}>
      <div className={STORY_CARD}>
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-800 text-white">
            <Check className="h-[18px] w-[18px]" strokeWidth={2.6} aria-hidden="true" />
          </span>
          <p className="font-display text-xl font-bold leading-tight tracking-[-0.03em] text-ink sm:text-2xl">Your NDA is ready to share</p>
        </div>

        <div
          className={`mt-6 flex h-12 min-w-0 items-center gap-2 rounded-control border bg-ground pl-3.5 pr-1.5 ${T_COLOR} ${
            copied ? 'border-teal-700' : 'border-line'
          }`}
        >
          <Lock className="h-4 w-4 shrink-0 text-muted-ink" aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate font-doc-mono text-[13px] text-ink">{SAMPLE_SHARE.link}</span>
          <span
            className={`inline-flex h-9 shrink-0 items-center rounded-control px-3 text-sm font-semibold ${T_COLOR} ${
              copied ? 'bg-teal-800 text-white' : 'bg-white text-ink ring-1 ring-inset ring-line'
            }`}
          >
            {/* Both labels share one cell, so the button never changes width. */}
            <span className="inline-grid">
              <span className={`col-start-1 row-start-1 inline-flex items-center gap-1.5 ${T_FADE} ${copied ? 'scale-95 opacity-0' : ''}`}>
                <Copy className="h-4 w-4" aria-hidden="true" />
                Copy
              </span>
              <span className={`col-start-1 row-start-1 inline-flex items-center gap-1.5 ${T_FADE} ${copied ? '' : 'scale-95 opacity-0'}`}>
                <Check className="h-4 w-4" aria-hidden="true" />
                Copied
              </span>
            </span>
          </span>
        </div>

        <div className="mt-5 grid grid-cols-4 gap-2 sm:gap-3">
          {CHANNELS.map(({ id, label: name, Icon, tint }) => (
            <div key={id} className="grid justify-items-center gap-2 rounded-sheet border border-line bg-white px-1 pb-3 pt-3.5">
              <span style={{ backgroundColor: tint }} className="flex h-11 w-11 items-center justify-center rounded-full">
                <Icon className="h-5 w-5 text-ink" aria-hidden="true" />
              </span>
              <span className="text-center text-[13px] font-medium leading-tight text-ink">{name}</span>
            </div>
          ))}
        </div>
      </div>
    </SceneFrame>
  );
}

'use client';

import { useEffect, useId, useRef, useState, type ComponentType, type CSSProperties } from 'react';
import { Check, ChevronDown, Link2, Lock, Mail, MessageSquare, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusPill, type StatusTone } from '@/components/ui/status-pill';
import { GmailLogo, LinkedInLogo, OutlookLogo, TelegramLogo, WhatsAppLogo } from '@/components/ui/brand-icons';

export type SharePlatform = 'gmail' | 'outlook' | 'whatsapp' | 'email' | 'sms' | 'copy' | 'telegram' | 'linkedin';

interface ShareSheetProps {
  open: boolean;
  onClose: () => void;
  link: string;
  recipientName?: string;
  onShare: (platform: SharePlatform) => void;
  reminderNote?: string;
  /** Status shown beside Done. Defaults to "Waiting on them"; pass null to hide. */
  status?: { tone: StatusTone; label: string } | null;
}

const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

type Channel = {
  id: SharePlatform;
  label: string;
  Icon: ComponentType<{ className?: string }>;
  /** Chip background and hover border, from the channel's brand color. */
  tint: string;
  ring: string;
};

const MAIN: Channel[] = [
  { id: 'gmail', label: 'Gmail', Icon: GmailLogo, tint: '#fdecea', ring: '#f3b4ad' },
  { id: 'outlook', label: 'Outlook', Icon: OutlookLogo, tint: '#e6f1fb', ring: '#9cc7ee' },
  { id: 'whatsapp', label: 'WhatsApp', Icon: WhatsAppLogo, tint: '#e3f8ec', ring: '#8fe0b0' },
  { id: 'email', label: 'Email app', Icon: Mail, tint: '#eef2f2', ring: '#c6d0cf' },
  { id: 'sms', label: 'SMS', Icon: MessageSquare, tint: '#eef2f2', ring: '#c6d0cf' },
  { id: 'copy', label: 'Copy link', Icon: Link2, tint: '#d9efec', ring: '#8cc9c1' },
];

const MORE: Channel[] = [
  { id: 'telegram', label: 'Telegram', Icon: TelegramLogo, tint: '#e6f5fd', ring: '#94d3f5' },
  { id: 'linkedin', label: 'LinkedIn', Icon: LinkedInLogo, tint: '#e6eff8', ring: '#93b9e2' },
];

function ChannelTile({ channel, index, copied, onClick }: { channel: Channel; index: number; copied: boolean; onClick: () => void }) {
  const { label, Icon, tint, ring } = channel;
  const isCopy = channel.id === 'copy';
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ '--ring': ring, animationDelay: `${120 + index * 45}ms` } as CSSProperties}
      className="group grid cursor-pointer justify-items-center gap-2 rounded-sheet border border-line bg-white px-2 pb-3 pt-3.5 text-[13px] font-medium text-ink transition-[border-color,background-color,transform] duration-150 hover:border-[var(--ring)] active:scale-[0.97] motion-safe:animate-[share-tile-in_320ms_cubic-bezier(0.2,0.8,0.2,1)_both]"
    >
      <span
        style={{ backgroundColor: tint }}
        className="relative flex h-11 w-11 items-center justify-center rounded-full transition-transform duration-200 ease-out group-hover:-translate-y-0.5 group-hover:scale-110"
      >
        {isCopy ? (
          <span className="relative inline-grid h-5 w-5 text-teal-800">
            <Link2 className={`col-start-1 row-start-1 h-5 w-5 transition-[transform,opacity] duration-200 ${copied ? 'scale-50 opacity-0' : ''}`} aria-hidden="true" />
            <Check className={`col-start-1 row-start-1 h-5 w-5 transition-[transform,opacity] duration-200 ${copied ? '' : 'scale-50 opacity-0'}`} aria-hidden="true" />
          </span>
        ) : (
          <Icon className="h-5 w-5 text-ink" aria-hidden="true" />
        )}
      </span>
      <span aria-live={isCopy ? 'polite' : undefined}>{isCopy && copied ? 'Copied' : label}</span>
    </button>
  );
}

/** Presentational share sheet for the secure link. Sends nothing itself. */
export function ShareSheet({
  open,
  onClose,
  link,
  recipientName,
  onShare,
  reminderNote,
  status = { tone: 'progress', label: 'Waiting on them' },
}: ShareSheetProps) {
  const titleId = useId();
  const sheetRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const [copied, setCopied] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    sheetRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key === 'Tab' && sheetRef.current) {
        const items = Array.from(sheetRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
        if (items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];
        const active = document.activeElement;
        if (e.shiftKey && (active === first || active === sheetRef.current)) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      setShowMore(false);
      const target = returnFocusRef.current;
      if (target?.isConnected) target.focus();
    };
  }, [open]);

  useEffect(() => {
    return () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    };
  }, []);

  if (!open) return null;

  const handleCopy = () => {
    onShare('copy');
    setCopied(true);
    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-ink/50" aria-hidden="true" onClick={onClose} />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative max-h-[100dvh] w-full max-w-[560px] overflow-y-auto rounded-t-xl bg-white p-4 shadow-[0_24px_48px_-16px_rgba(13,31,30,0.4),0_0_0_1px_rgba(13,31,30,0.08)] focus:outline-none motion-safe:animate-[share-sheet-rise_280ms_cubic-bezier(0.2,0.8,0.2,1)] sm:rounded-xl sm:p-6"
      >
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-800 text-white motion-safe:animate-[share-check-pop_420ms_cubic-bezier(0.2,0.8,0.2,1)_120ms_both]">
            <Check className="h-5 w-5" strokeWidth={2.6} aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="font-display text-2xl font-bold leading-tight tracking-tight text-ink">
              Your NDA is ready to share
            </h2>
            <p className="mt-1 text-sm text-muted-ink">
              {recipientName
                ? `Send this secure link to ${recipientName} from your own inbox, so it lands where they will see it.`
                : 'Send this secure link from your own inbox, so it lands where they will see it.'}
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-control text-muted-ink transition-colors hover:bg-ground hover:text-ink"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-5 flex h-11 min-w-0 items-center gap-2 overflow-hidden rounded-control border border-line bg-ground px-3.5 font-doc-mono text-[13px] font-medium text-ink">
          <Lock className="h-4 w-4 shrink-0 text-muted-ink" aria-hidden="true" />
          <span className="truncate" title={link}>
            {link}
          </span>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <span className="shrink-0 text-xs font-semibold text-muted-ink">Send it via</span>
          <span className="h-px flex-1 bg-line" aria-hidden="true" />
        </div>

        <div role="group" aria-label="Share via" className="mt-3 grid grid-cols-3 gap-2.5">
          {MAIN.map((channel, i) => (
            <ChannelTile
              key={channel.id}
              channel={channel}
              index={i}
              copied={copied}
              onClick={() => (channel.id === 'copy' ? handleCopy() : onShare(channel.id))}
            />
          ))}
        </div>

        <div className="mt-3">
          <button
            type="button"
            onClick={() => setShowMore((v) => !v)}
            aria-expanded={showMore}
            className="flex cursor-pointer items-center gap-1 text-xs font-medium text-muted-ink transition-colors hover:text-ink"
          >
            <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-150 ${showMore ? 'rotate-180' : ''}`} aria-hidden="true" />
            More options
          </button>
          {showMore ? (
            <div role="group" aria-label="More ways to share" className="mt-2 grid grid-cols-3 gap-2.5">
              {MORE.map((channel, i) => (
                <ChannelTile key={channel.id} channel={channel} index={i - 2} copied={false} onClick={() => onShare(channel.id)} />
              ))}
            </div>
          ) : null}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-4">
          {reminderNote ? (
            <p className="min-w-[200px] flex-1 font-doc-mono text-xs leading-relaxed text-muted-ink">{reminderNote}</p>
          ) : (
            <span className="flex-1" />
          )}
          {status ? <StatusPill tone={status.tone} label={status.label} shape="crisp" /> : null}
          <Button type="button" variant="outline" size="sm" shape="crisp" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}

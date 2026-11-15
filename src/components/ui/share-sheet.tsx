'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Check, Link2, Lock, Mail, MessageCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusPill, type StatusTone } from '@/components/ui/status-pill';

export type SharePlatform = 'gmail' | 'outlook' | 'whatsapp' | 'copy';

interface ShareSheetProps {
  open: boolean;
  onClose: () => void;
  link: string;
  recipientName?: string;
  subject: string;
  body: string;
  onShare: (platform: SharePlatform) => void;
  reminderNote?: string;
  /** Status shown beside Done. Defaults to "Waiting on them"; pass null to hide. */
  status?: { tone: StatusTone; label: string } | null;
  /** Extra content under the share buttons (e.g. a "More options" row), inside the focus trap. */
  extra?: ReactNode;
}

const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

const PLATFORMS: { id: SharePlatform; label: string; Icon: typeof Mail }[] = [
  { id: 'gmail', label: 'Gmail', Icon: Mail },
  { id: 'outlook', label: 'Outlook', Icon: Mail },
  { id: 'whatsapp', label: 'WhatsApp', Icon: MessageCircle },
  { id: 'copy', label: 'Copy link', Icon: Link2 },
];

/** Presentational share sheet for the secure link. Sends nothing itself. */
export function ShareSheet({
  open,
  onClose,
  link,
  recipientName,
  subject,
  body,
  onShare,
  reminderNote,
  status = { tone: 'progress', label: 'Waiting on them' },
  extra,
}: ShareSheetProps) {
  const titleId = useId();
  const sheetRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const [copied, setCopied] = useState(false);
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
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-800 text-white">
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

        <div className="mt-6 flex flex-wrap gap-2">
          <div className="flex h-11 min-w-0 flex-1 items-center gap-2 overflow-hidden rounded-control border border-gray-300 bg-ground px-3.5 font-doc-mono text-[13px] font-medium text-ink">
            <Lock className="h-4 w-4 shrink-0 text-muted-ink" aria-hidden="true" />
            <span className="truncate" title={link}>
              {link}
            </span>
          </div>
          <Button type="button" shape="crisp" size="lg" className="min-w-[132px]" onClick={handleCopy}>
            <span className="relative inline-grid h-4 w-4">
              <Link2
                className={`col-start-1 row-start-1 transition-[transform,opacity] duration-200 ${copied ? 'scale-50 opacity-0' : ''}`}
                aria-hidden="true"
              />
              <Check
                className={`col-start-1 row-start-1 transition-[transform,opacity] duration-200 ${copied ? '' : 'scale-50 opacity-0'}`}
                aria-hidden="true"
              />
            </span>
            <span aria-live="polite">{copied ? 'Copied' : 'Copy link'}</span>
          </Button>
        </div>

        <div role="group" aria-label="Share via" className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {PLATFORMS.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => (id === 'copy' ? handleCopy() : onShare(id))}
              className="grid cursor-pointer justify-items-center gap-2 rounded-sheet border border-line bg-white px-2 pb-3 pt-3.5 text-[13px] font-medium text-ink transition-colors hover:border-gray-300 hover:bg-ground"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-control bg-ground">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              {label}
            </button>
          ))}
        </div>

        {extra ? <div className="mt-3">{extra}</div> : null}

        <div className="mt-4 rounded-control border border-line bg-white px-4 py-3 text-[13px] leading-relaxed text-gray-700">
          <p className="mb-1.5 text-xs font-semibold text-muted-ink">Message we pre-wrote for you</p>
          <p>
            <b className="font-semibold text-ink">{subject}</b> {body}
          </p>
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

import { Check } from 'lucide-react';
import type { ReactNode } from 'react';

export type StatusTone = 'neutral' | 'progress' | 'action' | 'done';

const toneStyles: Record<StatusTone, { pill: string; dot: string }> = {
  // Drafts and not-yet-moving documents
  neutral: {
    pill: 'bg-gray-100 text-gray-600',
    dot: 'bg-gray-400',
  },
  // In motion, waiting on the other side
  progress: {
    pill: 'bg-teal-50 text-teal-700 ring-1 ring-inset ring-teal-200',
    dot: 'bg-teal-500',
  },
  // Needs something from the viewer — the only amber in the app
  action: {
    pill: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200',
    dot: 'bg-amber-500 motion-safe:animate-pulse',
  },
  // Terminal success
  done: {
    pill: 'bg-teal-700 text-white',
    dot: '',
  },
};

interface StatusPillProps {
  tone: StatusTone;
  label: string;
  icon?: ReactNode;
  className?: string;
}

export function StatusPill({ tone, label, icon, className }: StatusPillProps) {
  const styles = toneStyles[tone];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${styles.pill} ${className || ''}`}
    >
      {icon ?? (tone === 'done' ? (
        <Check className="h-3 w-3" aria-hidden="true" />
      ) : (
        <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} aria-hidden="true" />
      ))}
      {label}
    </span>
  );
}

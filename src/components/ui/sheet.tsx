import type { ReactNode } from 'react';

interface SheetProps {
  /** Optional header line in Geist Mono (e.g. "Standard Mutual NDA v1.0"). */
  meta?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** Ink & Seal document sheet: white, hairline border, 8px radius, stacked-paper shadow. */
export function Sheet({ meta, children, className = '' }: SheetProps) {
  return (
    <div className={`rounded-sheet border border-line bg-white shadow-sheet ${className}`}>
      {meta ? (
        <div className="border-b border-line px-5 py-2.5 font-doc-mono text-xs leading-snug text-muted-ink">
          {meta}
        </div>
      ) : null}
      {children}
    </div>
  );
}

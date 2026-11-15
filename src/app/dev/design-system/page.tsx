import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { StatusPill, type StatusTone } from '@/components/ui/status-pill';
import { Input, inputClassesCrisp } from '@/components/ui/input';
import { LegalDisclaimer } from '@/components/ui/legal-disclaimer';
import { Sheet } from '@/components/ui/sheet';
import { EvidenceBlock } from '@/components/ui/evidence';
import { Seal } from '@/components/ui/seal';
import { SealReplay, ShareSheetDemo } from './DesignSystemClient';

// Dev-only preview (404 in production, see src/middleware.ts).
export const metadata = { robots: { index: false } };

const SWATCHES: { name: string; className: string; value: string }[] = [
  { name: 'ground', className: 'bg-ground', value: '#f6f8f8' },
  { name: 'line', className: 'bg-line', value: '#e3e9e8' },
  { name: 'muted-ink', className: 'bg-muted-ink', value: '#5b6b69' },
  { name: 'tint', className: 'bg-tint', value: '#d9efec' },
];

const VARIANTS = ['default', 'outline', 'secondary', 'ghost', 'link', 'destructive'] as const;
const TONES: { tone: StatusTone; label: string }[] = [
  { tone: 'neutral', label: 'Draft' },
  { tone: 'progress', label: 'Waiting on them' },
  { tone: 'action', label: 'Sign now' },
  { tone: 'done', label: 'Signed' },
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-sheet border border-line bg-white p-5">
      <h2 className="mb-3 text-sm font-semibold text-gray-700">{title}</h2>
      {children}
    </section>
  );
}

export default function DesignSystemPreview() {
  return (
    <main className="min-h-screen bg-ground px-4 py-10">
      <div className="mx-auto grid max-w-4xl gap-6">
        <header>
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink">Ink and Seal, Calm colors</h1>
          <p className="mt-1 text-sm text-muted-ink">Design foundations preview. Development only.</p>
        </header>

        <Section title="Tokens">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {SWATCHES.map((s) => (
              <div key={s.name} className="overflow-hidden rounded-control border border-line">
                <div className={`h-11 border-b border-line ${s.className}`} />
                <p className="px-3 pt-2 font-doc-mono text-xs text-ink">{s.name}</p>
                <p className="px-3 pb-2 font-doc-mono text-xs text-muted-ink">{s.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-6">
            <div>
              <div className="h-11 w-[72px] rounded-control border border-line bg-white" />
              <p className="mt-1 text-xs text-muted-ink">6px control</p>
            </div>
            <div>
              <div className="h-11 w-[72px] rounded-sheet border border-line bg-white shadow-sheet" />
              <p className="mt-1 text-xs text-muted-ink">8px sheet, shadow-sheet</p>
            </div>
          </div>
        </Section>

        <Section title="Type">
          <p className="font-display text-4xl font-bold tracking-tight text-ink">NDA in minutes</p>
          <p className="text-xs text-muted-ink">font-display, Schibsted Grotesk</p>
          <p className="mt-3 font-doc-mono text-sm text-ink">v1.0 · 15 Nov 2026 14:32 UTC · 9f2c4e…a41e</p>
          <p className="text-xs text-muted-ink">font-doc-mono, Geist Mono</p>
          <p className="mt-3 text-sm text-gray-700">Body text in the site font, unchanged.</p>
          <p className="text-xs text-muted-ink">font-sans, Plus Jakarta Sans</p>
        </Section>

        <Section title="Buttons, default and crisp">
          <div className="grid gap-3">
            {(['default', 'crisp'] as const).map((shape) => (
              <div key={shape} className="flex flex-wrap items-center gap-3">
                <span className="w-14 text-xs text-muted-ink">{shape}</span>
                {VARIANTS.map((variant) => (
                  <Button key={variant} variant={variant} shape={shape} size="sm">
                    {variant}
                  </Button>
                ))}
              </div>
            ))}
          </div>
        </Section>

        <Section title="Status pills, default and crisp">
          <div className="grid gap-3">
            {(['default', 'crisp'] as const).map((shape) => (
              <div key={shape} className="flex flex-wrap items-center gap-3">
                <span className="w-14 text-xs text-muted-ink">{shape}</span>
                {TONES.map((t) => (
                  <StatusPill key={t.tone} tone={t.tone} label={t.label} shape={shape} />
                ))}
              </div>
            ))}
          </div>
        </Section>

        <Section title="Inputs, default and crisp">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input placeholder="Default input" aria-label="Default input" />
            <input className={inputClassesCrisp} placeholder="Crisp input" aria-label="Crisp input" />
          </div>
        </Section>

        <Section title="Disclaimers">
          <div className="grid gap-3">
            <LegalDisclaimer />
            <LegalDisclaimer variant="compact" />
          </div>
        </Section>

        <Section title="Sheet and evidence">
          <Sheet meta="Standard Mutual NDA v1.0 · legal text unchanged" className="max-w-xl">
            <div className="px-6 py-5 text-[15px] leading-relaxed text-ink">
              <h3 className="mb-3 text-lg font-semibold">Mutual Non-Disclosure Agreement</h3>
              <p>
                This Agreement is entered into as of{' '}
                <span className="rounded-sm border-b border-teal-300 bg-tint px-0.5">15 November 2026</span> between{' '}
                <span className="rounded-sm border-b border-teal-300 bg-tint px-0.5">Northwind Robotics Ltd</span> and{' '}
                <span className="rounded-sm border-b border-teal-300 bg-tint px-0.5">Brightline Labs Inc.</span>
              </p>
            </div>
          </Sheet>
          <div className="mt-4 max-w-xl">
            <EvidenceBlock
              signerName="Sam Okafor, CTO"
              signedAt="2026-11-15T14:32:10Z"
              ipAddress="203.0.113.24"
              templateVersion="1.0"
              agreementHash="9f2c4e7a1b8d3c5e6f0a2b4c6d8e0f1a3b5c7d9e1f2a4b6c8d0e2f4a6b8ca41e"
            />
          </div>
        </Section>

        <Section title="Seal">
          <div className="flex flex-wrap items-center gap-8">
            <Seal size={96} version="1.0" />
            <SealReplay />
          </div>
        </Section>

        <Section title="Share sheet">
          <ShareSheetDemo />
        </Section>
      </div>
    </main>
  );
}

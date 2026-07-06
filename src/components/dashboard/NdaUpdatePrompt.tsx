'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { NdaChangelogEntry } from '@/lib/ndaChangelog';

export default function NdaUpdatePrompt({
  entries,
  version,
}: {
  entries: NdaChangelogEntry[];
  version: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const [reviewed, setReviewed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open || entries.length === 0) return null;

  const handleConfirm = async () => {
    if (!reviewed) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/user/acknowledge-nda-version', { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save');
      }
      setOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 transition-opacity" />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-float max-w-lg w-full p-6">
          {/* Icon */}
          <div className="mb-4 flex justify-center">
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-black">
              <FileText className="h-6 w-6 text-white" />
            </div>
          </div>

          <div className="text-center mb-5">
            <p className="text-teal-700 text-xs font-bold uppercase tracking-widest mb-2">Standard NDA updated</p>
            <h3 className="text-lg font-semibold text-ink mb-2">
              The standard NDA was updated to v{version}
            </h3>
            <p className="text-gray-500">
              We recommend reviewing what changed before you send or sign new NDAs. Documents you&apos;ve
              already signed are unaffected.
            </p>
          </div>

          {/* Changes summary */}
          <div className="mb-5 max-h-64 overflow-y-auto rounded-xl bg-gray-50 border border-gray-100 p-4 space-y-4">
            {entries.map((entry) => (
              <div key={entry.version}>
                <p className="text-sm font-semibold text-ink">
                  v{entry.version}
                  <span className="text-gray-400 font-normal"> · {entry.date}</span>
                </p>
                <p className="text-sm text-gray-500 mt-0.5">{entry.summary}</p>
                {entry.added && entry.added.length > 0 && <ChangeList label="Added" items={entry.added} />}
                {entry.changed && entry.changed.length > 0 && <ChangeList label="Changed" items={entry.changed} />}
                {entry.removed && entry.removed.length > 0 && <ChangeList label="Removed" items={entry.removed} />}
              </div>
            ))}
          </div>

          <Link
            href="/nda-changelog"
            target="_blank"
            className="text-sm font-semibold text-teal-800 hover:text-teal-700 underline underline-offset-2"
          >
            View full changelog →
          </Link>

          {/* Acknowledgement */}
          <label className="flex items-center gap-2.5 mt-5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={reviewed}
              onChange={(e) => setReviewed(e.target.checked)}
              className="w-4 h-4 rounded accent-teal-800 cursor-pointer"
            />
            <span className="text-sm text-ink">I&apos;ve reviewed the updates to the standard NDA</span>
          </label>

          {error && <p className="text-sm text-red-600 mt-3">{error}</p>}

          <div className="mt-5">
            <Button className="w-full" onClick={handleConfirm} disabled={!reviewed || busy}>
              {busy ? 'Saving…' : 'Confirm'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChangeList({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="mt-2">
      <p className="text-teal-700 text-xs font-bold uppercase tracking-widest">{label}</p>
      <ul className="mt-1 space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-gray-600 flex gap-2">
            <span className="text-gray-300 shrink-0">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Seal } from '@/components/ui/seal';
import { ShareSheet, type SharePlatform } from '@/components/ui/share-sheet';

/** Interactive bits of the design-system preview: seal replay and the share sheet. */
export function SealReplay() {
  const [run, setRun] = useState(0);
  return (
    <div className="flex items-center gap-4">
      <Seal key={run} size={96} animate={run > 0} version="1.0" />
      <Button type="button" variant="outline" size="sm" shape="crisp" onClick={() => setRun((n) => n + 1)}>
        Replay
      </Button>
    </div>
  );
}

export function ShareSheetDemo() {
  const [open, setOpen] = useState(false);
  const [last, setLast] = useState<SharePlatform | null>(null);
  return (
    <div className="flex items-center gap-3">
      <Button type="button" shape="crisp" onClick={() => setOpen(true)}>
        Open share sheet
      </Button>
      {last ? <span className="font-doc-mono text-xs text-muted-ink">Last action: {last}</span> : null}
      <ShareSheet
        open={open}
        onClose={() => setOpen(false)}
        link="formalizeit.com/s/nda_7Kq2x9Lw4pRt"
        recipientName="Sam Okafor"
        subject="NDA from Northwind Robotics Ltd, ready to sign."
        body="Hi Sam, here is the mutual NDA for our warehouse-automation pilot. It takes about two minutes to read and sign, and the link needs no account."
        reminderNote="Reminders go out at 48h and 5 days."
        onShare={setLast}
      />
    </div>
  );
}

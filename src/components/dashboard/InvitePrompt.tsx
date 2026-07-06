'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { acceptInvite, declineInvite } from '@/actions/team';

export interface PendingInvite {
  membershipId: string;
  organizationName: string;
  role: string;
}

const ROLE_LABELS: Record<string, string> = {
  ADMINISTRATOR: 'Administrator',
  SIGNER: 'Signer',
  CONTRIBUTOR: 'Contributor',
};

export default function InvitePrompt({ pendingInvites }: { pendingInvites: PendingInvite[] }) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const invite = pendingInvites[index];
  if (!invite || dismissed) return null;

  // Close the prompt without acting on the invite — it stays PENDING_INVITE and
  // reappears next load. Declining (destructive) is only the explicit button.
  const handleDismiss = () => {
    if (busy) return;
    setError(null);
    setDismissed(true);
  };

  const next = () => {
    setError(null);
    if (index + 1 < pendingInvites.length) {
      setIndex(index + 1);
    } else {
      setIndex(pendingInvites.length); // exhausts the list → nothing to render
    }
  };

  const handleAccept = async () => {
    setBusy(true);
    setError(null);
    const res = await acceptInvite(invite.membershipId);
    setBusy(false);
    if (res?.error) {
      setError(res.error);
      return;
    }
    // Accepting switches the active org — reload so the dashboard reflects it.
    router.refresh();
    next();
  };

  const handleDecline = async () => {
    setBusy(true);
    setError(null);
    const res = await declineInvite(invite.membershipId);
    setBusy(false);
    if (res?.error) {
      setError(res.error);
      return;
    }
    router.refresh();
    next();
  };

  const roleLabel = ROLE_LABELS[invite.role] ?? invite.role;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop — dismisses (keeps the invite pending); it never declines. */}
      <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={handleDismiss} />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div role="dialog" aria-modal="true" aria-label="Team invite" className="relative bg-white rounded-2xl shadow-float max-w-md w-full p-6">
          <button
            onClick={handleDismiss}
            aria-label="Dismiss"
            disabled={busy}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 disabled:opacity-50 transition-colors cursor-pointer rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700/40 focus-visible:ring-offset-2"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Icon */}
          <div className="mb-4 flex justify-center">
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-black">
              <Mail className="h-6 w-6 text-white" />
            </div>
          </div>

          {/* Content */}
          <div className="text-center mb-6">
            <p className="text-teal-700 text-xs font-bold uppercase tracking-widest mb-2">Team invite</p>
            <h3 className="text-lg font-semibold text-ink mb-2">
              You&apos;ve been invited to {invite.organizationName}
            </h3>
            <p className="text-gray-500">
              Join as <span className="font-semibold text-ink">{roleLabel}</span> to collaborate on NDAs with your team.
            </p>
            {pendingInvites.length > 1 && (
              <p className="text-xs text-gray-400 mt-2">
                Invite {index + 1} of {pendingInvites.length}
              </p>
            )}
          </div>

          {error && <p role="alert" className="text-sm text-red-600 text-center mb-4">{error}</p>}

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={handleDecline} disabled={busy}>
              Decline
            </Button>
            <Button className="flex-1" onClick={handleAccept} disabled={busy}>
              {busy ? 'Working…' : 'Accept invite'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

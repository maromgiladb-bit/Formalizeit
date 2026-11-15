'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { inputClassesCrisp } from '@/components/ui/input';

const emptyForm = { name: '', email: '', company: '', message: '' };

function ClaimNote() {
  const from = useSearchParams().get('from');
  if (from !== 'claim') return null;
  return (
    <p className="mb-6 rounded-sheet border border-line bg-ground px-4 py-3 text-sm text-gray-600" role="note">
      Your signed copy is in your email. You&apos;ll be able to create an account to keep it here when we open.
    </p>
  );
}

export default function ComingSoonPage() {
  const [form, setForm] = useState(emptyForm);
  const [trap, setTrap] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  const update = (field: keyof typeof emptyForm) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setError('');
    const [firstName, ...rest] = form.name.trim().split(/\s+/);
    const message = [
      form.company.trim() && `Company: ${form.company.trim()}`,
      form.message.trim() || 'Please add me to the private beta.',
    ].filter(Boolean).join('\n\n');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // The API's honeypot field is named "company", so the real company
        // goes in the message body and `company` carries the hidden trap.
        body: JSON.stringify({
          firstName,
          lastName: rest.join(' '),
          email: form.email,
          subject: 'Beta access request',
          message,
          company: trap,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to send your request.');
      }
      setStatus('success');
      setForm(emptyForm);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    }
  };

  return (
    <div className="min-h-screen bg-ground py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-control bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">
            <Lock className="w-3.5 h-3.5" aria-hidden="true" />
            Private beta
          </span>
          <h1 className="mt-4 text-4xl md:text-5xl font-display font-semibold tracking-tight text-ink">NDA in minutes, almost here.</h1>
          <p className="mt-4 text-base text-gray-500 leading-relaxed max-w-md">
            Pick the standard NDA, fill in what&apos;s different, send. We&apos;re letting teams in
            gradually. Request access and we&apos;ll email you when your spot opens.
          </p>
          <p className="mt-6 text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/sign-in" className="font-semibold text-teal-800 hover:text-teal-700">
              Sign in
            </Link>
          </p>
        </div>

        <div className="bg-white border border-line rounded-sheet shadow-sheet p-6 sm:p-8">
          <Suspense fallback={null}>
            <ClaimNote />
          </Suspense>
          <h2 className="text-2xl font-display font-semibold tracking-tight text-ink mb-6">Join the private beta</h2>

          {status === 'success' ? (
            <div className="flex items-start gap-3 rounded-sheet border border-line bg-white p-4" role="status">
              <CheckCircle className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-ink">Request received</p>
                <p className="text-sm text-gray-500">Thanks. We&apos;ll email you as soon as we open your spot.</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Honeypot: hidden from people, filled by bots. */}
              <div className="hidden" aria-hidden="true">
                <label htmlFor="beta-trap">Leave this empty</label>
                <input id="beta-trap" tabIndex={-1} autoComplete="off" value={trap} onChange={(e) => setTrap(e.target.value)} />
              </div>
              <div>
                <label htmlFor="beta-name" className="block text-sm font-medium text-ink mb-1.5">Name</label>
                <input className={inputClassesCrisp} id="beta-name" required autoComplete="name" value={form.name} onChange={update('name')} />
              </div>
              <div>
                <label htmlFor="beta-email" className="block text-sm font-medium text-ink mb-1.5">Work email</label>
                <input className={inputClassesCrisp} id="beta-email" type="email" required autoComplete="email" value={form.email} onChange={update('email')} />
              </div>
              <div>
                <label htmlFor="beta-company" className="block text-sm font-medium text-ink mb-1.5">Company</label>
                <input className={inputClassesCrisp} id="beta-company" required autoComplete="organization" value={form.company} onChange={update('company')} />
              </div>
              <div>
                <label htmlFor="beta-message" className="block text-sm font-medium text-ink mb-1.5">
                  Message <span className="font-normal text-gray-500">(optional)</span>
                </label>
                <textarea className={inputClassesCrisp} id="beta-message" rows={3} value={form.message} onChange={update('message')} />
              </div>
              {status === 'error' && (
                <p className="text-sm text-red-600" role="alert">{error}</p>
              )}
              <Button shape="crisp" type="submit" size="lg" className="w-full" disabled={status === 'submitting'}>
                {status === 'submitting' ? 'Sending...' : 'Request access'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

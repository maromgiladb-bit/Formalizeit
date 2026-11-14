import Link from 'next/link'
import { Check } from 'lucide-react'

export const metadata = { title: 'Reminders stopped | FormalizeIt' }

export default async function RemindersStoppedPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const invalid = status === 'invalid'
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white border border-gray-100 rounded-2xl shadow-card max-w-md w-full p-8 text-center">
        {!invalid && (
          <div className="mx-auto mb-5 w-11 h-11 rounded-xl bg-white border border-gray-200 flex items-center justify-center">
            <Check className="w-5 h-5 text-teal-800" aria-hidden="true" />
          </div>
        )}
        <p className="text-teal-700 text-xs font-bold uppercase tracking-widest mb-3">
          {invalid ? 'Link not valid' : 'Done'}
        </p>
        <h1 className="text-2xl font-extrabold text-ink mb-3">
          {invalid ? 'This link did not work' : 'No more reminders for this NDA'}
        </h1>
        <p className="text-sm text-gray-500 leading-relaxed">
          {invalid
            ? 'The link is incomplete or has been altered. Reply to the email you received and we will help.'
            : 'We will not send you further reminder emails about this NDA. Your secure link still works if you want to open it later, and you may still receive the signed copy once the NDA is complete.'}
        </p>
        <Link href="/" className="inline-block mt-6 text-sm font-semibold text-teal-800 hover:underline">
          Go to FormalizeIt
        </Link>
      </div>
    </main>
  )
}

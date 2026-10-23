import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { ensureDbUser } from '@/lib/db-user'
import { hasAcceptedCurrentTerms } from '@/lib/legalVersions'
import AcceptTermsForm from './AcceptTermsForm'

export const metadata = { title: 'Accept terms' }

function safeNext(next: string | undefined): string {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard'
}

export default async function AcceptTermsPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')
  const { next } = await searchParams
  const target = safeNext(next)

  const user = await ensureDbUser(userId)
  if (hasAcceptedCurrentTerms(user)) redirect(target)

  return (
    <main className="min-h-[70vh] flex items-center justify-center bg-gray-50 px-4 py-16">
      <div className="max-w-md w-full bg-white border border-gray-100 rounded-2xl shadow-card p-8">
        <p className="text-teal-700 text-xs font-bold uppercase tracking-widest">One quick step</p>
        <h1 className="mt-2 text-2xl font-extrabold text-ink tracking-tight">Review our terms</h1>
        <p className="mt-2 text-sm text-gray-500">
          Please confirm you agree to our Terms of Service and Privacy Policy to keep using FormalizeIt.
        </p>
        <AcceptTermsForm next={target} />
      </div>
    </main>
  )
}

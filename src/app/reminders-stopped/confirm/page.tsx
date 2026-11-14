import Link from 'next/link'
import { BellOff } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata = { title: 'Stop reminders | FormalizeIt', robots: { index: false } }

/**
 * Confirmation step for the emailed "Stop these reminders" link. Rendering this
 * page never changes state; only the button (a POST) does.
 */
export default async function ConfirmStopRemindersPage({
  searchParams,
}: {
  searchParams: Promise<{ d?: string; t?: string }>
}) {
  const { d = '', t = '' } = await searchParams
  const action = `/api/reminders/stop?d=${encodeURIComponent(d)}&t=${encodeURIComponent(t)}`
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white border border-gray-100 rounded-2xl shadow-card max-w-md w-full p-8 text-center">
        <div className="mx-auto mb-5 w-11 h-11 rounded-xl bg-white border border-gray-200 flex items-center justify-center">
          <BellOff className="w-5 h-5 text-teal-800" aria-hidden="true" />
        </div>
        <p className="text-teal-700 text-xs font-bold uppercase tracking-widest mb-3">Reminders</p>
        <h1 className="text-2xl font-extrabold text-ink mb-3">Stop reminders for this NDA?</h1>
        <p className="text-sm text-gray-500 leading-relaxed">
          We will stop sending you reminder emails about this NDA. Your secure link still works, and you may still
          receive the signed copy once the NDA is complete.
        </p>
        <form method="post" action={action} className="mt-6">
          <input type="hidden" name="redirect" value="1" />
          <Button type="submit" size="lg" className="w-full">
            Stop reminders for this NDA
          </Button>
        </form>
        <Link href="/" className="inline-block mt-5 text-sm font-semibold text-teal-800 hover:underline">
          Keep my reminders
        </Link>
      </div>
    </main>
  )
}

import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { Geist, Geist_Mono, Plus_Jakarta_Sans } from 'next/font/google'
import ToolbarSwitcher from '@/components/ToolbarSwitcher'
import FooterWrapper from '@/components/FooterWrapper'
import { FormiProvider } from '@/components/ai/FormiProvider'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { auth } from '@clerk/nextjs/server'
import { ensureDbUser } from '@/lib/db-user'
import { getSiteUrl } from '@/lib/siteUrl'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: '--font-jakarta',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
})

export const metadata: Metadata = {
  // Without this, Next resolves the OG image relative to the deployment host
  // and social cards break on the custom domain.
  metadataBase: new URL(getSiteUrl()),
  title: 'FormalizeIt — Send an NDA in Minutes',
  description: 'Send an NDA in minutes. Pick a template, fill in the details, and send a secure link — no account needed for the recipient.',
  openGraph: {
    title: 'FormalizeIt — Send an NDA in Minutes',
    description: 'Send an NDA in minutes. Pick a template, fill in the details, and send a secure link — no account needed for the recipient.',
    siteName: 'FormalizeIt',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FormalizeIt — Send an NDA in Minutes',
    description: 'Send an NDA in minutes. Pick a template, fill in the details, and send a secure link.',
  },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { userId } = await auth()

  // Provision the DB user and run pending signer claims on every signed-in visit.
  if (userId) {
    try {
      await ensureDbUser(userId)
    } catch (error) {
      console.error('Database unavailable, skipping user sync:', error)
    }
  }

  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${plusJakartaSans.variable} ${geistSans.variable} ${geistMono.variable} font-sans antialiased flex flex-col min-h-screen`}>
          <FormiProvider>
            <ToolbarSwitcher />
            <div className="flex-1">
              {children}
            </div>
            <FooterWrapper />
          </FormiProvider>
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  )
}

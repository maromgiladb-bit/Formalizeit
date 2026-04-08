import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { Geist, Geist_Mono, Plus_Jakarta_Sans } from 'next/font/google'
import ToolbarSwitcher from '@/components/ToolbarSwitcher'
import FooterWrapper from '@/components/FooterWrapper'
import './globals.css'
import { auth } from '@clerk/nextjs/server'
import { getActiveOrganization } from '@/lib/db-organization'
import { ensureDbUser } from '@/lib/db-user'

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
  title: 'Formalize It - NDA Management Platform',
  description: 'Create and manage NDAs with ease',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { userId } = await auth()
  let organizationData = null

  if (userId) {
    try {
      const user = await ensureDbUser(userId)

      if (user && user.memberships.length > 0) {
        const activeMembership = await getActiveOrganization()
        const [firstMembership] = user.memberships
        organizationData = {
          organizations: user.memberships.map((m: any) => ({
            id: m.organization.id,
            name: m.organization.name,
            slug: m.organization.slug
          })),
          activeOrgId: activeMembership?.organizationId || firstMembership.organizationId
        }
      }
    } catch (error) {
      console.error('Database unavailable, continuing without org data:', error)
    }
  }

  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${plusJakartaSans.variable} ${geistSans.variable} ${geistMono.variable} font-sans antialiased flex flex-col min-h-screen`}>
          <ToolbarSwitcher organizationData={organizationData} />
          <div className="flex-1">
            {children}
          </div>
          <FooterWrapper />
        </body>
      </html>
    </ClerkProvider>
  )
}

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import OnboardingForm from './OnboardingForm'

export default async function OnboardingPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const user = await prisma.user.findUnique({
    where: { externalId: userId },
    include: {
      memberships: { where: { status: 'ACTIVE' } }
    }
  })

  if (!user) redirect('/sign-in')
  if (user.memberships.length > 0) redirect('/dashboard')

  return <OnboardingForm />
}

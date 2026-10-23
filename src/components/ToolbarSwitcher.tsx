'use client'

import { useAuth } from '@clerk/nextjs'
import { usePathname } from 'next/navigation'
import PrivateToolbar from './PrivateToolbar'
import PublicToolbar from './PublicToolbar'

export default function ToolbarSwitcher() {
  const { userId, isLoaded } = useAuth()
  const pathname = usePathname()

  // Don't render anything while loading or on coming-soon page
  if (!isLoaded || pathname === '/coming-soon') return null

  // Show appropriate toolbar based on authentication state
  return userId ? <PrivateToolbar /> : <PublicToolbar />
}

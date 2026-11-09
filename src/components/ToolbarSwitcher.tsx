'use client'

import { useAuth } from '@clerk/nextjs'
import PrivateToolbar from './PrivateToolbar'
import PublicToolbar from './PublicToolbar'

export default function ToolbarSwitcher() {
  const { userId, isLoaded } = useAuth()

  // Don't render anything while loading
  if (!isLoaded) return null

  // Show appropriate toolbar based on authentication state
  return userId ? <PrivateToolbar /> : <PublicToolbar />
}

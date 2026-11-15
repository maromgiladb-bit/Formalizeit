'use client'

import { usePathname } from 'next/navigation'
import Footer from './Footer'

// Signed-in app surfaces: the marketing footer is hidden here.
const APP_PREFIXES = [
    '/dashboard',
    '/fillndahtml',
    '/settings',
    '/templates',
    '/team',
    '/onboarding',
    '/mydrafts',
    '/view-nda',
]

export default function FooterWrapper() {
    const pathname = usePathname() ?? ''
    const isAppPage = APP_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'))
    if (isAppPage) return null
    return <Footer />
}

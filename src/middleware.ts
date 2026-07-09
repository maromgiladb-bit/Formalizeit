import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// 1. Public routes — reachable without signing in.
//    Everything NOT matched here requires an authenticated Clerk session.
//    Model: default-protect (app data is private by default); the public
//    marketing/legal surface and the no-account counterparty flows are
//    enumerated explicitly so a newly-added app route is never exposed by
//    accident.
const isPublicRoute = createRouteMatcher([
  // Auth pages
  '/sign-in(.*)',
  '/signup(.*)',
  '/coming-soon',

  // Marketing / informational pages
  '/',
  '/about',
  '/plans',
  '/faq',
  '/help',
  '/support',
  '/contact',
  '/api/contact',                   // public contact form (honeypot-protected)
  '/security',

  // Legal / compliance pages
  '/terms',
  '/privacy',
  '/compliance',
  '/standard-nda',
  '/nda-governance',
  '/esignature-consent',
  '/nda-changelog',

  // No-account counterparty (Party B) flows — the secure token / signer id IS
  // the credential; these pages and their APIs must work logged-out.
  '/sign-nda-public(.*)',
  '/fillndahtml-public(.*)',
  '/api/ndas/submit-input',
  '/api/ndas/sign-public',
  '/api/ndas/preview-html-public',
  '/api/ndas/activity-public',      // public activity feed (signerId bearer)
  '/api/claim',                     // counterparty claim entry → sets cookie, redirects to signup

  // Verified/secret-protected server-to-server endpoints
  '/api/webhooks/clerk',            // Clerk webhook (verified by svix)
  '/api/webhooks/stripe',           // Stripe webhook (verified by stripe-signature header)
  '/api/cron/cleanup-deleted-users',// Cron (protected by CRON_SECRET)
  '/api/cron/retention-cleanup',    // Cron (protected by CRON_SECRET)
  '/api/cron/nda-reminders',        // Cron (protected by CRON_SECRET)
  '/api/cron/expire-sign-links',    // Cron (protected by CRON_SECRET)
])

// Dev/debug-only surface. Hard-blocked (404) in production so no debug endpoint
// or scratch page is ever reachable on the live site — even by direct URL.
// `/fillndahtml-public/dev` matters most: it sits under the public
// `/fillndahtml-public(.*)` matcher, so without this it would be world-reachable.
const isDevOnlyRoute = createRouteMatcher([
  '/test-auth',
  '/devtemplates',
  '/devemails',
  '/companydetails',
  '/fillndahtml-public/dev',
  '/api/debug(.*)',        // /api/debug, /api/debug-preview, /api/debug-templates, /api/debug/*
  '/api/test',
  '/api/generate-preview',
  '/api/dev/(.*)',         // /api/dev/email-preview
])

export default clerkMiddleware(async (auth, req) => {
  // 1. Dev-only routes: 404 in production, pass through in dev.
  if (process.env.NODE_ENV === 'production' && isDevOnlyRoute(req)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // 2. Public routes always pass through.
  if (isPublicRoute(req)) {
    return NextResponse.next()
  }

  // 3. Everything else requires a session.
  const { userId } = await auth()
  if (!userId) {
    // API routes → 401 JSON (never redirect a fetch to an HTML page).
    if (req.nextUrl.pathname.startsWith('/api')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    // Pages → send to sign-in, preserving where they were headed.
    const signInUrl = new URL('/sign-in', req.url)
    signInUrl.searchParams.set('redirect_url', req.nextUrl.pathname)
    return NextResponse.redirect(signInUrl)
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',

  ],
}
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// 1. Define public routes
// Explicitly include /coming-soon and sign-in/up routes if they exist, 
// though strictly speaking user asked only for /coming-soon. 
// Adding sign-in/up to matcher prevents redirect loops if Clerk redirects there.
const isPublicRoute = createRouteMatcher([
  '/coming-soon',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/sign-nda-public(.*)',
  '/fillndahtml-public(.*)',
  '/api/s3-test',
  '/api/ndas/submit-input',
  '/api/ndas/sign-public',
  '/api/ndas/preview-html-public',
])

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth()

  // 2. Protect all routes except public ones
  if (!isPublicRoute(req) && !userId) {
    // Redirect to coming soon if not signed in and not on a public route
    return NextResponse.redirect(new URL('/coming-soon', req.url))
  }

  // 3. Allow access if authenticated or public
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
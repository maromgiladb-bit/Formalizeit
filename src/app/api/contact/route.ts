import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'
import { sanitizeForHtml } from '@/lib/sanitize'
import { rateLimitRequest, tooManyRequests, HOUR } from '@/lib/rateLimit'

// Where contact form submissions are delivered. Required — there is deliberately
// no fallback address, so a misconfigured deployment fails loudly instead of
// quietly mailing someone's personal inbox.
const CONTACT_INBOX = process.env.CONTACT_INBOX

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
const stripNewlines = (v: string) => v.replace(/[\r\n]/g, ' ')

// Public endpoint (no auth) so visitors can reach us before signing up.
// Spam is deterred with a honeypot field (`company`): a hidden input real users
// leave blank but bots fill. We accept-and-drop those silently.
export async function POST(request: NextRequest) {
  try {
    // Every accepted submission costs us an email. The honeypot alone stops
    // only bots naive enough to fill it in.
    const limit = rateLimitRequest(request, 'contact', 5, HOUR)
    if (!limit.ok) {
      return tooManyRequests(limit, 'Too many messages sent. Please try again later.')
    }

    if (!CONTACT_INBOX) {
      console.error('CONTACT_INBOX is not configured — contact form cannot deliver')
      return NextResponse.json(
        { error: 'Contact form is unavailable right now. Please email us directly.' },
        { status: 503 }
      )
    }

    const body = await request.json()

    // Honeypot — pretend success, send nothing.
    if (String(body.company ?? '').trim()) {
      return NextResponse.json({ ok: true })
    }

    const firstName = String(body.firstName ?? '').trim()
    const lastName = String(body.lastName ?? '').trim()
    const email = String(body.email ?? '').trim()
    const subject = String(body.subject ?? '').trim()
    const message = String(body.message ?? '').trim()

    if (!firstName || !email || !message) {
      return NextResponse.json({ error: 'Please fill in your name, email, and message.' }, { status: 400 })
    }
    if (!isEmail(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
    }

    const fullName = stripNewlines(`${firstName} ${lastName}`.trim())
    const topic = stripNewlines(subject) || 'General'

    const html = `
      <h2>New contact form message</h2>
      <p><strong>From:</strong> ${sanitizeForHtml(fullName)} &lt;${sanitizeForHtml(email)}&gt;</p>
      <p><strong>Topic:</strong> ${sanitizeForHtml(topic)}</p>
      <hr />
      <p style="white-space: pre-wrap;">${sanitizeForHtml(message)}</p>
      <hr />
      <p style="color:#6b7280;font-size:12px;">Reply directly to ${sanitizeForHtml(email)} to respond to the sender.</p>
    `

    await sendEmail({
      to: CONTACT_INBOX,
      subject: `[Contact] ${topic} — ${fullName}`,
      html,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Contact form submission error:', error)
    return NextResponse.json({ error: 'Failed to send your message. Please try again.' }, { status: 500 })
  }
}

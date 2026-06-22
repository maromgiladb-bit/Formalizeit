import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'
import { sanitizeForHtml } from '@/lib/sanitize'

// Where contact form submissions are delivered. Override via env if needed.
const CONTACT_INBOX = process.env.CONTACT_INBOX || 'maromgiladb@gmail.com'

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
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

    const fullName = `${firstName} ${lastName}`.trim()
    const topic = subject || 'General'

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

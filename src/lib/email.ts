import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const APP_URL = 'http://localhost:3000' // TESTING: Force localhost for local testing
const MAIL_FROM = process.env.MAIL_FROM || 'noreply@formalizeit.app'

export interface EmailAttachment {
  filename: string
  content: string // Base64 string
  contentType?: string
}

export interface SendEmailParams {
  to: string
  subject: string
  html: string
  attachments?: EmailAttachment[]
}

export async function sendEmail({ to, subject, html, attachments }: SendEmailParams): Promise<void> {
  console.log('📧 sendEmail called with:', { to, subject, hasHtml: !!html, attachmentCount: attachments?.length || 0 })
  console.log('📧 RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY)
  console.log('📧 MAIL_FROM:', MAIL_FROM)
  console.log('📧 APP_URL:', APP_URL)

  if (!resend) {
    console.warn('⚠️  Email not sent: RESEND_API_KEY not configured. Set it in .env to enable email notifications.')
    return
  }

  try {
    console.log('📧 Attempting to send email via Resend...')

    // Prepare attachments in Resend format
    const resendAttachments = attachments?.map(att => ({
      filename: att.filename,
      content: att.content, // Base64 string
      contentType: att.contentType || 'application/octet-stream'
    }))

    const { data, error } = await resend.emails.send({
      from: MAIL_FROM,
      to,
      subject,
      html,
      replyTo: MAIL_FROM,
      attachments: resendAttachments
    })

    if (error) {
      console.error('❌ Resend API Error:', error)
      if (error.message?.includes('You can only send testing emails')) {
        console.error('⚠️  IMPORTANT: You are using Resend test domain (onboarding@resend.dev)')
        console.error('⚠️  Test domain can ONLY send to your verified email address')
        console.error('⚠️  To send to other recipients:')
        console.error('   1. Go to https://resend.com/domains')
        console.error('   2. Verify your own domain')
        console.error('   3. Update MAIL_FROM in .env.local to use your domain')
      }
      throw new Error(error.message || 'Email sending failed')
    }

    console.log('✅ Email sent successfully!', data)
    console.log('✅ Email sent to:', to)
  } catch (error) {
    console.error('❌ Failed to send email:', error)
    console.error('❌ Error details:', JSON.stringify(error, null, 2))
    throw error
  }
}

export function getAppUrl(): string {
  return APP_URL
}

// Email templates

// Helper for consistent email layout
function getBaseEmailHtml(title: string, content: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #374151; background-color: #f3f4f6; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
          .header { background-color: #0d9488; padding: 24px; text-align: center; }
          .logo { font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.025em; margin: 0; }
          .content { padding: 32px 40px; }
          .button { display: inline-block; background-color: #0d9488; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 24px; text-align: center; }
          .footer { background-color: #f9fafb; padding: 24px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
          h2 { margin-top: 0; color: #111827; font-size: 20px; font-weight: 700; }
          p { margin-bottom: 16px; font-size: 16px; }
          .highlight { font-weight: 600; color: #111827; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Formalize It</div>
          </div>
          <div class="content">
            ${content}
          </div>
          <div class="footer">
            <p style="margin: 0;">© ${new Date().getFullYear()} Formalize It. All rights reserved.</p>
            <p style="margin: 8px 0 0;">Securely signed and delivered via Formalize It.</p>
          </div>
        </div>
      </body>
    </html>
  `
}

export function recipientEditEmailHtml(
  draftTitle: string,
  editLink: string,
  ownerMessage?: string,
  senderName?: string
): string {
  const fromText = senderName ? `from ${senderName}` : '';
  const content = `
    <h2>You Have a New NDA to Review${fromText ? ` ${fromText}` : ''}</h2>
    <p>A non-disclosure agreement has been shared with you for your review:</p>
    <p class="highlight">${draftTitle}</p>
    ${ownerMessage ? `<div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0; border-radius: 4px;"><strong style="color: #92400e; display: block; margin-bottom: 4px;">Note from sender:</strong><span style="color: #b45309;">${ownerMessage}</span></div>` : ''}
    
    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <h3 style="margin-top: 0; font-size: 14px; color: #166534; font-weight: 600;">What to do next:</h3>
      <ol style="margin: 0; padding-left: 20px; color: #15803d; font-size: 14px;">
        <li style="margin-bottom: 8px;">Click the button below to open the document</li>
        <li style="margin-bottom: 8px;">Review all terms and conditions carefully</li>
        <li style="margin-bottom: 8px;">Make any changes or suggestions if needed</li>
        <li>Submit when you're ready to proceed</li>
      </ol>
    </div>
    
    <div style="text-align: center;">
      <a href="${editLink}" class="button">Review Document</a>
    </div>
    <p style="text-align: center; margin-top: 24px; font-size: 14px; color: #6b7280;">This secure link is valid for 30 days.</p>
  `
  return getBaseEmailHtml('New NDA for Your Review', content)
}

export function ownerReviewEmailHtml(
  draftTitle: string,
  revisionNumber: number,
  reviewLink: string,
  changes: Array<{ field: string; before: string; after: string }>
): string {
  const changesList = changes.slice(0, 5).map(c =>
    `<li style="margin-bottom: 8px;"><strong>${c.field}:</strong> <span style="color: #dc2626; text-decoration: line-through;">${c.before || '(empty)'}</span> <span style="color: #9ca3af; margin: 0 4px;">→</span> <span style="color: #16a34a; font-weight: 600;">${c.after || '(removed)'}</span></li>`
  ).join('')

  const moreChanges = changes.length > 5 ? `<p style="color: #6b7280; font-style: italic; font-size: 14px; margin-top: 8px;">...and ${changes.length - 5} more changes</p>` : ''

  const content = `
    <h2>Review Requested <span style="background-color: #fef3c7; color: #b45309; font-size: 12px; padding: 2px 8px; border-radius: 999px; vertical-align: middle; margin-left: 8px;">Rev ${revisionNumber}</span></h2>
    <p>The recipient has submitted changes for your NDA:</p>
    <p class="highlight">${draftTitle}</p>
    <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <h3 style="margin-top: 0; font-size: 16px; color: #374151;">Key Changes:</h3>
      <ul style="margin: 0; padding-left: 20px; color: #4b5563;">${changesList}</ul>
      ${moreChanges}
    </div>
    <div style="text-align: center;">
      <a href="${reviewLink}" class="button">Review Changes</a>
    </div>
  `
  return getBaseEmailHtml('Review Changes', content)
}

export function finalSignedEmailHtml(
  draftTitle: string,
  downloadLink: string
): string {
  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-flex; align-items: center; justify-content: center; width: 64px; height: 64px; background-color: #dcfce7; color: #16a34a; border-radius: 50%; font-size: 32px;">✓</div>
    </div>
    <h2 style="text-align: center;">Fully Signed & Completed</h2>
    <p style="text-align: center;">Congratulations! Your NDA has been successfully signed by all parties.</p>
    <p style="text-align: center;" class="highlight">${draftTitle}</p>
    <div style="text-align: center;">
      <a href="${downloadLink}" class="button">Download Final PDF</a>
    </div>
  `
  return getBaseEmailHtml('NDA Completed', content)
}

export function recipientSignRequestEmailHtml(
  draftTitle: string,
  signLink: string
): string {
  const content = `
    <h2>Action Required: Sign NDA</h2>
    <p>The following NDA is ready for your signature:</p>
    <p class="highlight">${draftTitle}</p>
    <p>Please review the document and provide your signature to finalize the agreement.</p>
    <div style="text-align: center;">
      <a href="${signLink}" class="button">Review & Sign NDA</a>
    </div>
    <p style="text-align: center; margin-top: 24px; font-size: 14px; color: #6b7280;">This link will expire in 30 days.</p>
  `
  return getBaseEmailHtml('Sign NDA', content)
}

export function timeToSignEmailHtml(
  draftTitle: string,
  signLink: string,
  signerName: string
): string {
  const content = `
    <h2>It's Time to Sign!</h2>
    <p>Good news! <strong>${signerName}</strong> has already signed the NDA:</p>
    <p class="highlight">${draftTitle}</p>
    <p>Please review the document (including their signature) and add your own to complete the process.</p>
    <div style="text-align: center;">
      <a href="${signLink}" class="button">Review & Sign</a>
    </div>
  `
  return getBaseEmailHtml('Action Required: Time to Sign', content)
}

export function congratulationsEmailHtml(
  draftTitle: string,
  downloadLink: string
): string {
  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-flex; align-items: center; justify-content: center; width: 64px; height: 64px; background-color: #dcfce7; color: #16a34a; border-radius: 50%; font-size: 32px;">🎉</div>
    </div>
    <h2 style="text-align: center;">All Done!</h2>
    <p style="text-align: center;">Congratulations! The signing process for the following NDA is complete:</p>
    <p style="text-align: center;" class="highlight">${draftTitle}</p>
    <p style="text-align: center;">Both parties have successfully signed. You can now download the final executed agreement.</p>
    <div style="text-align: center;">
      <a href="${downloadLink}" class="button">Download Final PDF</a>
    </div>
  `
  return getBaseEmailHtml('Congratulations! NDA Completed', content)
}

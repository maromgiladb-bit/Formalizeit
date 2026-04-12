import { Resend } from 'resend'
import { sanitizeForHtml } from '@/lib/sanitize'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000'
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

// Helper for consistent email layout — Stitch design style
function getBaseEmailHtml(title: string, content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #6b7280; background-color: #f9fafb; margin: 0; padding: 0; -webkit-text-size-adjust: 100%;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb;">
      <tr>
        <td align="center" style="padding: 40px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; margin: 0 auto;">
            <!-- Logo -->
            <tr>
              <td style="padding-bottom: 32px; text-align: center;">
                <span style="font-size: 20px; font-weight: 800; color: #111827; letter-spacing: -0.025em;">Formalize It</span>
              </td>
            </tr>
            <!-- Card -->
            <tr>
              <td>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
                  <!-- Accent line -->
                  <tr><td style="height: 3px; background-color: #115e59; font-size: 0; line-height: 0;">&nbsp;</td></tr>
                  <!-- Body -->
                  <tr>
                    <td style="padding: 36px 32px 32px;">
                      ${content}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="padding-top: 24px; text-align: center;">
                <p style="margin: 0; font-size: 12px; color: #9ca3af; line-height: 1.5;">\u00a9 ${new Date().getFullYear()} Formalize It &middot; Secure NDA workflows</p>
                <p style="margin: 6px 0 0; font-size: 12px; color: #9ca3af;">You received this email because an NDA was shared with you or your team through Formalize It.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

// Reusable inline components
function emailButton(label: string, href: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top: 28px;">
  <tr><td align="center">
    <a href="${href}" style="display: inline-block; background-color: #115e59; color: #ffffff; padding: 13px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; line-height: 1;">${label}</a>
  </td></tr>
</table>`
}

function emailDocTitle(title: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0;">
  <tr><td style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px 18px;">
    <p style="margin: 0; font-size: 15px; font-weight: 700; color: #111827;">${title}</p>
  </td></tr>
</table>`
}

function emailAccentLabel(label: string): string {
  return `<p style="margin: 0 0 6px; font-size: 11px; font-weight: 700; color: #0f766e; text-transform: uppercase; letter-spacing: 0.08em;">${label}</p>`
}

function emailNote(label: string, message: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0;">
  <tr><td style="background-color: #fffbeb; border-left: 3px solid #f59e0b; border-radius: 0 8px 8px 0; padding: 14px 18px;">
    <p style="margin: 0 0 4px; font-size: 12px; font-weight: 700; color: #92400e; text-transform: uppercase; letter-spacing: 0.04em;">${label}</p>
    <p style="margin: 0; font-size: 14px; color: #78350f; line-height: 1.5;">${message}</p>
  </td></tr>
</table>`
}

function emailInfoBox(content: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0;">
  <tr><td style="background-color: #f0fdfa; border: 1px solid #ccfbf1; border-radius: 8px; padding: 16px 18px;">
    ${content}
  </td></tr>
</table>`
}

function emailStep(num: number, title: string, desc: string): string {
  return `<tr>
  <td style="padding-bottom: 14px; vertical-align: top; width: 32px;">
    <div style="width: 26px; height: 26px; background-color: #115e59; color: #ffffff; border-radius: 50%; text-align: center; line-height: 26px; font-size: 13px; font-weight: 700;">${num}</div>
  </td>
  <td style="padding-bottom: 14px; padding-left: 12px; vertical-align: top;">
    <p style="margin: 0; font-size: 14px; font-weight: 600; color: #111827; line-height: 26px;">${title}</p>
    <p style="margin: 2px 0 0; font-size: 13px; color: #6b7280; line-height: 1.4;">${desc}</p>
  </td>
</tr>`
}

function emailSteps(steps: Array<{ title: string; desc: string }>): string {
  const rows = steps.map((s, i) => emailStep(i + 1, s.title, s.desc)).join('')
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0;">
  ${rows}
</table>`
}

function emailSubtext(text: string): string {
  return `<p style="margin: 16px 0 0; font-size: 12px; color: #9ca3af; text-align: center; line-height: 1.4;">${text}</p>`
}

export function recipientEditEmailHtml(
  draftTitle: string,
  editLink: string,
  ownerMessage?: string,
  senderName?: string
): string {
  const safeDraftTitle = sanitizeForHtml(draftTitle)
  const safeSenderName = sanitizeForHtml(senderName)
  const safeOwnerMessage = sanitizeForHtml(ownerMessage)

  const heading = safeSenderName
    ? `${safeSenderName} sent you an NDA to review`
    : 'You have a new NDA to review'

  const content = `
    ${emailAccentLabel('Document Review')}
    <h2 style="margin: 0 0 12px; font-size: 20px; font-weight: 800; color: #111827; line-height: 1.3;">${heading}</h2>
    <p style="margin: 0 0 4px; font-size: 15px; color: #6b7280; line-height: 1.5;">Please take a moment to review the following agreement. You can suggest changes to any field before signing.</p>
    ${emailDocTitle(safeDraftTitle)}
    ${safeOwnerMessage ? emailNote('Message from sender', safeOwnerMessage) : ''}
    ${emailAccentLabel('How it works')}
    ${emailSteps([
      { title: 'Open the document', desc: 'Click the button below to view the full NDA in your browser.' },
      { title: 'Review and suggest edits', desc: 'Click any highlighted field to propose a change. Your edits are tracked.' },
      { title: 'Submit your response', desc: 'Once you are happy with the terms, submit or sign directly.' },
    ])}
    ${emailButton('Review Document', editLink)}
    ${emailSubtext('This secure link expires in 30 days. No account needed.')}
  `
  return getBaseEmailHtml('New NDA for Your Review', content)
}

export function ownerReviewEmailHtml(
  draftTitle: string,
  revisionNumber: number,
  reviewLink: string,
  changes: Array<{ field: string; before: string; after: string }>
): string {
  const safeDraftTitle = sanitizeForHtml(draftTitle)
  const changesRows = changes.slice(0, 5).map(c =>
    `<tr>
      <td style="padding: 10px 14px; border-bottom: 1px solid #f3f4f6; vertical-align: top;">
        <p style="margin: 0; font-size: 13px; font-weight: 600; color: #111827;">${sanitizeForHtml(c.field)}</p>
      </td>
      <td style="padding: 10px 14px; border-bottom: 1px solid #f3f4f6; vertical-align: top;">
        <p style="margin: 0 0 2px; font-size: 13px; color: #9ca3af; text-decoration: line-through;">${sanitizeForHtml(c.before) || '(empty)'}</p>
        <p style="margin: 0; font-size: 13px; color: #0f766e; font-weight: 600;">${sanitizeForHtml(c.after) || '(removed)'}</p>
      </td>
    </tr>`
  ).join('')

  const moreText = changes.length > 5 ? `<p style="margin: 12px 0 0; font-size: 13px; color: #6b7280; font-style: italic;">and ${changes.length - 5} more change${changes.length - 5 > 1 ? 's' : ''}</p>` : ''

  const content = `
    ${emailAccentLabel('Revision ' + revisionNumber)}
    <h2 style="margin: 0 0 12px; font-size: 20px; font-weight: 800; color: #111827; line-height: 1.3;">The other party suggested changes</h2>
    <p style="margin: 0 0 4px; font-size: 15px; color: #6b7280; line-height: 1.5;">Changes have been proposed on the following NDA. You can accept, reject, or counter each one.</p>
    ${emailDocTitle(safeDraftTitle)}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
      <tr>
        <td style="padding: 10px 14px; background-color: #f9fafb; border-bottom: 1px solid #e5e7eb; font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Field</td>
        <td style="padding: 10px 14px; background-color: #f9fafb; border-bottom: 1px solid #e5e7eb; font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Change</td>
      </tr>
      ${changesRows}
    </table>
    ${moreText}
    ${emailButton('Review Changes', reviewLink)}
  `
  return getBaseEmailHtml('Changes Suggested on Your NDA', content)
}

export function finalSignedEmailHtml(
  draftTitle: string,
  downloadLink: string
): string {
  const safeDraftTitle = sanitizeForHtml(draftTitle)
  const content = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center" style="padding-bottom: 20px;">
        <div style="width: 48px; height: 48px; background-color: #f0fdfa; border-radius: 10px; line-height: 48px; text-align: center;">
          <span style="font-size: 22px; color: #0f766e; font-weight: 800;">&#10003;</span>
        </div>
      </td></tr>
    </table>
    ${emailAccentLabel('Complete')}
    <h2 style="margin: 0 0 12px; font-size: 20px; font-weight: 800; color: #111827; line-height: 1.3;">Your NDA is fully signed</h2>
    <p style="margin: 0 0 4px; font-size: 15px; color: #6b7280; line-height: 1.5;">Both parties have signed the agreement. A PDF copy is ready for your records.</p>
    ${emailDocTitle(safeDraftTitle)}
    ${emailButton('Download Final PDF', downloadLink)}
  `
  return getBaseEmailHtml('NDA Completed', content)
}

export function recipientSignRequestEmailHtml(
  draftTitle: string,
  signLink: string
): string {
  const safeDraftTitle = sanitizeForHtml(draftTitle)
  const content = `
    ${emailAccentLabel('Signature Request')}
    <h2 style="margin: 0 0 12px; font-size: 20px; font-weight: 800; color: #111827; line-height: 1.3;">You're invited to sign an NDA</h2>
    <p style="margin: 0 0 4px; font-size: 15px; color: #6b7280; line-height: 1.5;">The following agreement has been reviewed and is ready for your signature. It only takes a minute.</p>
    ${emailDocTitle(safeDraftTitle)}
    ${emailInfoBox(`
      <p style="margin: 0 0 4px; font-size: 12px; font-weight: 700; color: #0f766e; text-transform: uppercase; letter-spacing: 0.04em;">What is an NDA?</p>
      <p style="margin: 0; font-size: 13px; color: #115e59; line-height: 1.5;">A Non-Disclosure Agreement is a short legal document where both parties agree to keep shared confidential information private.</p>
    `)}
    ${emailAccentLabel('How signing works')}
    ${emailSteps([
      { title: 'Read the document', desc: 'You will see the full NDA so you know exactly what you are signing.' },
      { title: 'Add your signature', desc: 'Type your name, draw it, or upload an image — whichever you prefer.' },
      { title: 'Done — you will get a copy', desc: 'Once all parties sign, everyone receives the fully executed NDA by email.' },
    ])}
    ${emailButton('Review and Sign', signLink)}
    ${emailSubtext('Secure link &middot; No account needed &middot; Expires in 30 days')}
  `
  return getBaseEmailHtml('Signature Request', content)
}

export function timeToSignEmailHtml(
  draftTitle: string,
  signLink: string,
  signerName: string
): string {
  const safeDraftTitle = sanitizeForHtml(draftTitle)
  const safeSignerName = sanitizeForHtml(signerName)
  const content = `
    ${emailAccentLabel('Your turn to sign')}
    <h2 style="margin: 0 0 12px; font-size: 20px; font-weight: 800; color: #111827; line-height: 1.3;">${safeSignerName} has signed — you're up</h2>
    <p style="margin: 0 0 4px; font-size: 15px; color: #6b7280; line-height: 1.5;">Great news! The other party has already added their signature. Please review the document and add yours to finalize the agreement.</p>
    ${emailDocTitle(safeDraftTitle)}
    ${emailSteps([
      { title: 'Review the signed document', desc: 'You will see the full NDA including the other party\'s signature.' },
      { title: 'Add your signature', desc: 'Type, draw, or upload your signature to complete the agreement.' },
    ])}
    ${emailButton('Review and Sign', signLink)}
  `
  return getBaseEmailHtml('Your Turn to Sign', content)
}

export function congratulationsEmailHtml(
  draftTitle: string,
  downloadLink: string
): string {
  const safeDraftTitle = sanitizeForHtml(draftTitle)
  const content = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center" style="padding-bottom: 20px;">
        <div style="width: 48px; height: 48px; background-color: #f0fdfa; border-radius: 10px; line-height: 48px; text-align: center;">
          <span style="font-size: 22px; color: #0f766e; font-weight: 800;">&#10003;</span>
        </div>
      </td></tr>
    </table>
    ${emailAccentLabel('All signed')}
    <h2 style="margin: 0 0 12px; font-size: 20px; font-weight: 800; color: #111827; line-height: 1.3; text-align: center;">Your NDA is complete</h2>
    <p style="margin: 0 0 4px; font-size: 15px; color: #6b7280; line-height: 1.5; text-align: center;">Both parties have signed. The fully executed agreement is ready for download. A PDF copy is attached for your records.</p>
    ${emailDocTitle(safeDraftTitle)}
    ${emailButton('Download Final PDF', downloadLink)}
  `
  return getBaseEmailHtml('NDA Complete', content)
}

export function partyBSuggestionsEmailHtml(
  draftTitle: string,
  partyBName: string,
  partyBEmail: string,
  suggestions: Record<string, string>,
  reviewLink: string
): string {
  const safeDraftTitle = sanitizeForHtml(draftTitle)
  const safePartyBName = sanitizeForHtml(partyBName)
  const safePartyBEmail = sanitizeForHtml(partyBEmail)

  const suggestionRows = Object.entries(suggestions)
    .filter(([, value]) => value && value.trim())
    .map(([key, value]) => {
      const fieldName = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
      return `<tr>
        <td style="padding: 10px 14px; border-bottom: 1px solid #f3f4f6; vertical-align: top;">
          <p style="margin: 0; font-size: 13px; font-weight: 600; color: #111827;">${sanitizeForHtml(fieldName)}</p>
        </td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #f3f4f6; vertical-align: top;">
          <p style="margin: 0; font-size: 13px; color: #0f766e; font-weight: 600;">${sanitizeForHtml(value)}</p>
        </td>
      </tr>`
    })
    .join('')

  const content = `
    ${emailAccentLabel('Suggestions received')}
    <h2 style="margin: 0 0 12px; font-size: 20px; font-weight: 800; color: #111827; line-height: 1.3;">${safePartyBName} suggested changes to your NDA</h2>
    <p style="margin: 0 0 4px; font-size: 15px; color: #6b7280; line-height: 1.5;">
      <a href="mailto:${safePartyBEmail}" style="color: #0f766e; text-decoration: none;">${safePartyBEmail}</a> reviewed the agreement and proposed the following edits. You can accept, reject, or counter each one.
    </p>
    ${emailDocTitle(safeDraftTitle)}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
      <tr>
        <td style="padding: 10px 14px; background-color: #f9fafb; border-bottom: 1px solid #e5e7eb; font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Field</td>
        <td style="padding: 10px 14px; background-color: #f9fafb; border-bottom: 1px solid #e5e7eb; font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Suggested Value</td>
      </tr>
      ${suggestionRows}
    </table>
    ${emailButton('Review Suggestions', reviewLink)}
  `
  return getBaseEmailHtml('Suggestions on Your NDA', content)
}

export function partyARequestChangesEmailHtml(
  draftTitle: string,
  message: string,
  editLink: string
): string {
  const safeDraftTitle = sanitizeForHtml(draftTitle)
  const safeMessage = sanitizeForHtml(message)
  const content = `
    ${emailAccentLabel('Changes requested')}
    <h2 style="margin: 0 0 12px; font-size: 20px; font-weight: 800; color: #111827; line-height: 1.3;">The other party requested updates</h2>
    <p style="margin: 0 0 4px; font-size: 15px; color: #6b7280; line-height: 1.5;">Your submission has been reviewed and a few updates are needed before moving forward.</p>
    ${emailDocTitle(safeDraftTitle)}
    ${emailNote('Feedback from the sender', safeMessage)}
    ${emailSteps([
      { title: 'Review the feedback above', desc: 'Understand what changes are being asked for.' },
      { title: 'Update the document', desc: 'Open the NDA and make the requested changes.' },
      { title: 'Submit your updates', desc: 'Once done, submit the document back for review.' },
    ])}
    ${emailButton('Review and Update', editLink)}
  `
  return getBaseEmailHtml('Updates Requested', content)
}

export function recipientInputSubmittedEmailHtml(
  draftTitle: string,
  partyBName: string,
  reviewLink: string
): string {
  const safeDraftTitle = sanitizeForHtml(draftTitle)
  const safePartyBName = sanitizeForHtml(partyBName)
  const content = `
    ${emailAccentLabel('Submission received')}
    <h2 style="margin: 0 0 12px; font-size: 20px; font-weight: 800; color: #111827; line-height: 1.3;">${safePartyBName} submitted their details</h2>
    <p style="margin: 0 0 4px; font-size: 15px; color: #6b7280; line-height: 1.5;">The other party has filled in the requested information and did not suggest any changes to your terms.</p>
    ${emailDocTitle(safeDraftTitle)}
    ${emailInfoBox(`
      <p style="margin: 0; font-size: 13px; color: #115e59; line-height: 1.5;">No changes were proposed. You can review their submitted details and proceed to signing when ready.</p>
    `)}
    ${emailButton('Review Submission', reviewLink)}
  `
  return getBaseEmailHtml('Details Submitted', content)
}

export function inviteEmailHtml(
  orgName: string,
  inviterName: string,
  role: string,
  signUpLink: string
): string {
  const safeOrgName = sanitizeForHtml(orgName)
  const safeInviterName = sanitizeForHtml(inviterName)
  const roleLabel = role === 'APPROVER' ? 'Approver' : 'Contributor'
  const roleDesc =
    role === 'APPROVER'
      ? 'Create and send NDAs, approve submissions from team members, and sign on behalf of the company.'
      : 'Create and edit NDA drafts. An approver on your team will review them before they are sent externally.'

  const content = `
    ${emailAccentLabel('Team invitation')}
    <h2 style="margin: 0 0 12px; font-size: 20px; font-weight: 800; color: #111827; line-height: 1.3;">${safeInviterName} invited you to ${safeOrgName}</h2>
    <p style="margin: 0 0 4px; font-size: 15px; color: #6b7280; line-height: 1.5;">You have been invited to join the team on Formalize It. Here is what you will be able to do:</p>
    ${emailInfoBox(`
      <p style="margin: 0 0 6px; font-size: 12px; font-weight: 700; color: #0f766e; text-transform: uppercase; letter-spacing: 0.04em;">Your role: ${roleLabel}</p>
      <p style="margin: 0; font-size: 13px; color: #115e59; line-height: 1.5;">${roleDesc}</p>
    `)}
    <p style="margin: 20px 0 0; font-size: 14px; color: #6b7280; line-height: 1.5;">If you already have an account, just sign in and you will be added to the organization automatically.</p>
    ${emailButton('Accept Invitation', signUpLink)}
  `
  return getBaseEmailHtml(`Join ${safeOrgName} on Formalize It`, content)
}

export function approvalRequestEmailHtml(
  draftTitle: string,
  submitterName: string,
  reviewLink: string
): string {
  const safeDraftTitle = sanitizeForHtml(draftTitle)
  const safeSubmitterName = sanitizeForHtml(submitterName)
  const content = `
    ${emailAccentLabel('Approval needed')}
    <h2 style="margin: 0 0 12px; font-size: 20px; font-weight: 800; color: #111827; line-height: 1.3;">${safeSubmitterName} submitted a draft for your review</h2>
    <p style="margin: 0 0 4px; font-size: 15px; color: #6b7280; line-height: 1.5;">A team member has prepared an NDA and is waiting for your approval before it can be sent to the other party.</p>
    ${emailDocTitle(safeDraftTitle)}
    ${emailSteps([
      { title: 'Review the draft', desc: 'Check the terms, fields, and overall structure.' },
      { title: 'Approve or request changes', desc: 'If everything looks good, approve it. Otherwise, send it back with feedback.' },
    ])}
    ${emailButton('Review Draft', reviewLink)}
  `
  return getBaseEmailHtml('Draft Awaiting Approval', content)
}

export function approvalApprovedEmailHtml(
  draftTitle: string,
  approverName: string,
  draftLink: string
): string {
  const safeDraftTitle = sanitizeForHtml(draftTitle)
  const safeApproverName = sanitizeForHtml(approverName)
  const content = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center" style="padding-bottom: 20px;">
        <div style="width: 48px; height: 48px; background-color: #f0fdfa; border-radius: 10px; line-height: 48px; text-align: center;">
          <span style="font-size: 22px; color: #0f766e; font-weight: 800;">&#10003;</span>
        </div>
      </td></tr>
    </table>
    ${emailAccentLabel('Approved')}
    <h2 style="margin: 0 0 12px; font-size: 20px; font-weight: 800; color: #111827; line-height: 1.3;">${safeApproverName} approved your NDA draft</h2>
    <p style="margin: 0 0 4px; font-size: 15px; color: #6b7280; line-height: 1.5;">Your draft is now ready to be sent to the other party for review and signature.</p>
    ${emailDocTitle(safeDraftTitle)}
    ${emailButton('View Draft', draftLink)}
  `
  return getBaseEmailHtml('Your Draft Was Approved', content)
}

export function inputRequestEmailHtml(
  draftTitle: string,
  inputLink: string,
  fieldCount: number,
  message: string
): string {
  const safeDraftTitle = sanitizeForHtml(draftTitle)
  const safeMessage = sanitizeForHtml(message)
  const fieldText = fieldCount === 1 ? '1 field' : `${fieldCount} fields`
  const content = `
    ${emailAccentLabel('Input requested')}
    <h2 style="margin: 0 0 12px; font-size: 20px; font-weight: 800; color: #111827; line-height: 1.3;">Your input is needed on an NDA</h2>
    <p style="margin: 0 0 4px; font-size: 15px; color: #6b7280; line-height: 1.5;">There ${fieldCount === 1 ? 'is' : 'are'} ${fieldText} that ${fieldCount === 1 ? 'needs' : 'need'} your information before this agreement can move forward.</p>
    ${emailDocTitle(safeDraftTitle)}
    ${safeMessage ? emailNote('Message from the sender', safeMessage) : ''}
    ${emailAccentLabel('How it works')}
    ${emailSteps([
      { title: 'Review the NDA', desc: 'See the full document so you know what you are filling in.' },
      { title: `Complete ${fieldText}`, desc: 'The fields that need your input are clearly highlighted.' },
      { title: 'Submit and move forward', desc: 'Once you submit, the NDA proceeds to the signing stage.' },
    ])}
    ${emailButton('Complete My Part', inputLink)}
    ${emailSubtext('Secure link &middot; No account needed &middot; Expires in 30 days')}
  `
  return getBaseEmailHtml('Input Needed on NDA', content)
}

export function approvalRejectedEmailHtml(
  draftTitle: string,
  approverName: string,
  message: string,
  draftLink: string
): string {
  const safeDraftTitle = sanitizeForHtml(draftTitle)
  const safeApproverName = sanitizeForHtml(approverName)
  const safeMessage = sanitizeForHtml(message)
  const content = `
    ${emailAccentLabel('Changes requested')}
    <h2 style="margin: 0 0 12px; font-size: 20px; font-weight: 800; color: #111827; line-height: 1.3;">${safeApproverName} requested changes on your draft</h2>
    <p style="margin: 0 0 4px; font-size: 15px; color: #6b7280; line-height: 1.5;">Your NDA draft has been reviewed and needs a few updates before it can be approved.</p>
    ${emailDocTitle(safeDraftTitle)}
    ${emailNote('Feedback', safeMessage || 'Please review and update the draft.')}
    <p style="margin: 20px 0 0; font-size: 14px; color: #6b7280; line-height: 1.5;">Update the draft based on the feedback above and resubmit when ready.</p>
    ${emailButton('Edit Draft', draftLink)}
  `
  return getBaseEmailHtml('Changes Requested on Your Draft', content)
}

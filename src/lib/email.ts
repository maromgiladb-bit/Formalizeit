import { Resend } from 'resend'

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
      <h3 style="margin-top: 0; font-size: 16px; color: #166534; font-weight: 600; margin-bottom: 12px;">As easy as 1, 2, 3:</h3>
      <div style="margin-bottom: 12px; display: flex; align-items: flex-start;">
        <div style="background-color: #22c55e; color: white; width: 24px; height: 24px; border-radius: 12px; display: inline-flex; justify-content: center; align-items: center; font-size: 14px; font-weight: bold; margin-right: 12px; flex-shrink: 0;">1</div>
        <div style="color: #15803d; font-size: 15px; line-height: 24px;">Click the button below to open the secure document</div>
      </div>
      <div style="margin-bottom: 12px; display: flex; align-items: flex-start;">
        <div style="background-color: #22c55e; color: white; width: 24px; height: 24px; border-radius: 12px; display: inline-flex; justify-content: center; align-items: center; font-size: 14px; font-weight: bold; margin-right: 12px; flex-shrink: 0;">2</div>
        <div style="color: #15803d; font-size: 15px; line-height: 24px;">Review the terms and suggest edits by directly clicking on any field</div>
      </div>
      <div style="display: flex; align-items: flex-start;">
        <div style="background-color: #22c55e; color: white; width: 24px; height: 24px; border-radius: 12px; display: inline-flex; justify-content: center; align-items: center; font-size: 14px; font-weight: bold; margin-right: 12px; flex-shrink: 0;">3</div>
        <div style="color: #15803d; font-size: 15px; line-height: 24px;">Submit it back or sign it when you're ready to proceed</div>
      </div>
    </div>
    
    <div style="text-align: center;">
      <a href="${editLink}" class="button">Review Document</a>
    </div>
    <p style="text-align: center; margin-top: 24px; font-size: 14px; color: #6b7280;">This secure link is valid for 30 days. No account required.</p>
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
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #374151; margin: 0; padding: 0; background: #f3f4f6; }
          .wrapper { background: #f3f4f6; padding: 40px 20px; }
          .container { max-width: 600px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 24px; }
          .logo { font-size: 22px; font-weight: 800; color: #0d9488; letter-spacing: -0.5px; }
          .tagline { font-size: 13px; color: #9ca3af; margin-top: 2px; }
          .card { background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.08); margin-bottom: 16px; }
          .card-header { background: linear-gradient(135deg, #0d9488, #0891b2); padding: 28px 32px; }
          .card-header h1 { margin: 0; color: white; font-size: 20px; font-weight: 700; }
          .card-header p { margin: 6px 0 0; color: rgba(255,255,255,0.85); font-size: 14px; }
          .card-body { padding: 28px 32px; }
          .doc-row { background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 10px; padding: 14px 18px; margin-bottom: 20px; }
          .doc-row p { margin: 0; font-size: 14px; color: #134e4a; }
          .doc-name { font-size: 17px; font-weight: 700; color: #0d9488; margin: 4px 0 0; }
          .what-is { background: #f0f9ff; border-radius: 10px; padding: 14px 18px; margin: 18px 0; font-size: 14px; color: #0c4a6e; }
          .what-is strong { display: block; margin-bottom: 4px; color: #075985; }
          .steps-title { font-size: 13px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin: 22px 0 12px; }
          .steps { margin: 0; padding: 0; list-style: none; }
          .step { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 14px; }
          .step-icon { flex-shrink: 0; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; }
          .step-1 { background: #e0f2fe; }
          .step-2 { background: #fef3c7; }
          .step-3 { background: #dcfce7; }
          .step-text strong { display: block; font-size: 14px; color: #111827; margin-bottom: 2px; }
          .step-text span { font-size: 13px; color: #6b7280; }
          .cta-wrap { text-align: center; padding: 24px 0 8px; }
          .button { display: inline-block; background: #0d9488; color: white !important; padding: 15px 36px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 16px; }
          .reassurance { display: flex; gap: 20px; justify-content: center; flex-wrap: wrap; margin: 20px 0 0; }
          .reassurance span { font-size: 12px; color: #9ca3af; display: flex; align-items: center; gap: 4px; }
          .footer { text-align: center; color: #9ca3af; font-size: 12px; padding: 8px 0 24px; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="container">
            <div class="header">
              <div class="logo">Formalize It</div>
              <div class="tagline">Smart NDA workflows</div>
            </div>

            <div class="card">
              <div class="card-header">
                <h1>You're invited to sign an NDA ✍️</h1>
                <p>Read, review and sign — no account needed, takes just a minute</p>
              </div>
              <div class="card-body">

                <div class="doc-row">
                  <p>The following NDA is ready and waiting for your signature:</p>
                  <p class="doc-name">${draftTitle}</p>
                </div>

                <div class="what-is">
                  <strong>📋 What's a Mutual NDA?</strong>
                  A Non-Disclosure Agreement (NDA) is a short legal document where both parties agree to keep each other's confidential information private. Signing takes about 60 seconds.
                </div>

                <div class="steps-title">Here's what to expect</div>
                <ul class="steps">
                  <li class="step">
                    <div class="step-icon step-1">📄</div>
                    <div class="step-text">
                      <strong>Read the document</strong>
                      <span>You'll see the full NDA so you know exactly what you're signing. No surprises.</span>
                    </div>
                  </li>
                  <li class="step">
                    <div class="step-icon step-2">✍️</div>
                    <div class="step-text">
                      <strong>Add your signature</strong>
                      <span>Type your name, draw it, or upload an image — whichever you prefer.</span>
                    </div>
                  </li>
                  <li class="step">
                    <div class="step-icon step-3">🎉</div>
                    <div class="step-text">
                      <strong>Done — you'll get a copy</strong>
                      <span>Once all parties have signed, everyone receives a copy of the fully executed NDA by email.</span>
                    </div>
                  </li>
                </ul>

                <div class="cta-wrap">
                  <a href="${signLink}" class="button">Review &amp; Sign the NDA →</a>
                </div>

                <div class="reassurance">
                  <span>🔒 Secure link</span>
                  <span>📧 No account required</span>
                  <span>⏱ Expires in 30 days</span>
                </div>
              </div>
            </div>

            <div class="footer">
              <p>© ${new Date().getFullYear()} Formalize It. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `
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

export function partyBSuggestionsEmailHtml(
  draftTitle: string,
  partyBName: string,
  partyBEmail: string,
  suggestions: Record<string, string>,
  reviewLink: string
): string {
  const suggestionsList = Object.entries(suggestions)
    .filter(([, value]) => value && value.trim())
    .map(([key, value]) => {
      const fieldName = key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
      return `<li style="margin-bottom: 8px;"><strong>${fieldName}:</strong> <span style="color: #0d9488; font-weight: 500;">${value}</span></li>`;
    })
    .join("");

  const content = `
    <h2>Review Requested</h2>
    <p><strong>${partyBName}</strong> (<a href="mailto:${partyBEmail}">${partyBEmail}</a>) has reviewed your NDA and suggested some changes:</p>
    <p class="highlight">${draftTitle}</p>
    
    <div style="background-color: #f0fdfa; border: 1px solid #ccfbf1; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <h3 style="margin-top: 0; font-size: 16px; color: #0f766e; margin-bottom: 12px;">Suggested Changes:</h3>
      <ul style="margin: 0; padding-left: 20px; color: #115e59; font-size: 15px;">
        ${suggestionsList}
      </ul>
    </div>
    
    <p>You can review these suggestions and choose to accept them, edit the information yourself, or keep your original values.</p>
    
    <div style="text-align: center;">
      <a href="${reviewLink}" class="button">Review Suggestions</a>
    </div>
  `
  return getBaseEmailHtml('Partner Suggested Changes', content)
}

export function partyARequestChangesEmailHtml(
  draftTitle: string,
  message: string,
  editLink: string
): string {
  const content = `
    <h2>Further Updates Requested</h2>
    <p>The sender has reviewed your submission for the following NDA and requested some updates:</p>
    <p class="highlight">${draftTitle}</p>
    
    <div style="background-color: #fffbeb; border-left: 4px solid #fbbf24; padding: 16px; margin: 24px 0; border-radius: 4px;">
      <strong style="color: #b45309; display: block; margin-bottom: 4px;">Note from the sender:</strong>
      <span style="color: #92400e; font-size: 15px;">${message}</span>
    </div>
    
    <p>Please review their request and update the NDA accordingly.</p>
    
    <div style="text-align: center;">
      <a href="${editLink}" class="button">Review & Update NDA</a>
    </div>
  `
  return getBaseEmailHtml('Updates Requested', content)
}

export function recipientInputSubmittedEmailHtml(
  draftTitle: string,
  partyBName: string,
  reviewLink: string
): string {
  const content = `
    <h2>Information Submitted</h2>
    <p><strong>${partyBName}</strong> has filled in their required details for the NDA:</p>
    <p class="highlight">${draftTitle}</p>

    <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center;">
      <p style="color: #4b5563; margin: 0; font-size: 15px;">No changes were suggested to your existing terms. Please review their submitted information to complete the process or proceed to signing.</p>
    </div>

    <div style="text-align: center;">
      <a href="${reviewLink}" class="button">Review Submission</a>
    </div>
  `
  return getBaseEmailHtml('Information Submitted', content)
}

export function inviteEmailHtml(
  orgName: string,
  inviterName: string,
  role: string,
  signUpLink: string
): string {
  const roleLabel = role === 'APPROVER' ? 'Approver' : 'Contributor'
  const roleDesc =
    role === 'APPROVER'
      ? 'You can create and send NDAs, approve submissions, and sign on behalf of the company.'
      : 'You can create and edit NDA drafts. An approver will review them before they are sent externally.'
  const content = `
    <h2>You've been invited to ${orgName}</h2>
    <p><strong>${inviterName}</strong> has invited you to join <strong>${orgName}</strong> on Formalize It as a <strong>${roleLabel}</strong>.</p>

    <div style="background-color: #f0fdfa; border: 1px solid #99f6e4; border-radius: 8px; padding: 16px; margin: 24px 0;">
      <strong style="color: #0f766e; display: block; margin-bottom: 4px;">Your role: ${roleLabel}</strong>
      <span style="color: #115e59; font-size: 14px;">${roleDesc}</span>
    </div>

    <p>Click the button below to create your account and get started. If you already have an account, sign in and you'll automatically be added to the organization.</p>

    <div style="text-align: center;">
      <a href="${signUpLink}" class="button">Accept Invitation →</a>
    </div>
  `
  return getBaseEmailHtml(`Invitation to ${orgName}`, content)
}

export function approvalRequestEmailHtml(
  draftTitle: string,
  submitterName: string,
  reviewLink: string
): string {
  const content = `
    <h2>NDA Awaiting Your Approval</h2>
    <p><strong>${submitterName}</strong> has submitted the following NDA draft for your review and approval:</p>
    <p class="highlight">${draftTitle}</p>

    <p>As an approver, you can review the draft, request changes, or approve it so it can be sent to the other party.</p>

    <div style="text-align: center;">
      <a href="${reviewLink}" class="button">Review Draft →</a>
    </div>
  `
  return getBaseEmailHtml('Approval Required', content)
}

export function approvalApprovedEmailHtml(
  draftTitle: string,
  approverName: string,
  draftLink: string
): string {
  const content = `
    <h2>Your NDA Has Been Approved</h2>
    <p><strong>${approverName}</strong> has approved your NDA draft:</p>
    <p class="highlight">${draftTitle}</p>

    <p>The draft is now ready to be sent to the other party for review and signature.</p>

    <div style="text-align: center;">
      <a href="${draftLink}" class="button">View Draft →</a>
    </div>
  `
  return getBaseEmailHtml('Draft Approved', content)
}

export function approvalRejectedEmailHtml(
  draftTitle: string,
  approverName: string,
  message: string,
  draftLink: string
): string {
  const content = `
    <h2>Changes Requested on Your NDA Draft</h2>
    <p><strong>${approverName}</strong> has reviewed your NDA draft and requested changes:</p>
    <p class="highlight">${draftTitle}</p>

    <div style="background-color: #fffbeb; border-left: 4px solid #fbbf24; padding: 16px; margin: 24px 0; border-radius: 4px;">
      <strong style="color: #b45309; display: block; margin-bottom: 4px;">Feedback:</strong>
      <span style="color: #92400e; font-size: 15px;">${message || 'Please review and update the draft.'}</span>
    </div>

    <p>Please update the draft and resubmit for approval when ready.</p>

    <div style="text-align: center;">
      <a href="${draftLink}" class="button">Edit Draft →</a>
    </div>
  `
  return getBaseEmailHtml('Changes Requested', content)
}

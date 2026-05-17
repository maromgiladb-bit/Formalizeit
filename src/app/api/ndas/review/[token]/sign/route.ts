import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, getAppUrl } from "@/lib/email";
import { sanitizeForHtml } from "@/lib/sanitize";
import { renderNdaHtml } from "@/lib/renderNdaHtml";
import { htmlToPdf } from "@/lib/htmlToPdf";

export async function POST(
	request: NextRequest,
	{ params }: { params: { token: string } }
) {
	try {
		const { token } = params;
		const body = await request.json();
		const { party_b_signatory_name, signature_date } = body;

		if (!party_b_signatory_name || !signature_date) {
			return NextResponse.json(
				{ error: "Signature name and date are required" },
				{ status: 400 }
			);
		}

		// Find the sign request
		const signRequest = await prisma.sign_requests.findUnique({
			where: { token },
			include: {
				signers: {
					include: {
						nda_drafts: true,
					},
				},
			},
		});

		if (!signRequest) {
			return NextResponse.json(
				{ error: "Invalid token" },
				{ status: 404 }
			);
		}

		// Check expiry
		if (new Date() > signRequest.expires_at) {
			return NextResponse.json(
				{ error: "Token expired" },
				{ status: 410 }
			);
		}

		// Check if token allows signing
		if (signRequest.scope !== "SIGN" && signRequest.scope !== "REVIEW") {
			return NextResponse.json(
				{ error: "This link does not allow signing" },
				{ status: 403 }
			);
		}

		const draft = signRequest.signers.nda_drafts;
		const currentData = draft.data as Record<string, unknown>;

		// Update draft with signature
		const updatedData = {
			...currentData,
			party_b_signatory_name,
			party_b_signed_at: signature_date,
		};

		// Update draft status to SIGNED since Party B has signed
		await prisma.nda_drafts.update({
			where: { id: draft.id },
			data: {
				data: updatedData,
				updated_at: new Date(),
				last_actor: "RECIPIENT",
				status: "SIGNED", // Mark as fully signed
				provisional_recipient_signed_at: new Date(),
			},
		});

		// Update signer status
		await prisma.signers.update({
			where: { id: signRequest.signer_id },
			data: {
				status: "SIGNED",
				signed_at: new Date(),
			},
		});

		// Mark token as consumed
		await prisma.sign_requests.update({
			where: { id: signRequest.id },
			data: {
				consumed_at: new Date(),
			},
		});

		// Create revision record
		await prisma.nda_revisions.create({
			data: {
				draft_id: draft.id,
				number: await getNextRevisionNumber(draft.id),
				actor_role: "RECIPIENT",
				base_form: draft.data || {},
				new_form: updatedData,
				diff: { signed: true, signatory: party_b_signatory_name },
				message: `Party B signed the document as ${party_b_signatory_name}`,
			},
		});

		// Send notification email to Party A (owner) without PDF attachment - PDF will be attached only in final completion email
		try {
			// Get the owner's email
			const owner = await prisma.users.findUnique({
				where: { id: draft.created_by_id },
			});

			if (owner?.email) {
				console.log("📧 Preparing to send notification to Party A:", owner.email);

				// Send email without PDF attachment
				await sendEmail({
					to: owner.email,
					subject: `Time to sign! ${party_b_signatory_name} has already signed the NDA`,
					html: partyASignedNotificationHtml(
						draft.title || "Untitled NDA",
						party_b_signatory_name,
						signRequest.signers.email,
						`${getAppUrl()}/dashboard`
					)
				});

				console.log("✅ Notification sent to Party A");
			}
		} catch (emailError) {
			console.error("❌ Failed to send signed document notification:", emailError);
			// Don't fail the request if email fails
		}

		return NextResponse.json({
			success: true,
			message: "Document signed successfully",
		});
	} catch (error) {
		console.error("Error signing document:", error);
		return NextResponse.json(
			{ error: "Failed to sign document" },
			{ status: 500 }
		);
	}
}

// Email template for Party A notification
function partyASignedNotificationHtml(
	draftTitle: string,
	signatoryName: string,
	signerEmail: string,
	dashboardLink: string
): string {
	const safeDraftTitle = sanitizeForHtml(draftTitle)
	const safeSignatoryName = sanitizeForHtml(signatoryName)
	const safeSignerEmail = sanitizeForHtml(signerEmail)
	return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
          .content { background: #f9fafb; padding: 30px; border-radius: 8px; margin-bottom: 20px; text-align: center; }
          .success { color: #16a34a; font-size: 48px; margin-bottom: 20px; }
          .info-box { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; text-align: left; }
          .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
          .info-row:last-child { border-bottom: none; }
          .info-label { font-weight: 600; color: #6b7280; }
          .info-value { color: #111827; }
          .button { display: inline-block; background: linear-gradient(135deg, #2563eb, #9333ea); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
          .attachment-notice { background: #dbeafe; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0; text-align: left; }
          .footer { text-align: center; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Formalize It</div>
          </div>
          <div class="content">
            <div class="success">✓</div>
            <h2>NDA Successfully Signed!</h2>
            <p><strong>${safeDraftTitle}</strong></p>
            <p>Your NDA has been signed by the recipient. The fully executed document is attached to this email.</p>

            <div class="info-box">
              <div class="info-row">
                <span class="info-label">Signed by:</span>
                <span class="info-value">${safeSignatoryName}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Email:</span>
                <span class="info-value">${safeSignerEmail}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Date:</span>
                <span class="info-value">${new Date().toLocaleDateString()}</span>
              </div>
            </div>

            <div class="attachment-notice">
              <strong>📎 Signed PDF Attached</strong><br>
              The fully executed NDA with all signatures is attached to this email. Please save it for your records.
            </div>

            <a href="${dashboardLink}" class="button">View in Dashboard</a>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Formalize It. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

async function getNextRevisionNumber(draftId: string): Promise<number> {
	const lastRevision = await prisma.nda_revisions.findFirst({
		where: { draft_id: draftId },
		orderBy: { number: "desc" },
	});
	return (lastRevision?.number || 0) + 1;
}

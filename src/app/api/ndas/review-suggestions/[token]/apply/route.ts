import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, getAppUrl } from "@/lib/email";
import { sanitizeForHtml } from "@/lib/sanitize";
import { renderNdaHtml } from "@/lib/renderNdaHtml";
import { htmlToPdf } from "@/lib/htmlToPdf";
import { randomBytes } from "crypto";

export async function POST(
	request: NextRequest,
	{ params }: { params: { token: string } }
) {
	try {
		const { token } = params;
		const body = await request.json();
		const { updatedData, acceptedFields } = body;

		// Find the review sign request
		const signRequest = await prisma.sign_requests.findUnique({
			where: { token },
			include: {
				signers: {
					include: {
						nda_drafts: {
							include: {
								users: true,
							},
						},
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

		const draft = signRequest.signers.nda_drafts;
		const payload = signRequest.payload as Record<string, unknown>;
		const party_b_email = payload.party_b_email as string;
		const party_b_name = payload.party_b_name as string;

		// Update the draft with accepted changes
		await prisma.nda_drafts.update({
			where: { id: draft.id },
			data: {
				data: updatedData,
				updated_at: new Date(),
				last_actor: "OWNER",
				status: "SENT", // Send back to Party B
				sent_at: draft.sent_at ?? new Date(),
			},
		});

		// Create revision record
		await prisma.nda_revisions.create({
			data: {
				draft_id: draft.id,
				number: await getNextRevisionNumber(draft.id),
				actor_role: "OWNER",
				base_form: draft.data || {},
				new_form: updatedData,
				diff: { acceptedFields },
				message: "Party A applied suggestions and sent back",
			},
		});

		// Generate new token for Party B to sign
		const newToken = randomBytes(32).toString("hex");
		const expiresAt = new Date();
		expiresAt.setDate(expiresAt.getDate() + 30);

		// Find existing Party B signer or create one
		let partBSigner = await prisma.signers.findFirst({
			where: {
				draft_id: draft.id,
				email: party_b_email,
				role: "Party B",
			},
		});

		if (!partBSigner) {
			partBSigner = await prisma.signers.create({
				data: {
					draft_id: draft.id,
					email: party_b_email,
					role: "Party B",
					status: "PENDING",
				},
			});
		} else {
			// Reset signer status
			await prisma.signers.update({
				where: { id: partBSigner.id },
				data: { status: "PENDING", signed_at: null },
			});
		}

		// Create new sign request for Party B
		await prisma.sign_requests.create({
			data: {
				signer_id: partBSigner.id,
				token: newToken,
				scope: "REVIEW",
				expires_at: expiresAt,
			},
		});

		// Mark current token as consumed
		await prisma.sign_requests.update({
			where: { id: signRequest.id },
			data: { consumed_at: new Date() },
		});

		// Send email to Party B without PDF attachment - PDF will be attached only in final completion email
		const reviewLink = `${getAppUrl()}/review-nda/${newToken}`;

		await sendEmail({
			to: party_b_email,
			subject: `Updated NDA ready for your signature – ${draft.title || "NDA"}`,
			html: generatePartyBReturnEmail(
				draft.title || "Untitled NDA",
				party_b_name,
				acceptedFields as string[],
				reviewLink
			)
		});

		console.log("✅ Updated NDA sent back to Party B");

		return NextResponse.json({
			success: true,
			message: "Changes applied and sent back to Party B",
		});
	} catch (error) {
		console.error("Error applying suggestions:", error);
		return NextResponse.json(
			{ error: "Failed to apply changes" },
			{ status: 500 }
		);
	}
}

async function getNextRevisionNumber(draftId: string): Promise<number> {
	const lastRevision = await prisma.nda_revisions.findFirst({
		where: { draft_id: draftId },
		orderBy: { number: "desc" },
	});
	return (lastRevision?.number || 0) + 1;
}

function generatePartyBReturnEmail(
	docTitle: string,
	partyBName: string,
	acceptedFields: string[],
	reviewLink: string
): string {
	const safeDocTitle = sanitizeForHtml(docTitle)
	const safePartyBName = sanitizeForHtml(partyBName)
	const acceptedList =
		acceptedFields.length > 0
			? `
		<div style="background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 5px;">
			<h3 style="margin-top: 0; color: #065f46;">✅ Changes Applied:</h3>
			<ul style="margin: 10px 0; padding-left: 20px;">
				${acceptedFields.map((field) => `<li>${sanitizeForHtml(field.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()))}</li>`).join("")}
			</ul>
		</div>
	`
			: `<p style="color: #666;">Party A has reviewed your suggestions and kept their original information.</p>`;

	return `
<!DOCTYPE html>
<html>
<head>
	<style>
		body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
		.container { max-width: 600px; margin: 0 auto; padding: 20px; }
		.header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
		.content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
		.button { display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
		.footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
	</style>
</head>
<body>
	<div class="container">
		<div class="header">
			<h1>📝 Updated NDA Ready</h1>
		</div>
		<div class="content">
			<p>Hello ${safePartyBName},</p>

			<p>Party A has reviewed your suggestions for <strong>"${safeDocTitle}"</strong> and updated the NDA accordingly.</p>
			
			${acceptedList}
			
			<p>The NDA is now ready for your final review and signature.</p>
			
			<center>
				<a href="${reviewLink}" class="button">
					Review & Sign Updated NDA
				</a>
			</center>
			
			<p style="margin-top: 30px; font-size: 14px; color: #666;">
				This link will expire in 30 days. You can still make edits to your information before signing.
			</p>
		</div>
		<div class="footer">
			<p>This is an automated message from your NDA management system.</p>
		</div>
	</div>
</body>
</html>
	`;
}

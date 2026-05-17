import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, getAppUrl, partyBSuggestionsEmailHtml } from "@/lib/email";
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
		const { suggestions, party_b_email, party_b_name } = body;

		if (!suggestions || Object.keys(suggestions).length === 0) {
			return NextResponse.json(
				{ error: "No suggestions provided" },
				{ status: 400 }
			);
		}

		// Find the sign request
		const signRequest = await prisma.sign_requests.findUnique({
			where: { token },
			include: {
				signers: {
					include: {
						nda_drafts: {
							include: {
								users: true, // Get the owner
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

		// Check expiry
		if (new Date() > signRequest.expires_at) {
			return NextResponse.json(
				{ error: "Token expired" },
				{ status: 410 }
			);
		}

		const draft = signRequest.signers.nda_drafts;
		const owner = draft.users;

		// Store suggestions in a revision record
		await prisma.nda_revisions.create({
			data: {
				draft_id: draft.id,
				number: await getNextRevisionNumber(draft.id),
				actor_role: "RECIPIENT",
				base_form: draft.data || {},
				new_form: suggestions,
				diff: suggestions,
				message: `Party B (${party_b_name}) suggested changes`,
				comments: {
					party_b_email,
					party_b_name,
					suggestions,
				},
			},
		});

		// Update draft status to PENDING_OWNER_REVIEW
		await prisma.nda_drafts.update({
			where: { id: draft.id },
			data: {
				status: "PENDING_OWNER_REVIEW",
				last_actor: "RECIPIENT",
				updated_at: new Date(),
			},
		});

		// Generate review token for Party A
		const reviewToken = generateReviewToken();
		const expiresAt = new Date();
		expiresAt.setDate(expiresAt.getDate() + 7); // 7 days for owner to review

		// Create a new sign request for owner review (reusing signers table pattern)
		// Note: We're creating a temporary signer entry for the owner to review
		const ownerSigner = await prisma.signers.create({
			data: {
				draft_id: draft.id,
				email: owner.email,
				role: "Owner Review",
				status: "PENDING",
				user_id: owner.id,
			},
		});

		await prisma.sign_requests.create({
			data: {
				signer_id: ownerSigner.id,
				token: reviewToken,
				scope: "REVIEW",
				expires_at: expiresAt,
				payload: {
					suggestions,
					party_b_email,
					party_b_name,
					original_token: token,
				},
			},
		});

		// Send email to Party A (owner) without PDF attachment - PDF will be attached only in final completion email
		const reviewLink = `${getAppUrl()}/review-suggestions/${reviewToken}`;

		const partyBCompany = ((draft.data as Record<string, unknown>)?.party_b_name as string) || ''
		await sendEmail({
			to: owner.email,
			subject: `Review requested – ${party_b_name}${partyBCompany && partyBCompany !== party_b_name ? ` from ${partyBCompany}` : ''} made changes to the NDA`,
			html: partyBSuggestionsEmailHtml(
				draft.title || "Untitled NDA",
				party_b_name,
				party_b_email,
				suggestions,
				reviewLink
			)
		});

		console.log("✅ Suggestions sent to owner for review");

		return NextResponse.json({
			success: true,
			message: "Suggestions sent to Party A for review",
		});
	} catch (error) {
		console.error("Error sending suggestions:", error);
		return NextResponse.json(
			{ error: "Failed to send suggestions" },
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

function generateReviewToken(): string {
	return randomBytes(32).toString("hex");
}


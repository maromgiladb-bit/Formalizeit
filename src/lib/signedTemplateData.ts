type Content = Record<string, unknown>

/**
 * Maps stored NDA form content (party_a_* / party_b_* fields) onto the party_1_* /
 * party_2_* variables the NDA template renders, including both signatures.
 *
 * `formData` is the saved form content; `signedContent` is that content plus the
 * signature fields written at signing (defaults to `formData` when it already has them).
 * Used by both sign-public (final PDF) and viewpdf (regeneration) so they render alike.
 */
export function buildSignedTemplateData(
    formData: Content,
    signedContent: Content = formData
): Content {
    return {
        ...signedContent,
        party_1_name: formData.party_a_name || '',
        party_1_address: formData.party_a_address || '',
        party_1_signatory_name: formData.party_a_signatory_name || signedContent.party_1_signatory_name || '',
        party_1_signatory_title: formData.party_a_title || signedContent.party_1_signatory_title || '',
        party_1_phone: formData.party_a_phone || '',
        party_1_emails_joined: formData.party_a_email || '',
        party_1_signature_image: signedContent.party_1_signature_image || '',
        party_1_signature_date: signedContent.party_1_signature_date || '',
        party_2_name: formData.party_b_name || '',
        party_2_address: formData.party_b_address || '',
        party_2_signatory_name: formData.party_b_signatory_name || signedContent.party_2_signatory_name || '',
        party_2_signatory_title: formData.party_b_title || signedContent.party_2_signatory_title || '',
        party_2_phone: formData.party_b_phone || '',
        party_2_emails_joined: formData.party_b_email || '',
        party_2_signature_image: signedContent.party_2_signature_image || '',
        party_2_signature_date: signedContent.party_2_signature_date || '',
    }
}

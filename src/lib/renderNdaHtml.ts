import { renderTemplate, getTemplateById } from './templateManager'

import Handlebars from "handlebars";

Handlebars.registerHelper("ph", function (value: unknown, label: string) {
  const s = typeof value === "string" ? value.trim() : (value ?? "").toString().trim();
  return s ? s : `[${label}]`;
});

/**
 * Number-to-words for small integers (used for term_years_words)
 */
function numberToWords(n: number): string {
  const words = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
  return words[n] || n.toString();
}

/**
 * Normalize form data so that party_a/party_b field names are mapped
 * to the party_1/party_2 names expected by Handlebars templates.
 * Also converts effective_date, governing_law, and term_months to
 * their template-expected formats.
 *
 * Uses fallback logic: only sets a target field if it isn't already present,
 * so pre-mapped data from client-side code takes priority.
 */
function normalizeFormData(raw: Record<string, unknown>): Record<string, unknown> {
  const data = { ...raw };

  // --- party_a_* → party_1_* ---
  const partyAMap: Record<string, string> = {
    party_a_name: 'party_1_name',
    party_a_address: 'party_1_address',
    party_a_phone: 'party_1_phone',
    party_a_signatory_name: 'party_1_signatory_name',
    party_a_title: 'party_1_signatory_title',
    party_a_email: 'party_1_emails_joined',
  };

  for (const [src, dst] of Object.entries(partyAMap)) {
    if (!data[dst] && data[src]) {
      data[dst] = data[src];
    }
  }

  // --- party_b_* → party_2_* ---
  const partyBMap: Record<string, string> = {
    party_b_name: 'party_2_name',
    party_b_address: 'party_2_address',
    party_b_phone: 'party_2_phone',
    party_b_signatory_name: 'party_2_signatory_name',
    party_b_title: 'party_2_signatory_title',
    party_b_email: 'party_2_emails_joined',
  };

  for (const [src, dst] of Object.entries(partyBMap)) {
    if (!data[dst] && data[src]) {
      data[dst] = data[src];
    }
  }

  // --- effective_date → effective_date_long ---
  if (!data.effective_date_long && data.effective_date) {
    try {
      data.effective_date_long = new Date(data.effective_date as string).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      data.effective_date_long = data.effective_date;
    }
  }

  // --- governing_law → governing_law_full ---
  if (!data.governing_law_full && data.governing_law) {
    data.governing_law_full = data.governing_law;
  }

  // --- term_months → term_years_number + term_years_words ---
  if (!data.term_years_number && data.term_months) {
    const months = parseInt(data.term_months as string, 10);
    if (!isNaN(months)) {
      const years = Math.floor(months / 12);
      data.term_years_number = years.toString();
      data.term_years_words = numberToWords(years);
    }
  }

  // --- Fallback defaults for fields that may not have form inputs ---
  if (!data.purpose) {
    data.purpose = 'evaluating a potential business relationship';
  }
  if (!data.information_scope_text) {
    data.information_scope_text = 'All information, materials, documents, data, and other content';
  }

  return data;
}


/**
 * Render NDA HTML from form data
 * @param formData - The form data object from nda_drafts
 * @param templateId - Optional template ID (defaults to mutual_nda_v1)
 * @returns Rendered HTML string
 */
export async function renderNdaHtml(
  formData: Record<string, unknown>,
  templateId: string = 'mutual_nda_v1'
): Promise<string> {
  try {
    console.log(`📄 Rendering template: ${templateId}`)

    // Validate template exists
    const template = getTemplateById(templateId)
    if (!template) {
      throw new Error(`Template not found: ${templateId}`)
    }

    // Normalize field names (party_a→party_1, etc.) and add defaults
    const normalized = normalizeFormData(formData);

    // Prepare data with defaults
    const data = {
      ...normalized,
      // Map signature images to the structure expected by templates
      partyASignature: {
        signatureImage: normalized.party_1_signature_image || (normalized as any).partyASignature?.signatureImage
      },
      partyBSignature: {
        signatureImage: normalized.party_2_signature_image || (normalized as any).partyBSignature?.signatureImage
      },
      // Add any default values or transformations here
      current_date: normalized.effective_date || new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
    }

    // Render using template manager
    const html = renderTemplate(templateId, data)

    console.log(`✅ Template rendered successfully (${html.length} chars)`)
    return html
  } catch (error) {
    console.error('❌ Error rendering NDA HTML:', error)
    throw error
  }
}


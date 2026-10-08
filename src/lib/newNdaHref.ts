/**
 * Where "New NDA" CTAs go.
 *
 * MVP is one standard NDA, so the template picker (/templates) is an extra
 * click that shows a single card. Send users straight to the form. If/when a
 * second active template ships, point this back at "/templates".
 *
 * Kept free of heavy imports (no Handlebars / bundled template content) so it
 * is safe in client components like the toolbar and landing page.
 */
export const STANDARD_NDA_TEMPLATE_ID = "professional_mutual_nda_v1";

export const NEW_NDA_HREF = `/fillndahtml?templateId=${STANDARD_NDA_TEMPLATE_ID}&new=true`;

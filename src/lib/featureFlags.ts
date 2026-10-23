// Formi (AI assistant) is built and working but held back from launch —
// price, response quality, and legal review are all still open. Flip this
// back to true (and redeploy) to bring it back; nothing else needs to change.
export const FORMI_ENABLED = false;

// Free beta switch. Stripe isn't live yet, so unless NEXT_PUBLIC_PAID_PLANS_ENABLED is exactly
// "true" the product runs as a free beta: paid plans hidden/refused and FREE limits lifted
// (see effectivePlanLimits in src/billing/planLimits.ts). NEXT_PUBLIC_ so client UI can read it.
export const PAID_PLANS_ENABLED = process.env.NEXT_PUBLIC_PAID_PLANS_ENABLED === 'true';

// Shows the "Beta" pill next to the logo. Deliberately NOT tied to PAID_PLANS_ENABLED:
// remove by hand (set false) only after legal counsel has reviewed the legal pages.
export const BETA_LABEL = true;

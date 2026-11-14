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

// --- Private beta: sign-up gate -------------------------------------------
// Sign-up is closed when NEXT_PUBLIC_PRIVATE_BETA is 'on', or when it is unset
// in a production build. 'off' opens it. Local `next dev` is open unless
// explicitly 'on'. Existing accounts can always sign in.
export function isSignupOpen(value: string | undefined, nodeEnv: string | undefined): boolean {
  const v = value?.trim().toLowerCase();
  if (v === 'on') return false;
  if (v === 'off') return true;
  return nodeEnv !== 'production';
}

// NEXT_PUBLIC_* is inlined at build time, so this works in client components too.
export const SIGNUP_OPEN = isSignupOpen(process.env.NEXT_PUBLIC_PRIVATE_BETA, process.env.NODE_ENV);

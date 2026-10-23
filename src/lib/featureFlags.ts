// Formi (AI assistant) is built and working but held back from launch —
// price, response quality, and legal review are all still open. Flip this
// back to true (and redeploy) to bring it back; nothing else needs to change.
export const FORMI_ENABLED = false;

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

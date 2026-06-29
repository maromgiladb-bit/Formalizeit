# Two-Factor Authentication (2FA / MFA)

FormalizeIt uses **Clerk** (`@clerk/nextjs`) for authentication. Enabling 2FA is mostly a
**Clerk Dashboard configuration** — it cannot be turned on from application code. Once enabled
in the dashboard, the in-app **Settings → Sign-in & Security** page (which mounts Clerk's
`<UserProfile />`) automatically surfaces the controls for users to enroll.

## What's already wired in the app

- `<ClerkProvider>` wraps the app in `src/app/layout.tsx`.
- `clerkMiddleware` protects routes in `src/middleware.ts`.
- `src/app/settings/account-security/page.tsx` mounts Clerk's `<UserProfile />`. Its **Security**
  tab (password, two-factor authentication, active devices) appears automatically once MFA is
  enabled in the dashboard.
- Linked from **Settings → General** and the settings sidebar ("Sign-in & Security").
- Clerk's `<UserButton />` ("Manage account") in the toolbar also opens the same profile.

## Clerk Dashboard steps (required — do this once)

1. Sign in to the [Clerk Dashboard](https://dashboard.clerk.com) and select the FormalizeIt
   application (use the **Production** instance for live users; repeat for **Development** if you
   want it in dev too).
2. Go to **Configure → User & Authentication → Multi-factor** (in some dashboard versions:
   **User & Authentication → Multi-factor**).
3. Enable the factors you want:
   - **Authenticator application (TOTP)** — recommended primary factor (Google Authenticator,
     1Password, Authy, etc.).
   - **Backup codes** — strongly recommended so users can recover if they lose their authenticator.
   - **SMS code** — optional (SMS is less secure and may incur Clerk/telephony costs; TOTP +
     backup codes is the recommended baseline).
4. Save. No deploy or code change is needed — the Security tab in
   `/settings/account-security` will now show "Set up two-step verification" for every user.

## How a user enables 2FA (after the above)

1. Go to **Settings → Sign-in & Security** (`/settings/account-security`).
2. In the **Security** section, under **Two-step verification**, choose
   **Add two-step verification** → **Authenticator application**.
3. Scan the QR code with an authenticator app and enter the generated code to confirm.
4. Save the **backup codes** shown (if enabled) somewhere safe.

After enrollment, Clerk prompts for the second factor at every sign-in automatically.

## (Optional) Enforce MFA for all users

By default, 2FA is **opt-in** per user. To require it:

- **Recommended:** In the Clerk Dashboard, some plans expose an enforcement / "require MFA"
  setting under **Configure → User & Authentication → Multi-factor → Require multi-factor**
  (availability depends on your Clerk plan). Toggle it on so users without MFA are prompted to
  enroll before continuing.
- If your plan does not offer built-in enforcement, you can gate the app yourself: read
  `user.twoFactorEnabled` from Clerk (e.g. via `currentUser()` server-side or `useUser()` on the
  client) and redirect users who have not enrolled to `/settings/account-security`. Implement this
  only if enforcement is a hard requirement — it is not enabled today.

## Notes

- **Receivers / counterparties** sign NDAs via public, no-account links and are unaffected by MFA.
- Do not store TOTP secrets or backup codes in the app database — Clerk owns all factor storage.

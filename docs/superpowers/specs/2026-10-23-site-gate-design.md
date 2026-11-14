# Site gate (private beta switch) — plan for review

Status: **proposed, not built** (2026-10-23). Decision: Option B, a switch instead of opening the
site with one merge. Companion to the free-beta switch
([2026-10-23-free-beta-design.md](2026-10-23-free-beta-design.md)); the two are independent.

## Goal

Let the launch branch reach production **closed**, so the real production setup (live domain,
production database, real email, crons, Clerk production) can be tested end to end before the
public can sign up. Opening and closing again must each be an env var change plus a redeploy, with
no code change.

## How it behaves

One env var, `PRIVATE_BETA`, read by `src/middleware.ts`.

| `PRIVATE_BETA` | Who gets into the app |
|---|---|
| `on`, **or unset in a production build** | Only signed-in users whose email is on the invite list. Everyone else sees `/coming-soon`. |
| `off` | Everyone (today's launch-branch behavior). |

- **Unset means closed** in production builds, so forgetting the variable can never open the site
  by accident. Local `npm run dev` (`NODE_ENV=development`) ignores the gate.
- **Invite list:** `PRIVATE_BETA_EMAILS`, comma-separated, case-insensitive. An entry starting with
  `@` allows a whole domain (`@formalizeit.com`).
- **Visitors who aren't invited** see `/coming-soon` with two states: signed out ("private beta,
  sign in if you're invited") and signed in but not invited ("you're on the list, we'll email you
  when we open", plus sign out). Optional: a "request access" form reusing `/api/contact`.

## What stays open while the gate is closed, and why each matters

The gate is deny-by-default, so every path below has to be listed. Missing one breaks something
that works today; listing too much leaks the app.

| Path(s) | Why it must stay open | What breaks if it's missing |
|---|---|---|
| `/sign-nda-public/*`, `/fillndahtml-public/*`, `/api/ndas/{submit-input,sign-public,preview-html-public,activity-public}` | Receivers of your beta testers' NDAs are real outside people with no account. | Nobody can review or sign an NDA a beta tester sent. |
| `/api/ndas/viewpdf` | The signed-copy link in the completion email. | Receivers can't open their signed copy. |
| `/api/webhooks/clerk`, `/api/webhooks/stripe` | Server-to-server calls with no session. | Account deletions (and later billing events) are dropped. Clerk only retries for a limited time, so data drifts. |
| `/api/cron/*` (4 routes) | Vercel calls them on a schedule, with no session. | Reminders, link expiry, retention and deleted-user cleanup silently stop. Nothing errors visibly. |
| `/sign-in(.*)`, `/signup(.*)` | Invited users (and you) must be able to log in. | Nobody can log in, or redirect loops. |
| `/coming-soon` | The page the gate redirects to. | Infinite redirect loop. |
| `/terms`, `/privacy`, and the other legal pages | Linked from the signing page and the e-signature consent. Google sign-in verification also checks that the privacy policy and terms are public. | Signers can't read what they agree to; Google may flag the OAuth app. |
| `/robots.txt`, `/sitemap.xml` | Crawlers. While closed, robots should disallow the app. | Crawlers index the coming-soon page or error pages. |

**Deliberately closed:** the marketing pages (`/`, `/about`, `/faq`, pricing...) and the whole
app. See open question 1 for keeping marketing public instead.

**`/api/claim`:** it sends receivers to sign up. While closed, it should redirect to
`/coming-soon` with "your signed copy is in your email; you can create an account when we open"
instead of a sign-up page they can't use.

## Why the email check needs a Clerk setting (prerequisite)

Middleware runs on the edge and can't query the database, and by default the Clerk session token
contains the user id but not the email. Two options:

1. **Recommended:** add the email to the session token. Clerk dashboard → Sessions → Customize
   session token → `{"email": "{{user.primary_email_address}}"}`. This is free and needs no code
   beyond reading `sessionClaims.email`. It must be done on **both** Clerk instances (development
   for Preview/local, production for the live site).
2. Call Clerk's API from middleware on every request. This is slower and hits Clerk rate limits.

Clerk also has sign-up restrictions (allowlist or invite-only mode). They would stop uninvited
people from even creating an account, but they live in the dashboard, may depend on the Clerk plan,
and the in-app check is needed anyway. Treat them as optional.

## Implementation (about 2–3 hours)

1. `src/lib/siteGate.ts`: pure functions. `isGateClosed(env)`; `isInvited(email, list)`;
   `gateDecision({ path, signedIn, email, env })` returns `allow`, `coming-soon` or
   `coming-soon-not-invited`. API paths get JSON 404/403 instead of a redirect.
2. `src/middleware.ts`: one `isOpenWhileGated` matcher (the table above). The gate runs after the
   dev-only 404 block and before the existing default-protect logic, which stays unchanged.
3. `src/app/coming-soon/page.tsx`: the two states, a sign-in link and sign out. Bring the copy and
   colors in line with Calm Precision (the current page uses teal-50/amber-50 pills, which the
   design system bans).
4. `/api/claim`: the gated redirect described above.
5. `robots.txt`: disallow all while closed.
6. Tests (Vitest):
   - a table of paths × (signed out / invited / not invited) × (gate on / off / unset);
   - a **guard test** that lists every page and route under `src/app` and fails if one isn't
     classified as open-while-gated or gated, so a new public route can't be forgotten;
   - invite-list parsing: case, spaces, `@domain`.
7. Docs (the switch must be visible): CLAUDE.md (a short "Launch switches" section next to
   `FORMI_ENABLED`, covering `PRIVATE_BETA` and the paid-plans switch);
   `docs/launch/phase-0-external-setup.md` (env vars and the Clerk session-token step);
   `docs/launch/phase-4-launch.md` (4.6 "Open signups" becomes "set `PRIVATE_BETA=off`, redeploy",
   plus how to close again); `docs/launch/README.md`.

Formi doesn't need to know about the gate: only invited users can reach it.

## Before I start (your part)

1. Answer the open questions below.
2. Add the session-token email claim in the Clerk dashboard (both instances). It takes 2 minutes,
   and I can't do it.
3. Nothing else blocks the code. The Vercel env vars are set later, before the merge (see the
   merge plan in `docs/launch/README.md`).

## Open questions

1. **Marketing pages while closed:** keep `/`, `/about`, `/faq` and pricing public with a
   "private beta, request access" call to action, and gate only sign-up and the app? That is
   friendlier for Google sign-in verification and for people you tell about the product.
   Recommended. The alternative is everything behind `/coming-soon` (as `main` does today).
2. Who goes on the first invite list (your emails, testers)?
3. A "request access" form on `/coming-soon`, or just a contact email?
4. While closed, should an uninvited person who signs up be blocked only in the app (simple), or
   should Clerk's invite-only sign-up mode also be turned on (stricter, dashboard setting)?

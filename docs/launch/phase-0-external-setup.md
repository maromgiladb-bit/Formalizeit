# Phase 0 — External setup (your runbook)

**Owner: you.** Dashboard, DNS and CLI actions against live accounts. Claude cannot do them.
This file is written so you can start cold, without the conversation that produced it. Work
top-to-bottom within each section; the section order below is by **lead time**, longest first.

Reference: `docs/environments.md` (three-environment split), `.env.example` (every variable the
code reads).

## The shape of the work

Two Vercel environments matter:

- **Production** — `app.formalizeit.com`. Live keys only. Real users only.
- **Preview** (used as staging) — Vercel preview deployments of the branch. Test-mode keys,
  a **separate** Neon database branch. All manual testing (Phase 1 matrix, Phase 4) happens here.

Every variable below is set at **Vercel → Project → Settings → Environment Variables**, and each
one has an environment scope checkbox (Production / Preview / Development). The scope matters;
each step says which.

**Where the same env var needs different values per environment, add it twice** — once ticked
Production, once ticked Preview.

## Order of attack (by lead time)

| Day | Start | Why first |
|---|---|---|
| 1 | 0.3 Stripe activation | Identity/bank verification can take 1–5 business days |
| 1 | 0.4 Resend DNS | DNS propagation up to 48h; DMARC reputation builds over time |
| 1 | 0.2 Clerk production | Needs the domain's DNS too (CNAME records) |
| 1 | 0.1 Database migration | 15 minutes, but everything else is untestable until it's done |
| 2 | 0.5 – 0.8 | Each is 5–15 minutes of clicking |

---

## 0.1 ◑ Production database schema — HIGHEST RISK, DO FIRST

> **Checked 2026-09-24:** `npx prisma migrate status` against the `DATABASE_URL` currently in
> `.env` (Neon `ep-wild-sea-aglnn451`, eu-central-1) reports **all 25 migrations applied, schema up
> to date**. Remaining work: confirm this is the *same* connection string Vercel holds as
> `DATABASE_URL` in the **Production** scope — if it is, the migration half of 0.1 is done and only
> the `staging` branch (steps 5–7) is left.

As of July, the production `DATABASE_URL` was never confirmed migrated. There are **25
migrations** in `prisma/migrations/`. If the one dated `20260629000001` has not run, every query
touching `Membership.isSigner` or the `ADMINISTRATOR` role fails at runtime — that takes out
billing checkout and all member management.

### Steps

1. Neon console → your production project → **Connection details** → copy the pooled connection
   string. (Vercel → Settings → Environment Variables → `DATABASE_URL` Production shows the same
   value if you already set it.)
2. In a terminal at the repo root, **using a throwaway shell so the URL never lands in `.env`:**

   ```powershell
   $env:DATABASE_URL = "postgresql://<prod connection string>"
   npx prisma migrate status
   ```

3. Read the output.
   - **"Database schema is up to date!"** → done, skip to 0.1 acceptance.
   - **Lists pending migrations** → run `npx prisma migrate deploy`. It applies only what is
     missing, in order, and never drops data. Re-run `migrate status` to confirm.
   - **"The migration … was modified after it was applied"** or drift errors → **stop and ask
     Claude**; do not run `migrate reset` (it drops the database).
4. Close the terminal so the env var is gone.

### Also: create the staging database

5. Neon console → production project → **Branches** → **Create branch** from `main`, name it
   `staging`. This is a zero-copy branch with the prod schema.
6. Copy its connection string → Vercel env var `DATABASE_URL`, scope **Preview only**.
7. Repeat steps 2–3 against the staging URL so it is migrated too.

**Acceptance:** `migrate status` says up to date on both URLs and lists 25 applied migrations.

---

## 0.2 ☑ Clerk production instance

> **Done 2026-09-25.** Verified live: `app.formalizeit.com/sign-in` serves `pk_live_` via
> `clerk.formalizeit.com` (valid SSL); a dashboard-created user signed in on production; Clerk
> webhook test `user.deleted` → Succeeded.
> - Production instance on `formalizeit.com` (cloned from dev). DNS host is **GoDaddy**
>   (nameservers `domaincontrol.com`); all 5 CNAMEs verified.
> - Vercel: live `pk_live_`/`sk_live_` + `CLERK_WEBHOOK_SECRET` scoped **Production** (secrets
>   stored as Secret type); test pair scoped **All Pre-Production**; the 4
>   `NEXT_PUBLIC_CLERK_*_URL` vars on All Environments.
> - Google sign-in: own OAuth client in Google Cloud project `formalizeit`, branding filled, app
>   published; client secret rotated 2026-09-25. Credentials in Bitwarden.
> - Paths set as full URLs on `app.formalizeit.com` (sign-in, `/signup`, sign-out → home).
> - ⊘ **2FA deferred:** MFA (TOTP + backup codes) needs the paid Clerk **Pro** plan; account is on
>   Hobby. Turn on after upgrading — no code change needed.
>
> **Still to test after the launch branch is merged** (live `main` is the private-beta build: it
> blocks `/signup` and sends logged-out visitors to `/coming-soon`): public sign-up with email and
> with Google, end to end; the `/coming-soon` "Sign in" modal button was unresponsive on the old
> build (direct `/sign-in` works) — confirm it is fixed or unreachable.
>
> **Also found:** Vercel Production builds from `main`; all launch work is on
> `feat/todolistimpl-2` and is **not live yet**. Merge to `main` after Phase 0 + Preview testing.

Today only a test instance exists (`pk_test_` / `sk_test_`). Production needs its own instance
with live keys, on the real domain.

### Steps

1. Clerk dashboard → top-left instance switcher → **Create production instance** (or "Clone from
   development"). Choose the domain `formalizeit.com`.
2. Clerk shows **DNS records** to add (CNAMEs for `clerk.`, `accounts.`, `clkmail.`, and two
   `clk._domainkey` / `clk2._domainkey` for email). Add them at your DNS provider. Wait for Clerk
   to show all green (can take an hour).
3. **API keys** page → copy `pk_live_…` and `sk_live_…` → Vercel:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` = `pk_live_…`, scope **Production**
   - `CLERK_SECRET_KEY` = `sk_live_…`, scope **Production**
   - Leave the existing `pk_test_`/`sk_test_` pair scoped to **Preview + Development**.
4. **Paths** page → set Sign-in URL `/sign-in`, Sign-up URL `/signup`, after sign-in `/dashboard`,
   after sign-up `/dashboard`. (These mirror the `NEXT_PUBLIC_CLERK_*_URL` vars, which should be
   set for all scopes with those same values.)
5. **Domains / allowed origins** → confirm `https://app.formalizeit.com` is listed.
6. **Multi-factor** page → enable **Authenticator application (TOTP)** and **Backup codes**.
   Leave it optional (users opt in). This is the entire 2FA work item — the app already renders
   Clerk's Security tab at `/settings/account-security`, and the 2FA option appears there once
   this is on. Detailed steps in `docs/2fa-setup.md`.
7. **Webhooks** → **Add endpoint** → URL `https://app.formalizeit.com/api/webhooks/clerk`, subscribe
   to the single event **`user.deleted`**. Copy the **Signing secret** (`whsec_…`) →
   Vercel `CLERK_WEBHOOK_SECRET`, scope **Production**.
   - Repeat for Preview if you want deletion to work on staging (endpoint = your staging URL).

**Acceptance:** on the production domain, sign up with a fresh email, enable 2FA under Settings →
Account security, sign out, sign in again through the TOTP challenge.

---

## 0.3 ☐ Stripe live mode

### Steps

1. Stripe dashboard → **Activate your account** (business details, bank account, identity). Do
   this on day one; approval can take days. Everything below can be done in parallel while it is
   pending — the toggle at the top of the dashboard switches between **Test mode** and **Live**.
2. Switch to **Live mode**. **Product catalog** → **Add product**:

   | Product name | Price | Billing | Copy price ID into Vercel var (Production scope) |
   |---|---|---|---|
   | FormalizeIt Pro | **$9.00** USD | Recurring, monthly | `STRIPE_PRO_MONTHLY_PRICE_ID` |
   | FormalizeIt Pro | **$91.80** USD | Recurring, yearly | `STRIPE_PRO_ANNUAL_PRICE_ID` |
   | FormalizeIt Team | **$50.00** USD | Recurring, monthly | `STRIPE_TEAM_MONTHLY_PRICE_ID` |
   | FormalizeIt Team | **$510.00** USD | Recurring, yearly | `STRIPE_TEAM_ANNUAL_PRICE_ID` |

   Annual = 15% off ($7.65/mo and $42.50/mo billed yearly). Create **two products** with two
   prices each. Price IDs start `price_…`.
3. **Developers → API keys** (live) → copy → Vercel, scope **Production**:
   - `STRIPE_SECRET_KEY` = `sk_live_…`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = `pk_live_…`
4. **Developers → Webhooks → Add endpoint**:
   - URL: `https://app.formalizeit.com/api/webhooks/stripe`
   - Events, exactly these four: `checkout.session.completed`, `customer.subscription.updated`,
     `customer.subscription.deleted`, `invoice.payment_failed`
   - After creating, **Reveal signing secret** → Vercel `STRIPE_WEBHOOK_SECRET`, scope
     **Production**.
5. **Settings → Billing → Customer portal** → enable, allow customers to cancel and update payment
   method. The app's "Manage billing" button opens this.
   - **Also required:** turn on **"Customers can switch plans"** (subscription update) and add
     **both products with all four prices** to it. The in-app Pro→Team upgrade and Team→Pro
     downgrade (`/api/billing/upgrade-session`, `/api/billing/downgrade`) open a portal
     `subscription_update_confirm` flow, which Stripe rejects unless plan switching is enabled
     and the target price is listed.
   - When creating the webhook (step 4), pick **Snapshot** payloads (not "thin" events) and, if
     asked for an API version, `2026-04-22.dahlia` — the version pinned in `src/lib/stripe.ts`.
6. Keep the existing **test-mode** keys, test price IDs and a test-mode webhook (pointed at your
   staging URL) scoped to **Preview + Development** so staging checkouts never charge anyone.

**Watch out:** if any price-ID var is missing or mistyped, the webhook now **refuses** to
provision (it used to silently give PRO). You will see it in Sentry and in Stripe's webhook log
as a 500 — that is the intended failure mode, fix the env var and click "Resend" in Stripe.

**Acceptance (Phase 4 will repeat this):** with Stripe in live mode use a real card on each of
the four prices, confirm the organization's plan updates in the dashboard, then cancel via the
portal and refund yourself in Stripe.

---

## 0.4 ◑ Resend sending domain

> **Status checked 2026-09-25 (DNS queried directly at GoDaddy) — started, NOT finished.** The
> sending domain is the subdomain **`mail.formalizeit.com`**.
> - ☑ DKIM TXT `resend._domainkey.mail` present.
> - ☐ **SPF missing:** the **MX** and **TXT** records at `send.mail` (i.e. `send.mail.formalizeit.com`)
>   do not exist. Copy both from Resend → Domains → `mail.formalizeit.com` and add them at GoDaddy
>   (Name field: `send.mail`). Then click Verify in Resend.
> - ☑ DMARC at root `_dmarc` exists (`p=quarantine`, reports to your Gmail) — stricter than the
>   `p=none` suggested below; fine once SPF+DKIM pass, but that is why SPF must be done first.
> - ☐ Step 4–5 below (Vercel vars) not confirmed. **`MAIL_FROM` must use the subdomain**, e.g.
>   `FormalizeIt <noreply@mail.formalizeit.com>`. If `MAIL_FROM` is unset, `src/lib/email.ts` falls
>   back to `noreply@formalizeit.app` (a different domain) and every email is rejected.
> - Acceptance (updated): the first NDA invite is **links-only** (the sender shares it), so test
>   with an email the platform does send — a round notification, a reminder, or the signed copy —
>   and the contact form (needs `CONTACT_INBOX`).

Email is the product's delivery mechanism — every NDA link, reminder and signed PDF goes out
through Resend. Unverified domains land in spam or are refused.

### Steps

1. Resend dashboard → **Domains** → **Add domain** → `formalizeit.com` (or a subdomain like
   `mail.formalizeit.com` if you want to isolate reputation; either is fine).
2. Resend shows DNS records: a **DKIM** TXT/CNAME set and an **SPF** TXT (`v=spf1 include:…`).
   Add them at your DNS provider. Click **Verify**. Propagation: minutes to 48h.
3. Add a **DMARC** TXT record at `_dmarc.formalizeit.com`:
   `v=DMARC1; p=none; rua=mailto:<your inbox>` — `p=none` reports only, safe to start with.
4. **API keys** → create one named `production`, permission "Sending access" → Vercel
   `RESEND_API_KEY`, scope **Production**. (Keep a separate key for Preview.)
5. Vercel, scope **Production**:
   - `MAIL_FROM` = `FormalizeIt <noreply@formalizeit.com>` (must be on the verified domain)
   - `CONTACT_INBOX` = the real address where contact-form submissions should arrive. **Required** —
     the personal-Gmail fallback was removed; without this the contact form returns 503.
6. In Resend → **Settings → Webhooks** nothing is needed; the app does not consume Resend events.

**Acceptance:** from production, send an NDA to an external Gmail/Outlook address. It arrives in
the inbox (not spam), the "from" shows your domain, and the link opens on `app.formalizeit.com`.

---

## 0.5 ☐ Gemini and S3

### Gemini (Formi AI assistant)

1. Google AI Studio → **Get API key** → create in a project that has **billing enabled** (the free
   tier rate-limits under any real load and Formi will start failing).
2. Vercel `GEMINI_API_KEY`, scope **Production**. A free-tier key is fine for Preview.

### S3 (signed PDFs)

1. AWS console → S3 → **Create bucket**: name e.g. `formalizeit-prod`, region `us-east-1` (or your
   choice — must match `S3_REGION`), **Block all public access ON**, versioning optional,
   default encryption SSE-S3.
2. IAM → **Users → Create user** `formalizeit-app-prod`, no console access. Attach an **inline
   policy** limited to this bucket:

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [{
       "Effect": "Allow",
       "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
       "Resource": "arn:aws:s3:::formalizeit-prod/*"
     }]
   }
   ```

3. **Security credentials → Create access key** (use case: application running outside AWS).
4. Vercel, scope **Production**: `S3_BUCKET_NAME`, `S3_REGION`, `S3_ACCESS_KEY_ID`,
   `S3_SECRET_ACCESS_KEY`.
5. Make a second bucket + user for Preview (`formalizeit-staging`) so test PDFs never mix with
   real ones.

---

## 0.6 ☐ Cron secret

Four daily crons run from `vercel.json` (user cleanup 03:00, retention 04:00, reminders 05:00,
link expiry 06:00 UTC). Vercel calls them with `Authorization: Bearer <CRON_SECRET>`. **All four
now refuse to run without it.**

1. Generate a value: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
2. Vercel `CRON_SECRET`, scope **Production** (and a different value for Preview).
3. Vercel picks it up automatically for its cron invocations — nothing else to configure.

**Acceptance (Phase 4):** `curl -H "Authorization: Bearer <secret>" https://app.formalizeit.com/api/cron/nda-reminders`
returns 200 JSON; the same call with no header returns 401.

---

## 0.7 ☐ Base URLs

Set as **Production scope only**, all three to the same value:

- `APP_URL` = `https://app.formalizeit.com`
- `NEXT_PUBLIC_APP_URL` = `https://app.formalizeit.com`
- `NEXT_PUBLIC_BASE_URL` = `https://app.formalizeit.com`

**Do not set them for Preview.** The code falls back to Vercel's per-deployment `VERCEL_URL`,
which is always the correct staging origin. Setting them on Preview would make every staging email
link point at production.

**Planned domain move:** the site runs on `app.formalizeit.com` for now; the main address will
later be `formalizeit.com` (no `app.`). When that happens, update: these three base-URL vars, the
Clerk webhook URL (0.2 step 7), the Clerk **Paths** page (Home URL, SignIn, SignUp, Signing Out
— all currently full `app.formalizeit.com/...` URLs), the Stripe webhook URL (0.3 step 4), and the
Google OAuth Branding page links (home / privacy / terms). Clerk's domain and Google's authorized domain are
already the root `formalizeit.com` and need no change.

Also confirm in Vercel → **Settings → Domains** that `app.formalizeit.com` is attached to the
project and shows a valid certificate.

**Known issue to re-test:** in July, test emails once rendered a literal `${VERCEL_URL}` in links.
The string does not exist in the repo or in any Vercel variable, so it was almost certainly a
stale pre-fix email. Re-test with a brand-new send and reopen only if it recurs.

---

## 0.8 ☐ Error monitoring and analytics

### Sentry

1. sentry.io → **Create project** → platform **Next.js**, name `formalizeit`.
2. Copy the **DSN** (`https://…@….ingest.sentry.io/…`) → Vercel `NEXT_PUBLIC_SENTRY_DSN`, scope
   **Production + Preview**. Until this is set, Sentry is a silent no-op — nothing breaks, but
   nothing is reported either.
3. Optional but recommended, for readable stack traces: **Settings → Auth Tokens → Create** with
   scope `project:releases` (and `org:read`). Vercel, scope **Production only**:
   `SENTRY_AUTH_TOKEN`, `SENTRY_ORG` (your org slug), `SENTRY_PROJECT` = `formalizeit`.
4. Sentry → **Alerts** → create one rule: "new issue → email me". Default is fine.

### Vercel Analytics

1. Vercel → Project → **Analytics** tab → **Enable**. The `<Analytics />` component is already in
   the root layout; page views appear within minutes of the next deploy.

---

## Final checklist — Vercel Production env vars

Tick when the value is set and scoped to **Production**. Preview should have its own test-mode
value for every row marked ★.

| Var | ★ | Set |
|---|---|---|
| `DATABASE_URL` | ★ | ☐ |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | ★ | ☐ |
| `CLERK_SECRET_KEY` | ★ | ☐ |
| `CLERK_WEBHOOK_SECRET` | ★ | ☐ |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` … `AFTER_SIGN_UP_URL` (4) | all scopes, same values | ☐ |
| `RESEND_API_KEY` | ★ | ☐ |
| `MAIL_FROM` | ★ | ☐ |
| `CONTACT_INBOX` | | ☐ |
| `STRIPE_SECRET_KEY` | ★ | ☐ |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ★ | ☐ |
| `STRIPE_WEBHOOK_SECRET` | ★ | ☐ |
| `STRIPE_PRO_MONTHLY_PRICE_ID` | ★ | ☐ |
| `STRIPE_PRO_ANNUAL_PRICE_ID` | ★ | ☐ |
| `STRIPE_TEAM_MONTHLY_PRICE_ID` | ★ | ☐ |
| `STRIPE_TEAM_ANNUAL_PRICE_ID` | ★ | ☐ |
| `GEMINI_API_KEY` | ★ | ☐ |
| `S3_BUCKET_NAME` / `S3_REGION` / `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` | ★ | ☐ |
| `CRON_SECRET` | ★ | ☐ |
| `APP_URL` / `NEXT_PUBLIC_APP_URL` / `NEXT_PUBLIC_BASE_URL` | **Production only** | ☐ |
| `NEXT_PUBLIC_SENTRY_DSN` | Prod + Preview | ☐ |
| `SENTRY_ORG` / `SENTRY_PROJECT` / `SENTRY_AUTH_TOKEN` | Production only | ☐ |

After the last one: Vercel → **Deployments → Redeploy** the latest production deployment (env
changes do not apply to a running deployment).

## When you're done

Tell Claude "Phase 0 is done" and paste anything that failed or looked wrong. Next up is the
Phase 1 manual verification matrix on the staging URL, then Phase 4.

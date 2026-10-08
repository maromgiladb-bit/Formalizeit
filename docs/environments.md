# Environments (dev / staging / production)

Part of the MVP launch plan (see `.claude/plans` launch-readiness plan, Workstream 4). Goal:
**the production database only ever holds real users.** All hands-on testing happens in a
dedicated staging environment with its own database and test-mode third-party keys.

## The three environments

| | **Development (local)** | **Staging** | **Production** |
|---|---|---|---|
| Runs on | your machine (`npm run dev`) | Vercel Preview/Staging project | Vercel Production |
| Domain | `localhost:3000` | `staging.formalizeit.com` (or a Vercel preview URL) | `app.formalizeit.com` |
| Database | local / a personal Neon branch | **separate Neon DB or branch** (never prod) | production Neon DB |
| Clerk | test instance (`pk_test_`/`sk_test_`) | test instance | **production instance (live keys) + 2FA** |
| Stripe | test keys + test price IDs | test keys + test price IDs | **live keys + live price IDs + live webhook** |
| Resend | test domain / sandbox | test or verified domain | **verified sending domain (SPF/DKIM/DMARC)** |
| Gemini | free key ok | free key ok | **billed key** |
| S3 | dev bucket | dev/staging bucket | **production bucket (least-privilege IAM)** |
| `CRON_SECRET` | any value | staging value | production value |
| `NODE_ENV` | `development` | `production` (Vercel build) | `production` |

> Note: staging builds run with `NODE_ENV=production`, so the dev-only routes gated in
> `src/middleware.ts` (`/api/debug*`, `/devtemplates`, `/fillndahtml-public/dev`, …) are **404 on
> staging too** — matching production. Test those flows locally (`npm run dev`).

## Rules

1. **Never point staging at the production database.** Separate `DATABASE_URL` per environment
   (Neon "branch" is the easy way — a zero-copy branch of prod schema with its own data).
2. **Live third-party keys live only in Vercel Production env vars.** Staging uses test-mode keys
   so a test checkout / test email never touches real billing or real inboxes.
3. **Do your testing on staging**, not production. Production should accumulate only real usage.
4. Keep this table in sync when a new secret is added (also add it to `.env.example`).

## Env-var ownership quick reference

Required in **every** environment: `DATABASE_URL`, Clerk keys + `CLERK_WEBHOOK_SECRET`,
`RESEND_API_KEY` / `MAIL_FROM`, Stripe keys + 4 price IDs + `STRIPE_WEBHOOK_SECRET`,
`GEMINI_API_KEY`, `S3_*` (4), `CRON_SECRET`, `APP_URL` / `NEXT_PUBLIC_APP_URL` /
`NEXT_PUBLIC_BASE_URL`, `CONTACT_INBOX`. Full list + descriptions in `.env.example`.

## Production data hygiene (one-time, before launch)

Use `scripts/cleanup-test-data.mjs` to purge test organizations from a database. It is **dry-run
by default** and only deletes organizations you name explicitly. See the script header for usage.
Because the schema cascades from `Organization`, deleting an org removes its members, drafts,
sign requests, audit events, and `NdaPdf` rows — but **not the S3 objects**, which the script
deletes separately from `NdaPdf.s3Key`.

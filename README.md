# Jallal Group — corporate website

Production-oriented corporate site for Jallal Group (Holdings & Ventures): group
overview, portfolio companies, digital venture studio, partnership inquiry flow
and a secured admin dashboard.

Built with **Next.js 16 (App Router, TypeScript)**, **Tailwind CSS v4**,
**Appwrite Cloud (TablesDB)** for storage and auth, and deployable to
**Cloudflare Workers** through OpenNext.

## Pages

| Route              | Purpose                                                                 |
| ------------------ | ----------------------------------------------------------------------- |
| `/`                | Hero, group vision, partnerships preview, ventures teaser                |
| `/about`           | Story, vision/mission, operating principles, milestones                  |
| `/our-companies`   | Portfolio grid (Jallal Tech, Elevate 360, JIT, Jallal Properties)        |
| `/our-companies/[slug]` | Detailed company pages (statically generated)                      |
| `/digital-ventures` | Venture studio: Jallal Pay, Waka Salone, First Home, research pipeline  |
| `/partnerships`    | Partnership frameworks, pillars and the public inquiry form              |
| `/privacy-policy`, `/terms-of-use` | Legal pages                                              |
| `/admin`           | Secured dashboard: inquiry stats, list, detail, status workflow          |
| `/admin/login`     | Session sign-in against Appwrite Auth                                    |
| `/sitemap.xml`, `/robots.txt` | SEO surfaces                                                |

Navigation, copy and legal names live in `src/content/site.ts`; company and
venture records live in `src/content/companies.ts` and `src/content/ventures.ts`.

## Getting started

```bash
npm install
cp .env.example .env.local      # fill in the Appwrite values
npm run dev                     # http://localhost:3000
```

The site runs without Appwrite: content renders from `src/content` and the
public inquiry form returns a transparent `503` with fallback guidance rather
than pretending a submission was stored. Admin features require a configured
backend.

### 1. Create an Appwrite project

1. <https://cloud.appwrite.io> → create a project.
2. Copy the **Project ID** and **Endpoint** from Settings → Overview.
3. Settings → **API keys** → create a key with scopes:
   `documents.read`, `documents.write`, `tables.read`, `tables.write`,
   `databases.read`, `users.read`, `users.write`.
4. Settings → **Auth** → enable the **Email/Password** provider.

### 2. Provision the database, tables and admin user

```bash
npm run setup:appwrite
# or directly, with an explicit admin account:
node scripts/appwrite-setup.mjs --seed --admin-email you@jallalgroup.com --admin-password 'a-strong-password'
```

The script is idempotent. It creates:

- database `jallal_group` (id configurable via `NEXT_PUBLIC_APPWRITE_DATABASE_ID`)
- tables `inquiries`, `companies`, `ventures` — **table permissions are empty**,
  so anonymous clients cannot read or write anything; all access goes through
  the server API key
- companies/ventures rows seeded from `src/content` (skipped if rows exist)
- an admin account carrying the `admin` label

Paste the printed IDs into `.env.local`, then restart the dev server.

### 3. Sign in

`/admin/login` with the account from step 2. A user is authorised when their
account has the `admin` **label** or their email is listed in `ADMIN_EMAILS`.

Sessions are Appwrite email/password sessions stored in an httpOnly cookie
(`jg_admin_session`, 12h, SameSite=Lax, Secure in production). Authorisation is
verified server-side on every request (`src/lib/auth.ts`); the proxy in
`src/proxy.ts` is only a first-line gate.

## Scripts

| Command                  | What it does                                              |
| ------------------------ | -------------------------------------------------------- |
| `npm run dev`            | Dev server                                                 |
| `npm run build`          | Production build (Node)                                    |
| `npm run start`          | Serve the production build                                 |
| `npm run lint`           | ESLint                                                     |
| `npm run typecheck`      | `tsc --noEmit`                                             |
| `npm run setup:appwrite` | Provision Appwrite and seed content                        |
| `npm run preview`        | OpenNext build + Wrangler local preview (Cloudflare)       |
| `npm run deploy`         | OpenNext build + Wrangler deploy (Cloudflare)              |

## Content and data layer

- `src/content/*.ts` — source of truth for structured copy (companies,
  ventures, partnership types, navigation).
- `src/lib/content.ts` — reads those records from Appwrite when the content
  store is configured, otherwise serves the static records. The source
  (`appwrite | static | fallback`) is surfaced in the admin dashboard.
- `src/lib/inquiries.ts` — server-only inquiry CRUD used by the public form
  and the admin dashboard.

To edit content without a code release: delete the seeded rows in Appwrite and
re-run the script with `--seed`, or edit the rows' `payload` JSON directly.

## Public inquiry form

`POST /api/inquiries` with:

- Zod validation (`src/lib/validation.ts`)
- honeypot field (`website`) — silently accepted, never stored
- per-IP rate limiting (6 submissions / 10 minutes, hashed IP only)
- 10-minute duplicate suppression on email + partnership type
- `503 not_configured` when Appwrite env vars are missing (no fake success)

## Environment variables

See `.env.example`. Server-only: `APPWRITE_API_KEY`, `ADMIN_EMAILS`,
`FORM_RATE_LIMIT_SECRET`. Public: the `NEXT_PUBLIC_APPWRITE_*` values and
`NEXT_PUBLIC_SITE_URL`.

## Deploying to Cloudflare Workers

```bash
npm run preview     # local: builds with OpenNext, serves via wrangler dev
npm run deploy      # builds and deploys with Wrangler
```

Configuration lives in `open-next.config.ts` and `wrangler.jsonc`
(`nodejs_compat` flag, static assets bound to `ASSETS`). Set production secrets:

```bash
npx wrangler secret put APPWRITE_API_KEY
npx wrangler secret put ADMIN_EMAILS
npx wrangler secret put NEXT_PUBLIC_APPWRITE_ENDPOINT
npx wrangler secret put NEXT_PUBLIC_APPWRITE_PROJECT_ID
npx wrangler secret put NEXT_PUBLIC_APPWRITE_DATABASE_ID
npx wrangler secret put NEXT_PUBLIC_APPWRITE_INQUIRIES_COLLECTION_ID
npx wrangler secret put NEXT_PUBLIC_APPWRITE_COMPANIES_COLLECTION_ID
npx wrangler secret put NEXT_PUBLIC_APPWRITE_VENTURES_COLLECTION_ID
npx wrangler secret put NEXT_PUBLIC_SITE_URL
```

Any Node-compatible host also works with `npm run build && npm run start`.

## Notes on honesty of content

Venture statuses (`Research`, `Architecture`, `Prototyping`, `In development`)
describe technical readiness only. Nothing is presented as a launched service,
and no metric, milestone or partnership is invented: prototype figures are
labelled as targets or estimates.

## Structure

```
src/
  app/                 routes, metadata, API handlers
  components/          ui/, layout/, home/, forms/, companies/, ventures/, admin/
  content/             structured content (source of truth)
  lib/                 appwrite, auth, inquiries, content, validation, env, types
  proxy.ts             edge gate for /admin and /api/admin
scripts/
  appwrite-setup.mjs   database + tables + seed + admin provisioning
```

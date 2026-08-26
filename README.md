# EMGTechnology

Headless e-commerce platform built with [Vendure](https://www.vendure.io/) (backend) and [Next.js](https://nextjs.org/) (storefront).

## Architecture

```
Customer / Admin
       │
       ├── Next.js Storefront (:3002) ──GraphQL shop-api──► Vendure Server (:3001)
       └── Vendure Dashboard (:5173) ──GraphQL admin-api──► Vendure Server (:3001)
                                                                    │
                                                          PostgreSQL (:5432)
                                                          Vendure Worker (background jobs)
```

| Service | Purpose | URL (local) |
|---------|---------|-------------|
| **Vendure Server** | Products, orders, customers, cart, payments API | http://localhost:3001 |
| **Vendure Worker** | Search index, emails, scheduled jobs | (no public port) |
| **Vendure Dashboard** | Admin UI for managing the store | http://localhost:5173/dashboard |
| **Next.js Storefront** | Customer-facing shop | http://localhost:3002 |
| **PostgreSQL** | All business data | localhost:5432 |

The storefront does **not** store products locally. It reads everything from the Vendure Shop API.

## Tech stack

### Backend (`apps/server`)

| Layer | Technology |
|-------|------------|
| Language | TypeScript |
| Framework | Vendure 3.7 (NestJS) |
| API | GraphQL (Shop API + Admin API) |
| Database | PostgreSQL (TypeORM) |
| Admin UI | Vendure Dashboard (React + Vite) |
| Email | `@vendure/email-plugin` |
| Assets | `@vendure/asset-server-plugin` |

### Storefront (`apps/storefront`)

| Layer | Technology |
|-------|------------|
| Language | TypeScript |
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS 4, shadcn/ui |
| i18n | next-intl (`/en`, `/de`) |
| API client | gql.tada + GraphQL → Vendure Shop API |
| Forms | react-hook-form + Zod |

### Monorepo

npm workspaces — install once at the project root:

```bash
npm install
```

## Project structure

```
EMGTechnology/
├── apps/
│   ├── server/
│   │   ├── src/
│   │   │   ├── vendure-config.ts   # Backend config (DB, plugins, ports)
│   │   │   ├── index.ts            # API server entry
│   │   │   ├── index-worker.ts     # Worker entry
│   │   │   ├── seed.ts             # Seed test users
│   │   │   └── plugins/            # Custom Vendure plugins go here
│   │   ├── static/                 # Email templates, uploaded assets
│   │   ├── scripts/setup-postgres.mjs
│   │   └── .env                    # Secrets (copy from .env.example)
│   └── storefront/
│       ├── src/
│       │   ├── app/[locale]/       # Pages (home, search, product, cart…)
│       │   ├── components/         # UI components
│       │   └── lib/vendure/        # GraphQL queries, mutations, API client
│       └── .env.local              # Copy from .env.example
└── package.json
```

## Prerequisites

- **Node.js** 20+
- **PostgreSQL** 16+ (local install or Docker)
- **npm** 9+

## First-time setup

### 1. Install dependencies

```bash
cd EMGTechnology
npm install
```

### 2. Configure environment

```bash
cp apps/server/.env.example apps/server/.env
cp apps/storefront/.env.example apps/storefront/.env.local
```

Edit `apps/server/.env` if your PostgreSQL settings differ.

### 3. Create database and seed users

```bash
npm run db:setup
npm run db:seed
```

### 4. Build storefront (first time only)

```bash
cd apps/storefront
npm run build
```

## Running locally

Use **separate terminals**. Do not run everything in one command — it overloads the machine.

### Terminal 1 — API server (required)

```bash
cd apps/server
npm run dev:server
```

Wait for: `Vendure server now running on port 3001`

### Terminal 2 — Storefront (recommended: production mode)

Lighter on CPU/RAM than dev mode. Best for browsing products:

```bash
cd apps/storefront
npm run serve:only
```

Open: http://localhost:3002/en/search

First time (includes build):

```bash
cd apps/storefront
npm run serve
```

### Terminal 3 — Admin dashboard (optional)

Only start when you need to manage products/orders:

```bash
npm run dev:dashboard
```

Open: http://localhost:5173/dashboard

### Dev mode (only when editing storefront code)

```bash
cd apps/storefront
npm run dev
```

Dev mode recompiles pages on every visit and uses significantly more memory.

## URLs and credentials

| URL | Purpose |
|-----|---------|
| http://localhost:3002 | Storefront |
| http://localhost:3002/en/search | All products |
| http://localhost:5173/dashboard | Admin dashboard |
| http://localhost:3001/shop-api | Shop GraphQL API |
| http://localhost:3001/admin-api | Admin GraphQL API |

| Role | Username / Email | Password |
|------|------------------|----------|
| Admin | `superadmin` | `superadmin` |
| Customer | `customer@example.com` | `customer` |

Change these before any production deployment.

## PostgreSQL / pgAdmin

| Setting | Value |
|---------|-------|
| Host | `localhost` |
| Port | `5432` |
| Database | `emgtechnology` |
| Username | `emg_admin` |
| Password | `emg_dev_password` |

## Development guide

### Where to make changes

| Task | Location |
|------|----------|
| New backend feature | `apps/server/src/plugins/` (use `npx vendure add`) |
| Backend config | `apps/server/src/vendure-config.ts` |
| Shop pages / UI | `apps/storefront/src/app/[locale]/` |
| GraphQL queries | `apps/storefront/src/lib/vendure/` |
| Product data | Vendure dashboard (not hardcoded in storefront) |

### Backend rules

- Implement custom logic as Vendure **plugins**
- Use **migrations** for schema changes in production (`npx vendure migrate`)
- Never commit `.env` files or secrets
- Never use `DB_SYNCHRONIZE=true` in production
- Run `npm run build -w server` after backend changes

### Storefront rules

- Pages live under `src/app/[locale]/`
- All product data comes from `VENDURE_SHOP_API_URL`
- Run `npm run build` in `apps/storefront` before deploying

## Production build

```bash
npm run build
```

Start production processes:

```bash
# Terminal 1 — API + worker
npm run start:server -w server
npm run start:worker -w server

# Terminal 2 — Storefront
npm run start -w storefront
```

## Hosting

Run these as separate services in production:

| Service | How to host |
|---------|-------------|
| PostgreSQL | Managed DB (RDS, Supabase, Neon, DigitalOcean) |
| Vendure Server | Node / Docker / PM2 — e.g. `api.yourdomain.com` |
| Vendure Worker | Separate Node process (required for search + emails) |
| Storefront | Vercel, Netlify, or `next start` |
| Dashboard | Built into server via `DashboardPlugin` |
| Assets | CDN or S3 — set `assetUrlPrefix` in `vendure-config.ts` |

Example production URLs:

```
https://shop.yourdomain.com           → Next.js storefront
https://api.yourdomain.com/shop-api   → Vendure Shop API
https://admin.yourdomain.com/dashboard → Admin UI
```

Production env (storefront):

```env
VENDURE_SHOP_API_URL=https://api.yourdomain.com/shop-api
NEXT_PUBLIC_SITE_URL=https://shop.yourdomain.com
```

Production checklist:

- Strong `COOKIE_SECRET` and new superadmin password
- Real SMTP for emails (disable `devMode` on EmailPlugin)
- Real payment handler (replace `dummyPaymentHandler`)
- `DB_SYNCHRONIZE=false`, use migrations only
- Set `assetUrlPrefix` to your CDN/domain

## Troubleshooting

**Storefront hangs or Mac overheats on first page load**

- Use `npm run serve:only` instead of `npm run dev`
- Stop the dashboard when not needed
- Close pgAdmin and extra browser tabs
- Only open http://localhost:3002/en/search first; wait for compile to finish

**Products not showing**

- Ensure the API server is running on port 3001
- Check `VENDURE_SHOP_API_URL` in `apps/storefront/.env.local`

**Port already in use**

```bash
lsof -nP -iTCP:3001 -sTCP:LISTEN
lsof -nP -iTCP:3002 -sTCP:LISTEN
lsof -nP -iTCP:5173 -sTCP:LISTEN
```

Press `Ctrl+C` in the terminal using that port.

## Learn more

- [Vendure Documentation](https://docs.vendure.io)
- [Next.js Documentation](https://nextjs.org/docs)
- [Vendure Discord Community](https://vendure.io/community)

# EMGTechnology Project Instructions

This project was generated with `@vendure/create`.

## Workspace Layout

- Vendure backend: `apps/server`
- Next.js storefront: `apps/storefront`
- Backend custom code belongs in `apps/server/src/plugins`
- Backend runtime configuration is in `apps/server/src/vendure-config.ts`
- Backend static assets and email templates live in `apps/server/static`

## Running Locally

Use separate terminals. See root `README.md` for full instructions.

```bash
# Terminal 1 — API server
cd apps/server && npm run dev:server

# Terminal 2 — storefront (production mode, lighter)
cd apps/storefront && npm run serve:only

# Terminal 3 — admin dashboard (optional)
npm run dev:dashboard
```

Do not use `npm run dev` from the project root.

## Vendure Development

- Prefer implementing custom functionality as a Vendure plugin.
- Use `npx vendure add` to scaffold plugins, entities, services, API extensions, and job queues.
- Read environment variables in `vendure-config.ts` and pass values into plugins through `Plugin.init()` options.
- Create job queues in `onModuleInit()` or `onApplicationBootstrap()`, then reuse the queue when adding jobs.
- Pass `RequestContext` to Vendure services and `TransactionalConnection` methods when it is available.
- Do not commit `.env` values or generated runtime data.
- Do not use `dbConnectionOptions.synchronize: true` for production data.

## Commands

- Database setup: `npm run db:setup` then `npm run db:seed`
- Build all: `npm run build`
- Storefront production serve: `cd apps/storefront && npm run serve:only`

## Quality Checks

- Run `npm run build` after changing backend code.
- Run targeted tests for the package or feature you changed.

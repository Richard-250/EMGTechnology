# EMGTechnology Storefront

Next.js customer-facing shop for the EMGTechnology platform.

See the [root README](../../README.md) for full setup, architecture, and run instructions.

## Quick start

```bash
# From project root — install once
npm install

# Terminal 1 — API server (required for products)
cd apps/server && npm run dev:server

# Terminal 2 — storefront
cd apps/storefront && npm run serve:only
```

Open http://localhost:3002/en/search

# Product ranking algorithm

This document describes how EMG Technology orders products in default catalog
views (home grid, search “Featured mix”, featured carousel).

## Goals

1. **Useful discovery** — surface a mix of new, popular, and deal-worthy items.
2. **Light personalization** — prefer items related to *this visitor’s* recent
   searches and clicks (never another customer’s).
3. **Stable browsing** — a hard refresh must **not** reshuffle the grid.
4. **No missing products** — ranking only reorders; it never drops SKUs.

Explicit user sorts (`newest`, name, price) bypass this algorithm entirely.

## Where it runs

| Surface | Entry point | Scope key |
|---------|-------------|-----------|
| Home catalog | `rankProductsForDisplay(..., { scope: 'home-catalog' })` | `home-catalog` |
| Search / collection (sort = Featured mix) | `rankProductsForDisplay(..., { scope: 'search', searchTerm })` | `search` |
| Featured carousel | `rankProductsForDisplay(..., { scope: 'featured-carousel' })` | `featured-carousel` |

Implementation: `apps/storefront/src/lib/product-ranking.ts`

## Signals and weights

Each product gets a score in roughly `[0, 1]` as a weighted sum:

| Signal | Weight | Source |
|--------|--------|--------|
| **Newness** | 0.18 | Relative `productId` within the current result set (higher id = newer) |
| **Popularity** | 0.22 | Deterministic sold-count + rating badges (`product-badges.ts`) until live analytics exist |
| **Deals / discounts** | 0.14 | Discount badge strength (`getDiscountPercent`) |
| **Search history** | 0.16 | Name overlap with *this visitor’s* recent queries (`search-history.ts`) |
| **Relevance** | 0.18 | Vendure search `score` + query/name overlap when `q` is present |
| **Interactions** | 0.08 | Recent views/clicks for this visitor (`product-interactions.ts`) |
| **Stock** | 0.06 | API `inStock` when available; otherwise a soft slug heuristic |
| **Diversity** | 0.08 | Bucket-stable noise (see below) |

Weights are tuned so merchandising signals (popularity, deals, newness) dominate,
personalization is noticeable but not overwhelming, and diversity never overturns
the catalog.

## Stability (no shuffle on every refresh)

Random Fisher–Yates shuffle on each request is **not** used.

The only non-deterministic-looking term is **diversity**, which is a hash of:

```text
scope + rotationBucket + productId
```

`rotationBucket = floor(utcNow / 6 hours)` (`RANKING_ROTATION_HOURS = 6`).

Therefore:

- Refreshing within the same 6-hour window → **identical order**
- After the bucket rolls → gentle reordering so the storefront does not feel frozen
- Client navigations within a session stay consistent with the same bucket

Visitor-specific signals (history, interactions) change order only when *that*
visitor’s own data changes — not because of another shopper.

## Privacy

- Search history and interactions are stored in **browser localStorage**, keyed by
  guest id or logged-in customer id.
- Histories never mix across customers on a shared device after account switch.
- Only product ids, query strings (sanitized), and timestamps are stored — no
  passwords, emails, or payment data.

## Performance

Ranking is **client-side over already-fetched pages** (typically ≤ 200 items on
home, ≤ 12 per search page). It does not add GraphQL round-trips or slow the
search API.

## Extending later

- Replace badge-based popularity with real order/view metrics from Vendure.
- Pass live `inStock` from search index when exposed on `SearchResult`.
- Adjust `WEIGHTS` / `RANKING_ROTATION_HOURS` without changing call sites.

# ADR-0014: Sales ranking as an event-fed read model in Catalog

**Status:** Accepted
**Date:** 2026-09-25

## Context

The storefront shows a "Bestsellers" section and the product listing offers
`sort=bestselling`. Products belong to Catalog; what was sold is known only
to Ordering. Schema-per-context and ADR-0008 (choreography) forbid Catalog
from reading `ordering.*` tables or calling Ordering's use cases.

Business rule: products are ranked by units sold. Products that have never
sold follow, oldest first — so with no sales at all the section still shows
a stable, meaningful list instead of an empty one.

## Decision

Catalog keeps its own read model, `catalog.product_sales
(product_id PK, units_sold, updated_at)`, fed by `OrderPaid` events.

- `OrderPaid` now carries the order lines (`productVariantId`, `quantity`),
  following the same convention as `OrderPlaced`. The event carries what its
  consumers need instead of forcing them to query the producer.
- `OrderPaidSalesListener` in Catalog resolves variants to products using
  Catalog's own data and increments counters with a single
  `INSERT ... ON CONFLICT DO UPDATE SET units_sold = units_sold + excluded.units_sold`.
  The upsert is atomic, so concurrent payments for the same product cannot
  lose an increment.
- Idempotency follows ADR-0007: the inbox row is claimed first, in the same
  transaction as the counter update.
- Events without usable lines (published before this change) are
  acknowledged and logged, not retried.
- `OrderPaid`, not `OrderPlaced`: a placed but unpaid order is not a sale.

## Alternatives considered

**Query `ordering.order` from Catalog.** Rejected: breaks schema ownership
and couples Catalog to Ordering's persistence format (lines are stored as
JSONB snapshots).

**Ask Ordering through a gateway at read time.** Rejected: puts a
cross-context call on every listing request and makes the storefront depend
on Ordering's availability.

**Store `units_sold` as a column on `Product`.** Rejected: `Product` is
content edited by admins; a counter updated on every order would contend
with those edits and mix two concerns in one row.

## Consequences

**Positive:** Contexts stay decoupled; Catalog answers "what sells best"
from its own data. The fallback rule needs no separate code path — it is
the tie-breaker of the sort.

**Negative — eventual consistency:** the ranking lags payments by the
outbox polling interval (about five seconds). Irrelevant for a bestsellers
list.

**Negative — refunds and cancellations after payment** do not decrement
the counter. Acceptable for a ranking; revisit if a refund event is
introduced.

**Negative — no backfill:** orders paid before this change are not counted.
A one-off script replaying paid orders would fix it if ever needed.

**Negative — in-memory ranking:** listing filters are expressed as MikroORM
`FilterQuery`, and ordering by a table without a relation would require
rewriting every filter as raw SQL. For `sort=bestselling` the service loads
all matching products, ranks them in memory, then paginates. Cost is linear
in catalog size — negligible for hundreds of products. Revisit above a few
thousand products by moving the listing query to SQL with a
`LEFT JOIN catalog.product_sales`.

**Negative — no foreign key** from `product_sales` to `product`: the read
model has no ORM relation, to avoid an inverse side and circular imports.
Products are deactivated rather than deleted, so orphaned rows are not
expected.

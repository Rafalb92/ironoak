# ADR-0004: Price snapshot in Ordering, live price in Cart

**Status:** Accepted
**Date:** 2026-08-21

## Context

Both Cart and Ordering need pricing data owned by Catalog. Catalog prices
change over time through promotions and business decisions.

A single rule for both contexts would be wrong for one of them, so the
boundary between "active shopping" and "finalised contract" must be made
explicit.

## Decision

Pricing is handled differently on each side of the checkout boundary.

**Cart — live price.** The cart stores only `productVariantId` and
`quantity` in Redis. Prices and product names are fetched from Catalog on
every read and computed on the fly. The cart always reflects the current
state of the business.

**Ordering — snapshot.** At checkout, `PlaceOrderUseCase` fetches current
prices from Catalog and freezes them into the `Order` aggregate. Each
`OrderLine` stores `productVariantId`, `productName`, `unitPrice` and
`quantity` as immutable values. Note that the product _name_ is
snapshotted too, not only the price. After creation, an order never
consults Catalog again.

## Alternatives considered

**Snapshot prices in the Cart.** Rejected: a cart abandoned for a month
would check out at a stale price. Revenue loss and an exploitable path.

**Live prices in Ordering (storing only `productVariantId`).** Rejected:
an order is a historical record. Renaming a product or changing its price
today would retroactively alter last year's invoice, breaking accounting
and any legal reading of the order.

## Consequences

**Positive:** Orders are self-contained and immutable. Catalog can change
freely without corrupting order history. The two contexts stay decoupled —
`Ordering` holds copies, not references, so no foreign key ties them
together.

**Negative:** The cart queries Catalog on every read. At current scale this
is one indexed `WHERE id IN (...)` query; at higher traffic a read model or
cache would be the natural next step.

**Edge case at checkout.** The price shown in the cart may differ from the
final order price if Catalog changed in between. This is not a security
concern: the client never submits prices — `PlaceOrderUseCase` fetches them
from Catalog and the `Order` aggregate computes the total itself from its
lines. It is a UX concern, to be handled in the storefront by surfacing a
"price has changed" notice when the checkout total differs from the last
displayed cart total.

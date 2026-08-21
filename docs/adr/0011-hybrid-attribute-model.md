# ADR-0011: Hybrid attribute model for product variants

**Status:** Accepted
**Date:** 2026-08-21

## Context

Product categories have different attribute sets. A barbell has length,
knurling and shaft diameter; a plate has weight and tolerance; a bench has
upholstery. The storefront must filter by weight range, material, colour,
finish and price.

Three classic models were available: fixed columns, a JSON blob, or
entity-attribute-value.

## Decision

A hybrid. The rule is: **if it is filtered or sorted, it is a column; if it
is only displayed, it is JSONB.**

Columns on `product_variant`: `price`, `weight_grams`, `color`, `material`,
`finish`. JSONB in `attributes`: everything else — knurling pattern, shaft
diameter, tensile strength, tolerance, tank capacity.

## Alternatives considered

**Fixed columns for everything.** Rejected: every new category means a
migration, and most rows carry mostly nulls.

**JSONB for everything.** Rejected: range filtering becomes
`attributes->>'weight' BETWEEN ...` with string casts, loses index quality,
and gives up type safety on exactly the fields the storefront filters by.

**EAV.** Rejected: maximum flexibility, unreadable queries, poor
performance, and no benefit at this catalogue size.

## Consequences

**Positive:** Filters compile to plain indexed SQL
(`WHERE weight_grams BETWEEN 15000 AND 25000`). New categories add
attributes without a migration as long as they are display-only.

**Negative:** The line between the two storages is a judgment call and can
be wrong. Promoting an attribute from JSONB to a column later requires a
migration plus a data backfill.

**Related:** All money is stored as integer cents and all weights as
integer grams. Floating point is never used for money — `0.1 + 0.2` is not
`0.3`, and in an accounting context that is unacceptable. Formatting for
display is the storefront's responsibility.

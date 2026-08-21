# ADR-0013: MikroORM with defineEntity, and no inverse relation sides

**Status:** Accepted
**Date:** 2026-08-21

## Context

The project needed an ORM. MikroORM was chosen for its Unit of Work and
Identity Map, which map cleanly onto aggregate persistence: one `flush`
commits an aggregate and its outbox events in a single transaction.

MikroORM offers two entity definition styles: decorators or the functional
`defineEntity` API.

## Decision

**`defineEntity` over decorators.** It requires no `reflect-metadata`, no
`experimentalDecorators`, and infers types from the definition rather than
from decorator metadata. In MikroORM v7 decorators also moved to a separate
package, making the functional API the more forward-looking choice.

**No inverse relation sides.** Entities declare only the owning side
(`manyToOne`). `oneToMany` collections were removed from `User`, `Product`
and elsewhere.

**Explicit entity registration.** Entities are registered through a
generated barrel file (`mikro-orm discovery:export`) rather than glob
patterns.

## Alternatives considered

**Decorator-based entities.** Rejected: extra TypeScript configuration,
weaker inference, and a separate package in v7.

**Keeping `oneToMany` sides.** Rejected after they caused circular imports.
`product.entity.ts` importing `product-variant.entity.ts` while the latter
imported the former produced `undefined` during metadata construction —
one module was still initialising when the other read from it. Removing the
inverse side makes the import graph acyclic: `category ← product ← variant
← image`.

**Glob-based entity discovery.** Rejected: globs resolved differently for
the running application (`dist/**/*.entity.js`) and the CLI
(`src/**/*.entity.ts`), producing two instances of the same schema and
errors that looked like corruption. Explicit references eliminate the
ambiguity; the barrel keeps the list from being maintained by hand.

## Consequences

**Positive:** No circular imports, no dual-loading, one source of truth for
the entity list. Unit of Work gives transactional aggregate-plus-outbox
persistence for free.

**Negative:** No `populate` through the inverse side. Loading a product's
variants is a second explicit query rather than one call. In practice this
is better for list endpoints — it avoids N+1 and makes the query count
visible — but it is more code at each call site.

**Negative:** Adding an entity requires regenerating the barrel
(`pnpm db:entities`). Forgetting produces a confusing "entity not
discovered" error.

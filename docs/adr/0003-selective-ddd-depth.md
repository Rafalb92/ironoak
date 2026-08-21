# ADR-003: Selective DDD depth per bounded context

**Status:** Accepted
**Date:** 2026-08-20

## Context

The system has four business contexts with very different complexity:
Catalog (products, variants), Cart (temporary item list), Ordering
(order lifecycle with state transitions), Inventory (stock levels
with concurrency constraints).

Applying the same architectural depth everywhere would either
over-engineer simple contexts or under-protect complex ones.

## Decision

Pattern depth is proportional to domain richness:

- **Catalog** — plain CRUD. Service calls EntityManager directly.
  No ports, no use cases, no aggregate.
- **Cart** — thin service over Redis. No aggregate (no invariants
  to protect).
- **Inventory** — light aggregate. Protects invariants
  (reserved <= onHand, no negative quantities) but has no lifecycle
  or domain events in the aggregate itself.
- **Ordering** — full DDD. Rich aggregate, state machine, value
  objects, domain events, mapper-based persistence, ports and adapters.

## Alternatives considered

**Full DDD everywhere.** Rejected: Catalog would need ~15 files to
save a product name. Ceremony without benefit signals mechanical
pattern application rather than judgment.

**CRUD everywhere.** Rejected: Ordering has real invariants
("cannot ship an unpaid order") that would leak into services and
become untestable without infrastructure.

## Consequences

**Positive:** Each context costs what it's worth. Ordering's
invariants are unit-tested with zero mocks. Catalog took a day
instead of a week.

**Negative:** Inconsistent structure across modules — a developer
must check which style a module uses before extending it. Mitigated
by this ADR and by clear folder structure per module.

**Note:** Moving a context to a deeper level later is straightforward
(Catalog → aggregate if pricing rules appear); moving shallower is
harder.

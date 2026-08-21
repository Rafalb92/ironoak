# ADR-0005: Outbox pattern for domain event publication

**Status:** Accepted
**Date:** 2026-08-21

## Context

When an order is placed, the aggregate registers an `OrderPlaced` domain
event. Other contexts must react: Inventory reserves stock, Payments can
be initiated.

The naive implementation saves the aggregate and then publishes the event.
This is a dual write across two systems (database and message bus) that
cannot share a transaction, and it fails in both directions:

- Save succeeds, publish fails — the order exists but nothing reacts.
  Stock is never reserved. The failure is silent.
- Publish succeeds, save fails — consumers react to an order that does not
  exist. Stock is reserved for nothing, payment may be charged.

## Decision

Events are written to an `outbox.outbox_message` table **in the same
transaction as the aggregate**. A separate worker polls the table and
publishes pending rows, marking them processed.

`MikroOrmOrderRepository.save()` calls `OutboxWriter.append()` before
`flush()`, so a single `flush` commits both the aggregate and its events —
atomically, or not at all.

## Alternatives considered

**Direct publication after save.** Rejected for the dual write problem
described above.

**Two-phase commit across database and broker.** Rejected: slow, fragile,
poorly supported, and disproportionate to the problem.

**Transactional messaging in the broker.** Rejected: would require Kafka
or similar, a heavy dependency for a single-node application.

## Consequences

**Positive:** Publication is guaranteed. A crash between commit and
publication only delays delivery; the worker retries on the next pass.
The `attempts` counter and `lastError` column keep a poison message from
blocking the queue.

**Negative:** Delivery is **at-least-once**, not exactly-once. A worker can
publish and crash before marking the row processed, delivering the same
event twice. Consumers must therefore be idempotent (see ADR-0007).

**Negative:** Publication is delayed by up to one polling interval
(currently five seconds). Acceptable here; a production system would
shorten the interval or publish immediately after commit with the outbox
as a fallback.

**Operational note:** The table grows indefinitely. Processed rows need a
retention policy — not yet implemented.

# ADR-0006: Postgres as the outbox queue instead of BullMQ

**Status:** Accepted
**Date:** 2026-08-21

## Context

The outbox pattern (ADR-0005) needs a worker that reads pending events and
publishes them. The original project plan assumed BullMQ on Redis for this.

Once the outbox table existed, the question became whether a separate queue
system adds anything, given that the source of truth is already a Postgres
table.

## Decision

No BullMQ. A cron job (`@nestjs/schedule`, every five seconds) polls the
outbox table and publishes to an in-process `EventEmitter2` bus.

Concurrent workers are handled by Postgres itself:

```sql
SELECT * FROM outbox.outbox_message
WHERE processed_at IS NULL AND attempts < 5
ORDER BY id
LIMIT 50
FOR UPDATE SKIP LOCKED
```

`FOR UPDATE` locks selected rows for the transaction; `SKIP LOCKED` makes a
second worker skip locked rows instead of waiting. Two instances therefore
process disjoint batches without coordination and without blocking each
other.

Ordering is preserved by `ORDER BY id` on a `bigserial` primary key, so
`OrderPlaced` is always published before `OrderPaid`.

## Alternatives considered

**BullMQ.** Rejected: it would mean writing the event to Postgres and then
pushing it to Redis — reintroducing a dual write inside the mechanism
designed to eliminate one. It also adds a second system to operate and
monitor for a workload of a few events per minute.

**Immediate publication after commit, with the outbox only as a fallback.**
Deferred: lower latency, more moving parts. Worth revisiting if the
five-second delay becomes visible.

## Consequences

**Positive:** One fewer system to run. Transactional semantics come free.
`SKIP LOCKED` is a standard, well-understood Postgres idiom that scales to
multiple instances without extra infrastructure.

**Negative:** No exponential backoff, no priorities, no delayed jobs. The
retry policy is a simple attempt counter. Polling costs one cheap indexed
query every five seconds even when idle — the partial index
(`WHERE processed_at IS NULL`) keeps it small regardless of table size.

**Negative:** The in-process event bus means consumers run in the same
process. A consumer failure does not trigger redelivery, because the outbox
row is already marked processed. Acceptable for a single-node application;
a real broker would change this.

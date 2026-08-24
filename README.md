# Architecture Decision Records

Each record captures one decision: the problem, the choice, the rejected
alternatives and the consequences — including the costs.

| #                                                  | Decision                                               | Status   |
| -------------------------------------------------- | ------------------------------------------------------ | -------- |
| [0001](0001-nestjs-over-medusa.md)                 | Custom NestJS backend over Medusa                      | Accepted |
| [0002](0002-modular-monolith.md)                   | Modular monolith over microservices                    | Accepted |
| [0003](0003-selective-ddd-depth.md)                | Selective DDD depth per bounded context                | Accepted |
| [0004](0004-price-snapshot-vs-live-price.md)       | Price snapshot in Ordering, live price in Cart         | Accepted |
| [0005](0005-outbox-pattern.md)                     | Outbox pattern for domain event publication            | Accepted |
| [0006](0006-postgres-as-queue.md)                  | Postgres as the outbox queue instead of BullMQ         | Accepted |
| [0007](0007-inbox-idempotency.md)                  | Inbox pattern for consumer idempotency                 | Accepted |
| [0008](0008-choreography-over-orchestration.md)    | Choreography over orchestration between contexts       | Accepted |
| [0009](0009-no-command-bus.md)                     | No CommandBus / CQRS layer                             | Accepted |
| [0010](0010-httponly-cookies-for-tokens.md)        | httpOnly cookies for tokens, with refresh rotation     | Accepted |
| [0011](0011-hybrid-attribute-model.md)             | Hybrid attribute model for product variants            | Accepted |
| [0012](0012-webhook-as-payment-source-of-truth.md) | Webhook as the only source of truth for payment status | Accepted |
| [0013](0013-mikroorm-defineentity.md)              | MikroORM with defineEntity, no inverse relation sides  | Accepted |

## Format

```markdown
# ADR-XXXX: Title

**Status:** Accepted | Superseded by ADR-YYYY
**Date:** YYYY-MM-DD

## Context

What problem arose, what constraints applied.

## Decision

What was chosen.

## Alternatives considered

What was rejected, and why.

## Consequences

What follows — positive and negative.
```

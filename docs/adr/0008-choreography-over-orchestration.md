# ADR-0008: Choreography over orchestration between contexts

**Status:** Accepted
**Date:** 2026-08-21

## Context

Placing an order triggers work in other contexts: Inventory must reserve
stock, Payments must be available, and a failed reservation must cancel the
order.

Two coordination styles were available: a central orchestrator that calls
each context in sequence, or independent contexts reacting to each other's
events.

## Decision

Choreography. Contexts publish domain events and react to events from
others. No context imports another's use cases or repositories.

The order flow:

```
Order placed          → Ordering emits order.placed
Stock reserved        → Inventory reacts, emits inventory.stock.reserved
Stock unavailable     → Inventory emits inventory.stock.reservation-failed
Order cancelled       → Ordering reacts to the failure, cancels the order
Payment succeeded     → Payments emits payment.succeeded
Order marked paid     → Ordering reacts, confirms payment
Order shipped         → Ordering emits order.shipped
Stock shipped         → Inventory reacts, decrements on-hand quantity
```

Integration events are self-sufficient: `order.placed` carries its line
items so Inventory never has to query Ordering.

Where a context needs synchronous data from another (Ordering reading
prices, Payments reading an order total), it goes through a gateway port
implemented as an anti-corruption layer — `CatalogGateway`, `OrderLookup` —
that maps foreign structures into local types.

## Alternatives considered

**Central orchestrator (saga coordinator).** Rejected: it would need to
know every context and every step, becoming the coupling point the module
boundaries were meant to prevent. Justified for long, branching workflows
with compensation; disproportionate here.

**Direct synchronous calls between contexts.** Rejected: creates a
dependency graph that is hard to break later and makes each context's
availability depend on the others.

## Consequences

**Positive:** Contexts are genuinely independent. `InventoryModule` does
not import `OrderingModule`; it imports only an event-name constant.
Adding a reaction (an email on shipment) means adding a listener, touching
nothing existing.

**Negative:** The flow is not visible in one place. Understanding what
happens after checkout requires following events across three modules.
This ADR and the flow diagram above are the mitigation.

**Negative:** Latency accumulates. An out-of-stock order takes two polling
cycles to be cancelled: one to deliver `order.placed`, another to deliver
`stock.reservation-failed`.

**Compensation is manual.** There is no automatic rollback across contexts.
Each failure path is an explicit reaction — a failed reservation cancels
the order, a cancelled order releases stock. These must be designed one by
one, and release is written to tolerate "nothing to release".

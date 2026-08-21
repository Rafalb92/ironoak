# ADR-0002: Modular monolith over microservices

**Status:** Accepted
**Date:** 2026-08-21

## Context

The domain splits naturally into bounded contexts: Identity, Catalog,
Cart, Ordering, Inventory, Payments. Each has its own language and rules.

The question is deployment topology: one process with internal module
boundaries, or separate services with network boundaries.

## Decision

A single deployable application with strict internal module boundaries.
Each bounded context is a NestJS module with its own domain, application
and infrastructure layers. Cross-context communication happens through
explicit gateways (synchronous reads) or domain events (asynchronous
reactions) — never through direct imports of another context's internals.

Each context owns a Postgres schema (`identity`, `catalog`, `ordering`,
`inventory`, `payments`) in one database.

## Alternatives considered

**Microservices.** Rejected: distributed transactions, network failure
handling, service discovery and multi-repo operations would consume the
entire project budget while the domain is small enough to fit one process.
Splitting before understanding the boundaries is the classic mistake.

**Unstructured monolith.** Rejected: without enforced boundaries, contexts
bleed into each other and the design argument disappears.

## Consequences

**Positive:** One deployment, one database, transactional consistency
available where it matters. Boundaries are real but cheap to cross when a
design error is discovered.

**Negative:** Boundaries are convention-enforced, not compiler-enforced.
A careless import can violate them silently. Mitigated by explicit ports
and by keeping cross-context communication event-based.

**Migration path:** Because contexts communicate through events and
gateways, extracting one into a service later means replacing the in-process
event bus with a broker and the gateway with an HTTP client — not
rewriting the domain.

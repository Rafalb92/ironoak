# ADR-0009: No CommandBus / CQRS layer

**Status:** Accepted
**Date:** 2026-08-21

## Context

The original project plan included `@nestjs/cqrs` with a CommandBus and
QueryBus between controllers and use cases. This is a common pattern in
NestJS projects that present themselves as DDD.

By the time the Ordering module was complete, controllers were calling use
cases directly: `this.placeOrder.execute(command)`.

## Decision

No command bus. Controllers depend on use cases directly.

Commands remain as objects (`PlaceOrderCommand`, `LoginUserCommand`) where
they carry multiple input fields worth grouping and validating. They are
constructor arguments, not messages on a bus.

## Alternatives considered

**`@nestjs/cqrs` with CommandBus and handlers.** Rejected for this project.
A bus earns its cost when commands arrive from several entry points (HTTP,
queue, CLI) and need uniform cross-cutting treatment — logging every
command, wrapping each in a transaction, retrying. Here every command has
exactly one caller, and the indirection would only obscure which handler
runs.

**Full CQRS with separate read and write models.** Rejected: the read side
is simple enough that use cases returning DTOs are sufficient. Separate
models would mean maintaining projections without a scaling problem to
justify them.

## Consequences

**Positive:** Call paths are traceable — from a controller, "go to
definition" leads to the code that runs. One less abstraction to explain.

**Negative:** Cross-cutting concerns on commands must be added per use case
rather than once in a middleware pipeline. If several such concerns appear
(auditing every command, uniform transaction boundaries), this decision
should be revisited.

**Note:** The application layer is structured so that introducing a bus
later is mechanical — use cases already have a single `execute(command)`
entry point and no framework coupling. Adding a bus means registering them
as handlers, not restructuring them.

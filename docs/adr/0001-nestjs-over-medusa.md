# ADR-0001: Custom NestJS backend over Medusa

**Status:** Accepted
**Date:** 2026-08-21

## Context

IRONOAK needs an e-commerce backend. Two viable paths existed: adopt an
existing headless commerce platform (Medusa, Saleor, Vendure) or build a
custom backend.

The project is a portfolio piece targeting backend/full-stack roles. Its
purpose is to demonstrate architectural judgment, not to ship a store as
fast as possible.

## Decision

Build a custom backend on NestJS.

## Alternatives considered

**Medusa.** MIT-licensed, free to self-host, with a mature plugin
ecosystem and admin panel included. Rejected because the interesting work
— bounded contexts, aggregate design, event-driven consistency — would be
hidden inside the framework. A Medusa project demonstrates configuration
skill, not design skill.

**Saleor / Vendure.** Same reasoning, plus GraphQL-first designs that
would constrain the API surface.

## Consequences

**Positive:** Full control over module boundaries, persistence strategy,
and consistency guarantees. Every architectural decision is visible in the
repository and defensible in an interview.

**Negative:** Significantly more work. Features that ship free with a
platform (admin UI, tax calculation, shipping integrations, discount
engine) are absent or must be built.

**Accepted trade-off:** For a production store this decision would likely
be wrong. For a portfolio project whose purpose is to show design
reasoning, it is the point.

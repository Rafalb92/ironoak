# ADR-0016: Ports-and-adapters folder layout for rich-domain modules

**Status:** Accepted
**Date:** 2026-10-14

## Context

ADR-0003 gives each bounded context a depth that matches its domain richness.
The four rich-domain modules (Identity, Inventory, Payments, Ordering) all
use ports and adapters, but their folders had drifted apart:

- Identity used `adapters/in` and `adapters/out`.
- Inventory, Payments and Ordering used layered-DDD names:
  `infrastructure/http`, `infrastructure/persistence`, `infrastructure/providers`.
- Event listeners sat in `application/listeners` or `application/event-handlers`,
  inside the application layer, even though they are driving adapters
  just like controllers.

So the same kind of file lived in a different place in each module,
and the folder names did not match the "port" and "adapter" vocabulary
used in the ADRs (ADR-0003, ADR-0012).

## Decision

Every rich-domain module uses this layout:

```
modules/<context>/
├── domain/                 aggregates, entities, value objects, domain events, errors
├── application/
│   ├── ports/              interfaces and injection tokens the application depends on
│   ├── use-cases/
│   └── services/           query/read services
├── adapters/
│   ├── in/
│   │   ├── http/           controllers, guards and request DTO/schema files
│   │   └── events/         @OnEvent listeners
│   └── out/
│       ├── persistence/    MikroORM entities, mappers, repositories
│       └── <capability>/   other port implementations, one folder per capability
└── <context>.module.ts
```

Classification rule: code the outside world calls (HTTP, events) goes to
`adapters/in`. Code the application calls through a port goes to `adapters/out`,
grouped by capability (`catalog/`, `customer/`, `order/`, `payment/`, `hashing/`).

Catalog and Cart stay flat CRUD/service modules, as ADR-0003 decided.
They have no ports, so adapter folders would be ceremony without benefit.

Mapping from layered-DDD names:

| Layered DDD                          | This layout                |
| ------------------------------------ | -------------------------- |
| `interfaces` / `infrastructure/http` | `adapters/in/http`         |
| `application/listeners`              | `adapters/in/events`       |
| `infrastructure`                     | `adapters/out`             |
| `infrastructure/persistence`         | `adapters/out/persistence` |

## Alternatives considered

**Layered DDD names everywhere (`interfaces/`, `infrastructure/`).** Rejected.
The ADRs and the code talk about ports and adapters, so folder names would not
match the vocabulary, and the in/out direction (driving vs driven) would be
invisible. Listeners would still have no obvious home.

**The same layout for Catalog and Cart.** Rejected. It contradicts ADR-0003:
these modules have no ports to adapt.

## Consequences

**Positive:** A developer who knows one rich module knows where everything
is in the others. The in/out split shows the dependency direction:
`adapters/in` calls the application, the application calls `adapters/out`
through ports.

**Negative:** One-off move refactor (no behaviour change, history kept via
`git mv`). Some existing leaks become more visible. For example, the read
services in `application/services` of Inventory and Ordering import MikroORM
entities from `adapters/out/persistence` directly. Identity's MikroORM
`defineEntity` schemas stay in `domain/` (ADR-0013).

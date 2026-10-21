# ADR-0017: Nuxt layers only for shared code

**Status:** Accepted
**Date:** 2026-10-21

## Context

The monorepo has two Nuxt apps, `apps/storefront` and `apps/admin`, and used
two Nuxt layers:

- `packages/layer-base`: the auth store, `useApi`, toasts, money and format
  utils, shadcn-vue components and the Tailwind CSS. Both apps extend it.
- `packages/layer-admin`: the whole admin UI (layouts, pages, components,
  composables, queries). Only `apps/admin` extended it, so `apps/admin` itself
  held nothing but configuration.

The storefront keeps its own UI in the app. So the two apps had different
shapes, and the admin UI lived in a package that looked shareable but had
a single consumer. It also cost a second `package.json`, a second dependency
list, a second `.nuxt` to prepare, and a Tailwind `@source` path pointing
into another package.

## Decision

A Nuxt layer exists only for code with two or more consumers.

- `packages/layer-base` stays: both apps consume it.
- App UI lives in the app. `apps/storefront/app` and `apps/admin/app` hold
  their own layouts, pages, components, composables and queries.
- `packages/layer-admin` was removed for having a single consumer. Its files
  moved into `apps/admin/app` with the same relative structure (history kept
  via `git mv`). Its `nuxt.config.ts` and dependencies were merged into
  `apps/admin`.

When code in an app is needed by the other app, it moves into `layer-base`
(or into a new layer if it is a coherent group with its own config).

## Alternatives considered

**Keep `layer-admin`.** Rejected. A layer with one consumer adds a package
boundary without reuse. It hides where the admin code lives and makes
typechecking weaker: inside the layer several values were inferred as `any`,
which hid real type errors that surfaced once the code moved into the app.

**Move the storefront UI into a `layer-storefront` for symmetry.** Rejected.
Same single-consumer problem, twice.

## Consequences

**Positive:** Both apps have the same shape: shared code in `layer-base`,
app UI in the app. A new developer finds the admin pages in `apps/admin/app`.
One `package.json` per app lists what that app's code imports.

**Negative:** One-off move refactor (no behaviour change). `layer-base`'s
Tailwind CSS still has to list each app's `app/` folder as an `@source`,
because Tailwind only scans files it is told about.

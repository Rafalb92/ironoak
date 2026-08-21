# ADR-0010: httpOnly cookies for tokens, with refresh rotation

**Status:** Accepted
**Date:** 2026-08-21

## Context

The API issues JWT access and refresh tokens. The storefront is a Nuxt
application on the same origin. The question is where tokens live in the
browser and how sessions are revoked.

## Decision

**Transport.** Both tokens are `httpOnly` cookies. The access token is
scoped to `/` with a 15-minute lifetime; the refresh token is scoped to
`/auth` with a 7-day lifetime. Both use `sameSite: lax` and `secure` in
production. The API never returns a token in a response body.

**Revocation.** JWTs are stateless and cannot be invalidated before expiry,
so every issued refresh token carries a unique `jti` recorded in Redis
under `refresh:{userId}:{jti}` with a matching TTL. A refresh token is
valid only if its `jti` is present.

**Rotation and reuse detection.** Each refresh consumes the token: the old
`jti` is deleted and a new pair is issued. A correctly signed refresh token
whose `jti` is absent means either the session was terminated or the token
was already rotated — the latter implies two parties hold tokens from the
same lineage, i.e. a leak. Both cases wipe every session for that user
(`removeAllForUser`) and force re-authentication.

## Alternatives considered

**Tokens in `localStorage`.** Rejected: anything reachable from JavaScript
is reachable from an XSS payload. `httpOnly` removes the most common token
theft vector entirely.

**Stateless refresh tokens with no server-side record.** Rejected: logout
would be cosmetic and a stolen refresh token would stay valid for its full
lifetime.

**Session cookies with server-side session storage.** A reasonable
alternative that would have worked. JWTs were chosen because the access
token needs no lookup on each request, keeping the guard free of I/O.

## Consequences

**Positive:** XSS cannot read tokens. Sessions are revocable. Rotation
narrows the window in which a stolen refresh token is useful, and reuse
detection turns theft into a detectable event.

**Negative:** Cookies bring CSRF into scope. `sameSite: lax` is the first
defence; state-changing requests from a browser context would need a CSRF
token if the storefront ever moves to a different origin.

**Negative:** Logging out on one device wipes only that device's `jti`. The
"log out everywhere" path exists (`removeAllForUser`) but is currently
reachable only through reuse detection.

**Known limitation:** `removeAllForUser` uses Redis `KEYS`, which scans the
whole keyspace and blocks the server. Acceptable at current scale, but it
should become `SCAN` or a per-user set of `jti` values.

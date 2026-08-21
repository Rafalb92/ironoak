# ADR-0012: Webhook as the only source of truth for payment status

**Status:** Accepted
**Date:** 2026-08-21

## Context

Payment happens outside the system. The customer is redirected to the
provider, pays there, and is redirected back to a `success_url`.

The backend must learn whether the payment succeeded. Two signals are
available: the customer's return to `success_url`, and a server-to-server
webhook from the provider.

## Decision

Only the webhook changes state. `success_url` exists solely to show the
customer a confirmation page.

A payment is marked succeeded when `POST /webhooks/stripe` arrives with a
valid signature. The order transitions to `PAID` through the resulting
`payment.succeeded` domain event.

## Alternatives considered

**Trusting the redirect to `success_url`.** Rejected. The redirect is
ordinary browser navigation: a customer can type the URL directly, can
close the tab after paying and never return, and can arrive before the
bank declines the charge seconds later. It proves navigation, not payment.

**Polling the provider's API after redirect.** Workable but strictly worse:
extra latency, extra API calls, and still needs the webhook as a fallback
for customers who never return.

## Consequences

**Positive:** Payment status is authoritative and cannot be forged by a
client. Customers who abandon the tab are still processed correctly.

**Negative:** The confirmation page may render before the webhook arrives,
so the storefront must poll the order or subscribe to updates rather than
assume `PAID` on arrival.

**Implementation notes.** Webhook verification needs the **raw** request
body, so the global JSON parser is disabled and `express.raw` is mounted
for `/webhooks` only. The endpoint has no authentication guard — the
signature _is_ the authentication. It returns `200` even for duplicate
events, because a non-2xx response makes providers retry.

**Provider independence.** `PaymentProvider` is a port. `verifyWebhook`
returns a local `PaymentWebhookEvent`, never a provider type, so the domain
has no knowledge of Stripe. A `FakePaymentProvider` implements the same
port for local testing, and the active adapter is selected by environment
variable.

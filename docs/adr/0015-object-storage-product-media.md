# ADR-0015: Object storage for product media via direct presigned uploads

**Status:** Accepted
**Date:** 2026-09-29

## Context

Product images were stored as external URLs typed in by an admin. The
storefront needs its own media: reliable hosting, no hotlinking, and room for
product videos. The project runs on free tiers, so storage cost and egress
matter as much as the API.

Two questions had to be answered: where files live, and how they get there
without the API becoming a file proxy.

## Decision

**Storage: Cloudflare R2 through the S3 API.** R2 has a recurring free tier
and free egress, which suits a storefront where every page view reads images.
The code talks S3 (`@aws-sdk/client-s3`), so switching to AWS S3 or MinIO is a
configuration change.

**Generic port in `shared-infra`, rules in Catalog.** `ObjectStorage`
(`presignUpload`, `stat`, `copy`, `delete`, `publicUrl`) knows files and keys,
nothing about products. It lives next to Redis and the outbox. Catalog's
`ProductMediaService` owns the product rules: allowed types, the 10 MB limit,
the key layout and moving uploads into place. A separate "Media" bounded
context was rejected — it would hold references to another context's
products and synchronise deletions, with no business rules to justify it.

**Direct uploads with presigned PUT URLs.** The flow:

1. `POST /admin/products/:id/images/uploads` validates type and size and
   returns a URL valid for five minutes.
2. The browser PUTs the file straight to R2.
3. `POST /admin/products/:id/images` with `uploadKey` verifies the object
   (`stat`), moves it out of `tmp/` and records it.

The signature covers `content-type` and `content-length`, so the client cannot
upload a different type or a larger file than it declared.

**Uploads land in `tmp/`.** A bucket lifecycle rule deletes `tmp/` objects
after one day, so abandoned uploads clean themselves up without a cron job.
Upload keys embed the product id (`tmp/products/{productId}/…`) and
registration checks that prefix, so a key issued for one product cannot be
attached to another.

**The database stores a key, not a URL.** `product_image.storage_key` holds
the object key; the public URL is composed at read time from
`STORAGE_PUBLIC_BASE_URL`. Changing the domain or adding a CDN needs no data
migration. External URLs remain supported: a row has exactly one of `url`
or `storage_key`, enforced by the request contract and the service.

## Alternatives considered

**AWS S3.** Same API, but new accounts receive time-limited credits rather
than a permanent free tier, and egress is billed. Kept as a drop-in option.

**Uploading through the API (multipart to NestJS).** Rejected: the API would
buffer every file, pay for the transfer twice and need its own size limits
and timeouts for a job the storage service does natively.

**Storing full URLs.** Rejected: ties every row to today's domain.

## Consequences

**Positive:** Files never pass through the API. Storage is swappable by
configuration. Catalog tests can use an in-memory `ObjectStorage`.

**Order of operations protects the storefront from broken images.** Adding:
the file is promoted before the row is written; if the insert fails, the
promoted file is deleted (it has left `tmp/`, so no lifecycle rule would
remove it). Removing: the row is deleted before the file; a failed file
delete leaves a harmless orphan instead of a row pointing at nothing.

**Negative — SDK checksum defaults.** AWS SDK v3 (3.729+) adds CRC32
checksums by default; a presigned PUT then carries the checksum of an empty
body and R2 rejects every upload. The client is configured with
`requestChecksumCalculation: 'WHEN_REQUIRED'`. Removing that line breaks
uploads silently in the browser.

**Negative — no spending cap.** R2 budget alerts notify but do not stop
usage. The API token is scoped to a single bucket and kept out of the
repository; a leaked token is the only realistic cost risk.

**Negative — `r2.dev` is for development.** Production should serve the
bucket through a custom domain with Cloudflare caching.

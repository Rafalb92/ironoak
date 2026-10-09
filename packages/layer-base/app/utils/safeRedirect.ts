/**
 * Accepts only paths inside this app. Anything else falls back.
 *
 * "/checkout"           → allowed
 * "https://evil.example" → rejected (absolute URL)
 * "//evil.example"       → rejected (protocol-relative — browsers treat it as another host)
 * "/\evil.example"       → rejected (some browsers normalise the backslash to "//")
 *
 * Without this, /login?redirect=https://fake-shop.example sends a customer who
 * just signed in to a look-alike site — a classic phishing vector.
 */
export function safeRedirect(target: unknown, fallback = '/'): string {
  if (typeof target !== 'string') return fallback;
  if (!target.startsWith('/')) return fallback;
  if (target.startsWith('//') || target.startsWith('/\\')) return fallback;
  return target;
}

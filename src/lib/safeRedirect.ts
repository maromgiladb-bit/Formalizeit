/**
 * Validates a user-supplied "go here next" value (e.g. `?next=`) so it can only
 * point to a page on this site. Anything else returns `fallback`.
 *
 * Plain `startsWith('/') && !startsWith('//')` is not enough: browsers treat `\`
 * as `/` and drop tabs/newlines, so `/\evil.com` or `/\t/evil.com` become
 * `//evil.com`, an off-site redirect (T-048).
 */
const BASE = 'https://internal.invalid'

export function safeInternalPath(next: string | null | undefined, fallback = '/dashboard'): string {
  if (typeof next !== 'string' || !next.startsWith('/') || next.startsWith('//')) return fallback
  // Backslashes and control characters (incl. tab, CR, LF) are never needed in our paths.
  if (/[\\\u0000-\u001f\u007f]/.test(next)) return fallback
  try {
    const url = new URL(next, BASE)
    if (url.origin !== BASE) return fallback
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return fallback
  }
}

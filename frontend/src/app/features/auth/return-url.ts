/**
 * Only allow in-app relative redirects to prevent open-redirects via `?returnUrl=`.
 */
export function safeReturnUrl(url: string | null | undefined, fallback = '/projects'): string {
  if (!url || !url.startsWith('/') || url.startsWith('//') || url.startsWith('/\\')) {
    return fallback;
  }
  return url;
}

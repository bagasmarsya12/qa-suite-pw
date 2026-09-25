import { env } from './environments';

export const ignoredUrlPatterns = env.ignoredUrlPatterns;
export const ignoredConsolePatterns = env.ignoredConsolePatterns;

export function matchesConfiguredPattern(value: string, patterns: string[]): boolean {
  return patterns.some((pattern) => value.includes(pattern));
}

/**
 * Aborts that are NOT actionable failures:
 * - Next.js RSC prefetch aborts (fetch + `_rsc=`).
 * - Lazy-loaded optimized images (`_next/image`) that Chrome cancels when a
 *   navigation supersedes the load. Image health is still covered by the
 *   naturalWidth-based broken-image checks (utils/assets.ts, regression/assets).
 */
export function isIgnorableRequestAbort(resourceType: string, url: string, failure?: string): boolean {
  if (failure !== 'net::ERR_ABORTED') return false;
  if (resourceType === 'fetch' && url.includes('_rsc=')) return true;
  return resourceType === 'image' && url.includes('/_next/image');
}

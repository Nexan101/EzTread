/**
 * Simple in-memory rate limiter. Suitable for single-instance deployments.
 * For multi-instance / serverless at scale, swap the Map for a Redis store.
 */

interface Window {
  count: number;
  resetAt: number;
}

const store = new Map<string, Window>();

/**
 * Returns true if the request is allowed, false if the limit is exceeded.
 * @param key      Unique identifier (e.g. IP address)
 * @param limit    Max requests allowed per window
 * @param windowMs Window duration in milliseconds
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) {
    return false;
  }

  entry.count++;
  return true;
}

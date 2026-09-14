/**
 * Basic in-memory sliding-window rate limiter for the AI generation route.
 * Per-server-instance only (no shared store) — adequate for a single-instance
 * deployment; documented as a limitation in the README for multi-instance setups.
 */
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 5;

const requestLog = new Map<string, number[]>();

export function checkRateLimit(key: string): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const timestamps = (requestLog.get(key) ?? []).filter((t) => now - t < WINDOW_MS);

  if (timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    const oldest = timestamps[0] ?? now;
    const retryAfterSeconds = Math.ceil((WINDOW_MS - (now - oldest)) / 1000);
    requestLog.set(key, timestamps);
    return { allowed: false, retryAfterSeconds };
  }

  timestamps.push(now);
  requestLog.set(key, timestamps);
  return { allowed: true };
}

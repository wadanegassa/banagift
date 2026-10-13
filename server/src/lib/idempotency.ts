// Ephemeral idempotency cache for POST /api/orders.
//
// Keyed by the client-supplied `Idempotency-Key` header. On a repeated
// request with the same key we replay the original response body
// (including the one-time-only plaintext tracking token) instead of
// creating a duplicate order.

interface CachedResponse {
  statusCode: number;
  body: unknown;
  expiresAt: number;
}

const TTL_MS = 24 * 60 * 60 * 1000; // 24h
const store = new Map<string, CachedResponse>();

function purgeExpired(): void {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.expiresAt <= now) store.delete(key);
  }
}

export function getIdempotentResponse(key: string): CachedResponse | undefined {
  purgeExpired();
  return store.get(key);
}

export function saveIdempotentResponse(key: string, statusCode: number, body: unknown): void {
  store.set(key, { statusCode, body, expiresAt: Date.now() + TTL_MS });
}

/** Test-only helper to reset state between test files/cases. */
export function resetIdempotencyStore(): void {
  store.clear();
}

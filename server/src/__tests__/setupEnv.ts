import { beforeEach } from 'vitest';
import { resetIdempotencyStore } from '../lib/idempotency.js';
import { resetMockDb } from '../lib/mockDb.js';

// Reset in-memory state before every test so test files/cases never leak
// orders, settings changes, or idempotency cache entries into each other.
beforeEach(() => {
  resetMockDb();
  resetIdempotencyStore();
});

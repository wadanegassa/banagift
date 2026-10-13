import type { Express } from 'express';
import { createApp } from '../app.js';

let app: Express | null = null;

/** Lazily builds (and memoizes) the Express app for use with supertest. */
export function getTestApp(): Express {
  if (!app) app = createApp();
  return app;
}

export const ADMIN_TOKEN = 'mock-admin-token';
export const CUSTOMER_TOKEN = 'mock-customer-token';

/** Returns a YYYY-MM-DD date string `days` days from today (UTC). */
export function futureDateString(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// Known mock-seeded product ids (see src/lib/mockDb.ts seedProducts()).
export const AVAILABLE_PRODUCT_ID = 'b1000000-0000-4000-8000-000000000001'; // Garden Rose Bouquet, 2800 ETB
export const AVAILABLE_PRODUCT_PRICE = 2800;
export const SECOND_AVAILABLE_PRODUCT_ID = 'b1000000-0000-4000-8000-000000000005'; // Single Origin Truffles, 1500 ETB
export const SECOND_AVAILABLE_PRODUCT_PRICE = 1500;
export const UNAVAILABLE_PRODUCT_ID = 'b1000000-0000-4000-8000-000000000011'; // Celebration Balloon Cluster
export const DEFAULT_DELIVERY_FEE = 200;

export function validOrderPayload(overrides: Record<string, unknown> = {}) {
  return {
    customer_name: 'Jamie Rivera',
    customer_phone: '+15555550123',
    recipient_name: 'Alex Rivera',
    city: 'Addis Ababa',
    delivery_address: '123 Market St, Apt 4',
    delivery_date: futureDateString(5),
    items: [{ product_id: AVAILABLE_PRODUCT_ID, quantity: 2 }],
    ...overrides,
  };
}

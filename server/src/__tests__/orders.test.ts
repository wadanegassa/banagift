import request from 'supertest';
import { describe, expect, it } from 'vitest';
import {
  ADMIN_TOKEN,
  AVAILABLE_PRODUCT_ID,
  AVAILABLE_PRODUCT_PRICE,
  DEFAULT_DELIVERY_FEE,
  SECOND_AVAILABLE_PRODUCT_ID,
  SECOND_AVAILABLE_PRODUCT_PRICE,
  UNAVAILABLE_PRODUCT_ID,
  getTestApp,
  validOrderPayload,
} from './testApp.js';

describe('POST /api/orders', () => {
  const app = getTestApp();

  it('creates an order and recalculates totals from DB product prices', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send(
        validOrderPayload({
          items: [
            { product_id: AVAILABLE_PRODUCT_ID, quantity: 2 },
            { product_id: SECOND_AVAILABLE_PRODUCT_ID, quantity: 3 },
          ],
        }),
      );

    expect(res.status).toBe(201);
    const expectedSubtotal = AVAILABLE_PRODUCT_PRICE * 2 + SECOND_AVAILABLE_PRODUCT_PRICE * 3;
    expect(res.body.data.subtotal).toBeCloseTo(expectedSubtotal, 2);
    expect(res.body.data.delivery_fee).toBeCloseTo(DEFAULT_DELIVERY_FEE, 2);
    expect(res.body.data.total).toBeCloseTo(expectedSubtotal + DEFAULT_DELIVERY_FEE, 2);

    const roseLine = res.body.data.items.find((i: { product_name: string }) =>
      i.product_name.includes('Garden Rose'),
    );
    expect(roseLine.unit_price).toBeCloseTo(AVAILABLE_PRODUCT_PRICE, 2);
    expect(roseLine.line_subtotal).toBeCloseTo(AVAILABLE_PRODUCT_PRICE * 2, 2);

    expect(res.body.data.order_reference).toMatch(/^BNG-[A-Z0-9]{6}$/);
    expect(res.body.data.tracking_token).toMatch(/^[a-f0-9]{64}$/);
  });

  it('rejects orders containing an unavailable product', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send(validOrderPayload({ items: [{ product_id: UNAVAILABLE_PRODUCT_ID, quantity: 1 }] }));

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('PRODUCT_UNAVAILABLE');
    expect(res.body.error.details.items[0].product_id).toBe(UNAVAILABLE_PRODUCT_ID);
  });

  it('rejects orders referencing a non-existent product', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send(validOrderPayload({ items: [{ product_id: 'b1000000-0000-4000-8000-000000000999', quantity: 1 }] }));

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('PRODUCT_UNAVAILABLE');
  });

  it('rejects a delivery date inside the minimum lead time', async () => {
    const today = new Date().toISOString().slice(0, 10);
    const res = await request(app).post('/api/orders').send(validOrderPayload({ delivery_date: today }));
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('LEAD_TIME_TOO_SHORT');
  });

  it('is idempotent when the same Idempotency-Key is replayed', async () => {
    const key = `test-key-${Date.now()}`;
    const payload = validOrderPayload();

    const first = await request(app).post('/api/orders').set('Idempotency-Key', key).send(payload);
    expect(first.status).toBe(201);

    const second = await request(app).post('/api/orders').set('Idempotency-Key', key).send(payload);
    expect(second.status).toBe(201);

    expect(second.body.data.order_reference).toBe(first.body.data.order_reference);
    expect(second.body.data.tracking_token).toBe(first.body.data.tracking_token);

    // Confirm only a single order was actually persisted.
    const dashboard = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`);
    expect(dashboard.body.data.totals.orders).toBe(1);
  });

  it('creates a second independent order when no Idempotency-Key is sent', async () => {
    await request(app).post('/api/orders').send(validOrderPayload());
    await request(app).post('/api/orders').send(validOrderPayload());

    const dashboard = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`);
    expect(dashboard.body.data.totals.orders).toBe(2);
  });
});

describe('GET /api/orders/track/:token', () => {
  const app = getTestApp();

  async function createOrder() {
    const res = await request(app).post('/api/orders').send(validOrderPayload());
    expect(res.status).toBe(201);
    return res.body.data as { tracking_token: string; order_reference: string };
  }

  it('returns tracking details for a valid token', async () => {
    const created = await createOrder();
    const res = await request(app).get(`/api/orders/track/${created.tracking_token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.order_reference).toBe(created.order_reference);
    expect(res.body.data.order_status).toBe('pending');
    expect(Array.isArray(res.body.data.items)).toBe(true);
  });

  it('never exposes private/internal fields', async () => {
    const created = await createOrder();
    const res = await request(app).get(`/api/orders/track/${created.tracking_token}`);
    const serialized = JSON.stringify(res.body);

    for (const forbidden of [
      'notes',
      'supplier_contact',
      'supplier_notes',
      'delivery_person_name',
      'delivery_person_phone',
      'payment_notes',
      'tracking_token_hash',
    ]) {
      expect(serialized.includes(forbidden)).toBe(false);
    }
  });

  it('returns 404 for an unknown (but well-formed) token', async () => {
    const fakeToken = 'a'.repeat(64);
    const res = await request(app).get(`/api/orders/track/${fakeToken}`);
    expect(res.status).toBe(404);
  });
});

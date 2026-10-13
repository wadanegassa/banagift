import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { getTestApp, validOrderPayload } from './testApp.js';

describe('request validation', () => {
  const app = getTestApp();

  it('rejects an order missing required fields', async () => {
    const res = await request(app).post('/api/orders').send({ customer_name: 'No Items' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects an order with zero items', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send(validOrderPayload({ items: [] }));
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects an order with a non-positive quantity', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send(validOrderPayload({ items: [{ product_id: 'b1000000-0000-4000-8000-000000000001', quantity: 0 }] }));
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects an order with a non-integer quantity', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send(
        validOrderPayload({ items: [{ product_id: 'b1000000-0000-4000-8000-000000000001', quantity: 1.5 }] }),
      );
    expect(res.status).toBe(400);
  });

  it('rejects an order with quantity above the maximum', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send(validOrderPayload({ items: [{ product_id: 'b1000000-0000-4000-8000-000000000001', quantity: 51 }] }));
    expect(res.status).toBe(400);
  });

  it('rejects an order item carrying a client-supplied price (schema is strict)', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send(
        validOrderPayload({
          items: [{ product_id: 'b1000000-0000-4000-8000-000000000001', quantity: 1, unit_price: 0.01 }],
        }),
      );
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects a malformed delivery_date', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send(validOrderPayload({ delivery_date: '12/31/2099' }));
    expect(res.status).toBe(400);
  });

  it('rejects an invalid product sort value', async () => {
    const res = await request(app).get('/api/products').query({ sort: 'not_a_real_sort' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects a malformed tracking token', async () => {
    const res = await request(app).get('/api/orders/track/not-a-valid-token');
    expect(res.status).toBe(400);
  });

  it('rejects an admin product update with no fields', async () => {
    const res = await request(app)
      .patch('/api/admin/products/b1000000-0000-4000-8000-000000000001')
      .set('Authorization', 'Bearer mock-admin-token')
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('EMPTY_UPDATE');
  });
});

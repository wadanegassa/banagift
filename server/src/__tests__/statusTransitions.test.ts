import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { canTransitionOrderStatus } from '../lib/orderStatus.js';
import { ADMIN_TOKEN, getTestApp, validOrderPayload } from './testApp.js';

describe('canTransitionOrderStatus (pure)', () => {
  it('allows every documented forward transition', () => {
    expect(canTransitionOrderStatus('pending', 'confirmed')).toBe(true);
    expect(canTransitionOrderStatus('pending', 'cancelled')).toBe(true);
    expect(canTransitionOrderStatus('confirmed', 'preparing')).toBe(true);
    expect(canTransitionOrderStatus('confirmed', 'cancelled')).toBe(true);
    expect(canTransitionOrderStatus('preparing', 'out_for_delivery')).toBe(true);
    expect(canTransitionOrderStatus('preparing', 'cancelled')).toBe(true);
    expect(canTransitionOrderStatus('out_for_delivery', 'delivered')).toBe(true);
    expect(canTransitionOrderStatus('out_for_delivery', 'cancelled')).toBe(true);
  });

  it('disallows skipping stages', () => {
    expect(canTransitionOrderStatus('pending', 'preparing')).toBe(false);
    expect(canTransitionOrderStatus('pending', 'out_for_delivery')).toBe(false);
    expect(canTransitionOrderStatus('pending', 'delivered')).toBe(false);
    expect(canTransitionOrderStatus('confirmed', 'out_for_delivery')).toBe(false);
    expect(canTransitionOrderStatus('confirmed', 'delivered')).toBe(false);
    expect(canTransitionOrderStatus('preparing', 'delivered')).toBe(false);
  });

  it('disallows moving backwards', () => {
    expect(canTransitionOrderStatus('confirmed', 'pending')).toBe(false);
    expect(canTransitionOrderStatus('preparing', 'confirmed')).toBe(false);
    expect(canTransitionOrderStatus('delivered', 'pending')).toBe(false);
  });

  it('treats delivered and cancelled as terminal states', () => {
    for (const to of ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'] as const) {
      expect(canTransitionOrderStatus('delivered', to)).toBe(false);
      expect(canTransitionOrderStatus('cancelled', to)).toBe(false);
    }
  });

  it('disallows transitioning to the same status', () => {
    expect(canTransitionOrderStatus('pending', 'pending')).toBe(false);
  });
});

describe('PATCH /api/admin/orders/:id/status', () => {
  const app = getTestApp();

  async function createOrderAndFindId(): Promise<string> {
    const createRes = await request(app).post('/api/orders').send(validOrderPayload());
    const reference = createRes.body.data.order_reference as string;

    const listRes = await request(app)
      .get('/api/admin/orders')
      .query({ search: reference })
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`);
    expect(listRes.body.data).toHaveLength(1);
    return listRes.body.data[0].id as string;
  }

  it('walks an order through its full valid lifecycle', async () => {
    const id = await createOrderAndFindId();
    const auth = { Authorization: `Bearer ${ADMIN_TOKEN}` };

    for (const status of ['confirmed', 'preparing', 'out_for_delivery', 'delivered']) {
      const res = await request(app).patch(`/api/admin/orders/${id}/status`).set(auth).send({ status });
      expect(res.status).toBe(200);
      expect(res.body.data.order_status).toBe(status);
    }
  });

  it('rejects an invalid transition (skipping a stage)', async () => {
    const id = await createOrderAndFindId();
    const auth = { Authorization: `Bearer ${ADMIN_TOKEN}` };

    const res = await request(app)
      .patch(`/api/admin/orders/${id}/status`)
      .set(auth)
      .send({ status: 'out_for_delivery' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_STATUS_TRANSITION');
  });

  it('rejects any transition out of a terminal state', async () => {
    const id = await createOrderAndFindId();
    const auth = { Authorization: `Bearer ${ADMIN_TOKEN}` };

    const cancel = await request(app).patch(`/api/admin/orders/${id}/status`).set(auth).send({ status: 'cancelled' });
    expect(cancel.status).toBe(200);

    const retry = await request(app).patch(`/api/admin/orders/${id}/status`).set(auth).send({ status: 'confirmed' });
    expect(retry.status).toBe(400);
    expect(retry.body.error.code).toBe('INVALID_STATUS_TRANSITION');
  });

  it('rejects an unauthenticated status update', async () => {
    const id = await createOrderAndFindId();
    const res = await request(app).patch(`/api/admin/orders/${id}/status`).send({ status: 'confirmed' });
    expect(res.status).toBe(401);
  });
});

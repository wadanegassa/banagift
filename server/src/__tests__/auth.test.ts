import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { ADMIN_TOKEN, CUSTOMER_TOKEN, getTestApp } from './testApp.js';

describe('admin authentication', () => {
  const app = getTestApp();

  it('rejects requests with no Authorization header', async () => {
    const res = await request(app).get('/api/admin/dashboard');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('rejects a malformed Authorization header', async () => {
    const res = await request(app).get('/api/admin/dashboard').set('Authorization', 'Token abc123');
    expect(res.status).toBe(401);
  });

  it('rejects an unknown / invalid bearer token', async () => {
    const res = await request(app).get('/api/admin/dashboard').set('Authorization', 'Bearer totally-made-up-token');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('rejects an authenticated non-admin user', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${CUSTOMER_TOKEN}`);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('allows an authenticated admin user', async () => {
    const res = await request(app).get('/api/admin/dashboard').set('Authorization', `Bearer ${ADMIN_TOKEN}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('totals');
  });

  it('rejects every admin route consistently', async () => {
    const routes = [
      ['get', '/api/admin/orders'],
      ['get', '/api/admin/products'],
      ['get', '/api/admin/categories'],
      ['get', '/api/admin/settings'],
    ] as const;

    for (const [method, path] of routes) {
      const res = await request(app)[method](path);
      expect(res.status).toBe(401);
    }
  });
});

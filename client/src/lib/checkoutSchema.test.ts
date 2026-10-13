import { describe, expect, it } from 'vitest';
import { checkoutSchema, toCreateOrderPayload } from '@/lib/checkoutSchema';

const validValues = {
  customer_name: 'Jane Doe',
  customer_phone: '+15551234567',
  recipient_name: 'John Smith',
  recipient_phone: '',
  city: 'Downtown',
  delivery_address: '123 Main St',
  delivery_date: '2026-12-25',
  delivery_time_window: '',
  delivery_instructions: '',
  gift_message: '',
  special_request: '',
  consent: true as const,
};

describe('checkoutSchema', () => {
  it('accepts a fully valid submission', () => {
    const result = checkoutSchema.safeParse(validValues);
    expect(result.success).toBe(true);
  });

  it('rejects a missing customer name', () => {
    const result = checkoutSchema.safeParse({ ...validValues, customer_name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid delivery date format', () => {
    const result = checkoutSchema.safeParse({ ...validValues, delivery_date: '12/25/2026' });
    expect(result.success).toBe(false);
  });

  it('rejects a too-short phone number', () => {
    const result = checkoutSchema.safeParse({ ...validValues, customer_phone: '123' });
    expect(result.success).toBe(false);
  });

  it('requires the consent checkbox to be checked', () => {
    const result = checkoutSchema.safeParse({ ...validValues, consent: false });
    expect(result.success).toBe(false);
  });

  it('allows optional fields to be omitted as empty strings', () => {
    const result = checkoutSchema.safeParse({
      ...validValues,
      recipient_phone: '',
      delivery_time_window: '',
      delivery_instructions: '',
      gift_message: '',
      special_request: '',
    });
    expect(result.success).toBe(true);
  });
});

describe('toCreateOrderPayload', () => {
  it('strips the client-only consent field and omits empty optional fields', () => {
    const payload = toCreateOrderPayload(validValues, [{ product_id: 'p1', quantity: 2 }]);
    expect(payload).not.toHaveProperty('consent');
    expect(payload.recipient_phone).toBeUndefined();
    expect(payload.items).toEqual([{ product_id: 'p1', quantity: 2 }]);
  });

  it('preserves populated optional fields', () => {
    const payload = toCreateOrderPayload(
      { ...validValues, gift_message: 'Happy birthday!' },
      [{ product_id: 'p1', quantity: 1 }],
    );
    expect(payload.gift_message).toBe('Happy birthday!');
  });
});

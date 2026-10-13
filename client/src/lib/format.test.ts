import { describe, expect, it } from 'vitest';
import { formatMoney, formatDate, getInitials, slugify, formatStatusLabel } from '@/lib/format';

describe('formatMoney', () => {
  it('formats ETB amounts without forced cents', () => {
    expect(formatMoney(2800, 'ETB')).toMatch(/2[,.]?800/);
    expect(formatMoney(2800, 'ETB')).toMatch(/Br|ETB|ብር/i);
  });

  it('defaults to ETB when currency is omitted', () => {
    expect(formatMoney(1500)).toMatch(/1[,.]?500/);
  });

  it('formats USD when explicitly requested', () => {
    expect(formatMoney(68, 'USD')).toBe('$68.00');
  });

  it('defaults non-finite amounts to zero', () => {
    expect(formatMoney(Number.NaN, 'ETB')).toMatch(/0/);
  });

  it('falls back gracefully for an unknown currency code', () => {
    expect(formatMoney(10, 'NOTREAL')).toContain('10.00');
  });
});

describe('formatDate', () => {
  it('formats a YYYY-MM-DD date string as a readable date', () => {
    expect(formatDate('2026-12-25')).toBe('December 25, 2026');
  });
});

describe('getInitials', () => {
  it('returns two initials for a full name', () => {
    expect(getInitials('Garden Rose Bouquet')).toBe('GR');
  });

  it('returns up to two letters for a single word', () => {
    expect(getInitials('Chocolates')).toBe('CH');
  });

  it('handles empty input', () => {
    expect(getInitials('')).toBe('?');
  });
});

describe('slugify', () => {
  it('converts a label into a URL-safe slug', () => {
    expect(slugify('Garden Rose Bouquet!')).toBe('garden-rose-bouquet');
  });
});

describe('formatStatusLabel', () => {
  it('converts snake_case statuses into title case', () => {
    expect(formatStatusLabel('out_for_delivery')).toBe('Out For Delivery');
  });
});

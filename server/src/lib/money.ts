// Money helpers. All monetary values are stored/returned as plain
// JavaScript numbers rounded to 2 decimal places (matching NUMERIC(12,2)
// columns). Nothing here ever trusts a client-supplied price or total —
// callers must only pass in prices sourced from the database.

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export interface PricedLine {
  unitPrice: number;
  quantity: number;
}

export function lineSubtotal(line: PricedLine): number {
  return round2(line.unitPrice * line.quantity);
}

export interface OrderTotals {
  subtotal: number;
  deliveryFee: number;
  total: number;
}

export function computeOrderTotals(lines: PricedLine[], deliveryFee: number): OrderTotals {
  const subtotal = round2(lines.reduce((sum, line) => sum + lineSubtotal(line), 0));
  const fee = round2(deliveryFee);
  return {
    subtotal,
    deliveryFee: fee,
    total: round2(subtotal + fee),
  };
}

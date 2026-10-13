import { formatMoney } from '@/lib/format';

export interface CartSummaryProps {
  subtotal: number;
  deliveryFee?: number | null;
  currency?: string;
  total?: number;
  note?: string;
}

export function CartSummary({ subtotal, deliveryFee, currency = 'ETB', total, note }: CartSummaryProps) {
  const computedTotal = total ?? subtotal + (deliveryFee ?? 0);

  return (
    <div className="border border-border bg-white p-5">
      <h2 className="font-serif text-xl text-text">Order summary</h2>
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted">Subtotal</dt>
          <dd className="text-text">{formatMoney(subtotal, currency)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">Delivery</dt>
          <dd className="text-text">{deliveryFee != null ? formatMoney(deliveryFee, currency) : 'Calculated at confirmation'}</dd>
        </div>
      </dl>
      <div className="mt-4 flex justify-between border-t border-border pt-4 text-base font-medium">
        <span>Estimated total</span>
        <span className="text-accent">{formatMoney(computedTotal, currency)}</span>
      </div>
      {note && <p className="mt-3 text-xs text-muted">{note}</p>}
    </div>
  );
}

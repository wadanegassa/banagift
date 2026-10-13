import { useState, type FormEvent } from 'react';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { PAYMENT_STATUSES, type Order } from '@/types/models';
import { formatStatusLabel } from '@/lib/format';

export interface PaymentFormProps {
  order: Order;
  isSubmitting: boolean;
  onSubmit: (patch: {
    payment_status?: string;
    amount_paid?: number;
    payment_method?: string | null;
    payment_notes?: string | null;
  }) => void;
}

export function PaymentForm({ order, isSubmitting, onSubmit }: PaymentFormProps) {
  const [paymentStatus, setPaymentStatus] = useState<string>(order.payment_status);
  const [amountPaid, setAmountPaid] = useState<string>(String(order.amount_paid ?? 0));
  const [paymentMethod, setPaymentMethod] = useState<string>(order.payment_method ?? '');
  const [paymentNotes, setPaymentNotes] = useState<string>(order.payment_notes ?? '');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit({
      payment_status: paymentStatus,
      amount_paid: Number(amountPaid) || 0,
      payment_method: paymentMethod || null,
      payment_notes: paymentNotes || null,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="payment_status">Payment status</Label>
        <Select id="payment_status" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
          {PAYMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {formatStatusLabel(s)}
            </option>
          ))}
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="amount_paid">Amount paid</Label>
          <Input
            id="amount_paid"
            type="number"
            min={0}
            step="0.01"
            value={amountPaid}
            onChange={(e) => setAmountPaid(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="payment_method">Method</Label>
          <Input
            id="payment_method"
            placeholder="e.g. Telebirr, CBE Birr, Cash"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="payment_notes">Payment notes</Label>
        <Textarea id="payment_notes" rows={2} value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)} />
      </div>
      <Button type="submit" isLoading={isSubmitting}>
        Save payment details
      </Button>
    </form>
  );
}

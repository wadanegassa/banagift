import { useState, type FormEvent } from 'react';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { SUPPLIER_STATUSES, type Order } from '@/types/models';
import { formatStatusLabel } from '@/lib/format';

export interface FulfillmentFormProps {
  order: Order;
  isSubmitting: boolean;
  onSubmit: (patch: {
    supplier_status?: string;
    supplier_contact?: string | null;
    supplier_notes?: string | null;
    delivery_person_name?: string | null;
    delivery_person_phone?: string | null;
    delivery_arrangement_notes?: string | null;
  }) => void;
}

export function FulfillmentForm({ order, isSubmitting, onSubmit }: FulfillmentFormProps) {
  const [supplierStatus, setSupplierStatus] = useState(order.supplier_status);
  const [supplierContact, setSupplierContact] = useState(order.supplier_contact ?? '');
  const [supplierNotes, setSupplierNotes] = useState(order.supplier_notes ?? '');
  const [deliveryPersonName, setDeliveryPersonName] = useState(order.delivery_person_name ?? '');
  const [deliveryPersonPhone, setDeliveryPersonPhone] = useState(order.delivery_person_phone ?? '');
  const [deliveryNotes, setDeliveryNotes] = useState(order.delivery_arrangement_notes ?? '');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit({
      supplier_status: supplierStatus,
      supplier_contact: supplierContact || null,
      supplier_notes: supplierNotes || null,
      delivery_person_name: deliveryPersonName || null,
      delivery_person_phone: deliveryPersonPhone || null,
      delivery_arrangement_notes: deliveryNotes || null,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="supplier_status">Supplier status</Label>
        <Select id="supplier_status" value={supplierStatus} onChange={(e) => setSupplierStatus(e.target.value as typeof supplierStatus)}>
          {SUPPLIER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {formatStatusLabel(s)}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="supplier_contact">Supplier contact</Label>
        <Input id="supplier_contact" value={supplierContact} onChange={(e) => setSupplierContact(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="supplier_notes">Supplier notes</Label>
        <Textarea id="supplier_notes" rows={2} value={supplierNotes} onChange={(e) => setSupplierNotes(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="delivery_person_name">Delivery person</Label>
          <Input id="delivery_person_name" value={deliveryPersonName} onChange={(e) => setDeliveryPersonName(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="delivery_person_phone">Delivery phone</Label>
          <Input id="delivery_person_phone" value={deliveryPersonPhone} onChange={(e) => setDeliveryPersonPhone(e.target.value)} />
        </div>
      </div>
      <div>
        <Label htmlFor="delivery_arrangement_notes">Delivery arrangement notes</Label>
        <Textarea
          id="delivery_arrangement_notes"
          rows={2}
          value={deliveryNotes}
          onChange={(e) => setDeliveryNotes(e.target.value)}
        />
      </div>
      <Button type="submit" isLoading={isSubmitting}>
        Save fulfillment details
      </Button>
    </form>
  );
}

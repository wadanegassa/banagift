import { z } from 'zod';

// Mirrors server/src/routes/public/orders.ts createOrderSchema, plus a
// client-only consent checkbox that is never sent to the API.
export const checkoutSchema = z.object({
  customer_name: z.string().trim().min(1, 'Your name is required').max(200),
  customer_phone: z.string().trim().min(5, 'Enter a valid phone number').max(30),
  recipient_name: z.string().trim().min(1, "Recipient's name is required").max(200),
  recipient_phone: z.string().trim().max(30).optional().or(z.literal('')),
  city: z.string().trim().min(1, 'City is required').max(120),
  delivery_address: z.string().trim().min(1, 'Delivery address is required').max(500),
  delivery_date: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose a delivery date'),
  delivery_time_window: z.string().trim().max(100).optional().or(z.literal('')),
  delivery_instructions: z.string().trim().max(500).optional().or(z.literal('')),
  gift_message: z.string().trim().max(500).optional().or(z.literal('')),
  special_request: z.string().trim().max(500).optional().or(z.literal('')),
  consent: z.literal(true, {
    message: 'Please confirm you agree to be contacted to complete the order',
  }),
});

export type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export interface OrderItemInput {
  product_id: string;
  quantity: number;
}

/** Builds the exact request body the API expects, stripping client-only fields. */
export function toCreateOrderPayload(values: CheckoutFormValues, items: OrderItemInput[]) {
  return {
    customer_name: values.customer_name,
    customer_phone: values.customer_phone,
    recipient_name: values.recipient_name,
    recipient_phone: values.recipient_phone || undefined,
    city: values.city,
    delivery_address: values.delivery_address,
    delivery_date: values.delivery_date,
    delivery_time_window: values.delivery_time_window || undefined,
    delivery_instructions: values.delivery_instructions || undefined,
    gift_message: values.gift_message || undefined,
    special_request: values.special_request || undefined,
    items,
  };
}

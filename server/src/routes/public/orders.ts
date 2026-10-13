import { Router } from 'express';
import { z } from 'zod';
import { getIdempotentResponse, saveIdempotentResponse } from '../../lib/idempotency.js';
import { orderRateLimiter, trackRateLimiter } from '../../middleware/rateLimit.js';
import { validate } from '../../middleware/validate.js';
import {
  createOrder,
  getOrderByPhoneAndReference,
  getOrderByTrackingToken,
  listOrdersByCustomerPhone,
  type CustomerOrderSummary,
  type TrackingView,
} from '../../services/orders.js';
import type { ApiSuccess } from '../../types/api.js';

export const ordersRouter: Router = Router();

const orderItemSchema = z
  .object({
    product_id: z.string().uuid('product_id must be a valid UUID'),
    quantity: z.number().int().positive().max(50),
  })
  .strict();

const createOrderSchema = z
  .object({
    customer_name: z.string().trim().min(1).max(200),
    customer_phone: z.string().trim().min(5).max(30),
    recipient_name: z.string().trim().min(1).max(200),
    recipient_phone: z
      .string()
      .trim()
      .max(30)
      .optional()
      .transform((v) => (v && v.length >= 5 ? v : undefined)),
    city: z.string().trim().min(1).max(120),
    delivery_address: z.string().trim().min(1).max(500),
    delivery_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'delivery_date must be formatted as YYYY-MM-DD'),
    delivery_time_window: z
      .string()
      .trim()
      .max(100)
      .optional()
      .transform((v) => (v ? v : undefined)),
    delivery_instructions: z
      .string()
      .trim()
      .max(500)
      .optional()
      .transform((v) => (v ? v : undefined)),
    gift_message: z
      .string()
      .trim()
      .max(500)
      .optional()
      .transform((v) => (v ? v : undefined)),
    special_request: z
      .string()
      .trim()
      .max(500)
      .optional()
      .transform((v) => (v ? v : undefined)),
    items: z.array(orderItemSchema).min(1, 'An order must contain at least one item').max(50),
  })
  .strict();

export interface CreateOrderResponseData {
  order_reference: string;
  tracking_token: string;
  order_status: string;
  payment_status: string;
  delivery_date: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  currency: string;
  items: Array<{ product_name: string; unit_price: number; quantity: number; line_subtotal: number }>;
}

ordersRouter.post('/orders', orderRateLimiter, validate({ body: createOrderSchema }), async (req, res, next) => {
  try {
    const idempotencyKey = req.header('Idempotency-Key')?.trim() || undefined;

    if (idempotencyKey) {
      const cached = getIdempotentResponse(idempotencyKey);
      if (cached) {
        res.status(cached.statusCode).json(cached.body);
        return;
      }
    }

    const input = req.body as z.infer<typeof createOrderSchema>;
    const { order, items, trackingToken } = await createOrder(input);

    const body: ApiSuccess<CreateOrderResponseData> = {
      data: {
        order_reference: order.order_reference,
        tracking_token: trackingToken,
        order_status: order.order_status,
        payment_status: order.payment_status,
        delivery_date: order.delivery_date,
        subtotal: order.subtotal,
        delivery_fee: order.delivery_fee,
        total: order.total,
        currency: order.currency,
        items: items.map((i) => ({
          product_name: i.product_name,
          unit_price: i.unit_price,
          quantity: i.quantity,
          line_subtotal: i.line_subtotal,
        })),
      },
    };

    if (idempotencyKey) saveIdempotentResponse(idempotencyKey, 201, body);
    res.status(201).json(body);
  } catch (err) {
    next(err);
  }
});

const trackParamsSchema = z.object({
  token: z
    .string()
    .trim()
    .regex(/^[a-f0-9]{64}$/, 'Invalid tracking token'),
});

ordersRouter.get(
  '/orders/track/:token',
  trackRateLimiter,
  validate({ params: trackParamsSchema }),
  async (req, res, next) => {
    try {
      const { token } = req.params as unknown as z.infer<typeof trackParamsSchema>;
      const tracking = await getOrderByTrackingToken(token);
      const body: ApiSuccess<TrackingView> = { data: tracking };
      res.json(body);
    } catch (err) {
      next(err);
    }
  },
);

const myOrdersBodySchema = z
  .object({
    phone: z.string().trim().min(8).max(30),
  })
  .strict();

/** Look up all guest orders for a checkout phone number. */
ordersRouter.post(
  '/orders/my',
  trackRateLimiter,
  validate({ body: myOrdersBodySchema }),
  async (req, res, next) => {
    try {
      const { phone } = req.body as z.infer<typeof myOrdersBodySchema>;
      const orders = await listOrdersByCustomerPhone(phone);
      const body: ApiSuccess<CustomerOrderSummary[]> = { data: orders };
      res.json(body);
    } catch (err) {
      next(err);
    }
  },
);

const myOrderDetailBodySchema = z
  .object({
    phone: z.string().trim().min(8).max(30),
    order_reference: z.string().trim().min(3).max(40),
  })
  .strict();

/** Open one order’s public details when the phone matches. */
ordersRouter.post(
  '/orders/my/detail',
  trackRateLimiter,
  validate({ body: myOrderDetailBodySchema }),
  async (req, res, next) => {
    try {
      const { phone, order_reference } = req.body as z.infer<typeof myOrderDetailBodySchema>;
      const tracking = await getOrderByPhoneAndReference(phone, order_reference);
      const body: ApiSuccess<TrackingView> = { data: tracking };
      res.json(body);
    } catch (err) {
      next(err);
    }
  },
);

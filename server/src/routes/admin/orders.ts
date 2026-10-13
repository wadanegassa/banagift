import { Router } from 'express';
import { z } from 'zod';
import { badRequest } from '../../lib/errors.js';
import { validate } from '../../middleware/validate.js';
import {
  addOrderNote,
  getOrderAdminById,
  listOrdersAdmin,
  updateOrderFulfillment,
  updateOrderPayment,
  updateOrderStatus,
} from '../../services/orders.js';
import type { ApiSuccess } from '../../types/api.js';
import { ORDER_STATUSES, PAYMENT_STATUSES, SUPPLIER_STATUSES } from '../../types/models.js';
import type { Order, OrderNote, OrderWithRelations } from '../../types/models.js';

export const adminOrdersRouter: Router = Router();

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be formatted as YYYY-MM-DD');

const listQuerySchema = z.object({
  search: z.string().trim().min(1).max(200).optional(),
  status: z.enum(ORDER_STATUSES).optional(),
  payment_status: z.enum(PAYMENT_STATUSES).optional(),
  date_from: dateString.optional(),
  date_to: dateString.optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

const idParamsSchema = z.object({ id: z.string().uuid() });

adminOrdersRouter.get('/orders', validate({ query: listQuerySchema }), async (req, res, next) => {
  try {
    const query = req.query as unknown as z.infer<typeof listQuerySchema>;
    const { items, total } = await listOrdersAdmin({
      search: query.search,
      status: query.status,
      paymentStatus: query.payment_status,
      dateFrom: query.date_from,
      dateTo: query.date_to,
      page: query.page,
      limit: query.limit,
    });
    const body: ApiSuccess<Order[]> = { data: items, meta: { page: query.page, limit: query.limit, total } };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

adminOrdersRouter.get('/orders/:id', validate({ params: idParamsSchema }), async (req, res, next) => {
  try {
    const { id } = req.params as unknown as z.infer<typeof idParamsSchema>;
    const order = await getOrderAdminById(id);
    const body: ApiSuccess<OrderWithRelations> = { data: order };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

const statusBodySchema = z
  .object({
    status: z.enum(ORDER_STATUSES),
    note: z.string().trim().max(1000).optional(),
  })
  .strict();

adminOrdersRouter.patch(
  '/orders/:id/status',
  validate({ params: idParamsSchema, body: statusBodySchema }),
  async (req, res, next) => {
    try {
      const { id } = req.params as unknown as z.infer<typeof idParamsSchema>;
      const { status, note } = req.body as z.infer<typeof statusBodySchema>;
      const order = await updateOrderStatus(id, status, req.admin?.id ?? null, note ?? null);
      const body: ApiSuccess<Order> = { data: order };
      res.json(body);
    } catch (err) {
      next(err);
    }
  },
);

const paymentBodySchema = z
  .object({
    payment_status: z.enum(PAYMENT_STATUSES).optional(),
    amount_paid: z.number().min(0).optional(),
    payment_method: z.string().trim().max(100).nullable().optional(),
    payment_notes: z.string().trim().max(1000).nullable().optional(),
  })
  .strict();

adminOrdersRouter.patch(
  '/orders/:id/payment',
  validate({ params: idParamsSchema, body: paymentBodySchema }),
  async (req, res, next) => {
    try {
      const { id } = req.params as unknown as z.infer<typeof idParamsSchema>;
      const patch = req.body as z.infer<typeof paymentBodySchema>;
      if (Object.keys(patch).length === 0) {
        throw badRequest('EMPTY_UPDATE', 'At least one field must be provided');
      }
      const order = await updateOrderPayment(id, patch);
      const body: ApiSuccess<Order> = { data: order };
      res.json(body);
    } catch (err) {
      next(err);
    }
  },
);

const fulfillmentBodySchema = z
  .object({
    supplier_status: z.enum(SUPPLIER_STATUSES).optional(),
    supplier_contact: z.string().trim().max(300).nullable().optional(),
    supplier_notes: z.string().trim().max(1000).nullable().optional(),
    delivery_person_name: z.string().trim().max(200).nullable().optional(),
    delivery_person_phone: z.string().trim().max(30).nullable().optional(),
    delivery_arrangement_notes: z.string().trim().max(1000).nullable().optional(),
  })
  .strict();

adminOrdersRouter.patch(
  '/orders/:id/fulfillment',
  validate({ params: idParamsSchema, body: fulfillmentBodySchema }),
  async (req, res, next) => {
    try {
      const { id } = req.params as unknown as z.infer<typeof idParamsSchema>;
      const patch = req.body as z.infer<typeof fulfillmentBodySchema>;
      if (Object.keys(patch).length === 0) {
        throw badRequest('EMPTY_UPDATE', 'At least one field must be provided');
      }
      const order = await updateOrderFulfillment(id, patch);
      const body: ApiSuccess<Order> = { data: order };
      res.json(body);
    } catch (err) {
      next(err);
    }
  },
);

const noteBodySchema = z
  .object({
    note_text: z.string().trim().min(1).max(2000),
  })
  .strict();

adminOrdersRouter.post(
  '/orders/:id/notes',
  validate({ params: idParamsSchema, body: noteBodySchema }),
  async (req, res, next) => {
    try {
      const { id } = req.params as unknown as z.infer<typeof idParamsSchema>;
      const { note_text } = req.body as z.infer<typeof noteBodySchema>;
      const note = await addOrderNote(id, req.admin?.id ?? null, note_text);
      const body: ApiSuccess<OrderNote> = { data: note };
      res.status(201).json(body);
    } catch (err) {
      next(err);
    }
  },
);

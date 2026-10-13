import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import { getProductBySlug, listProducts } from '../../services/products.js';
import type { ApiSuccess } from '../../types/api.js';
import type { ProductWithRelations } from '../../types/models.js';

export const productsRouter: Router = Router();

const listQuerySchema = z.object({
  search: z.string().trim().min(1).max(200).optional(),
  category: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
  sort: z.enum(['price_asc', 'price_desc', 'newest']).optional(),
  featured: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

const slugParamsSchema = z.object({
  slug: z.string().trim().min(1),
});

productsRouter.get('/products', validate({ query: listQuerySchema }), async (req, res, next) => {
  try {
    const query = req.query as unknown as z.infer<typeof listQuerySchema>;
    const { items, total } = await listProducts(query);
    const body: ApiSuccess<ProductWithRelations[]> = {
      data: items,
      meta: { page: query.page, limit: query.limit, total },
    };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

productsRouter.get('/products/:slug', validate({ params: slugParamsSchema }), async (req, res, next) => {
  try {
    const { slug } = req.params as unknown as z.infer<typeof slugParamsSchema>;
    const product = await getProductBySlug(slug);
    const body: ApiSuccess<ProductWithRelations> = { data: product };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

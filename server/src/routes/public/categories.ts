import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import { listCategories, listProductsForCategory } from '../../services/categories.js';
import type { ApiSuccess } from '../../types/api.js';
import type { Category, ProductWithRelations } from '../../types/models.js';

export const categoriesRouter: Router = Router();

const slugParamsSchema = z.object({ slug: z.string().trim().min(1) });
const pageQuerySchema = z.object({
  sort: z.enum(['price_asc', 'price_desc', 'newest']).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

categoriesRouter.get('/categories', async (_req, res, next) => {
  try {
    const categories = await listCategories(true);
    const body: ApiSuccess<Category[]> = { data: categories };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

categoriesRouter.get(
  '/categories/:slug/products',
  validate({ params: slugParamsSchema, query: pageQuerySchema }),
  async (req, res, next) => {
    try {
      const { slug } = req.params as unknown as z.infer<typeof slugParamsSchema>;
      const query = req.query as unknown as z.infer<typeof pageQuerySchema>;
      const { items, total, category } = await listProductsForCategory(slug, query);
      const body: ApiSuccess<ProductWithRelations[]> & { category: Category } = {
        data: items,
        meta: { page: query.page, limit: query.limit, total },
        category,
      };
      res.json(body);
    } catch (err) {
      next(err);
    }
  },
);

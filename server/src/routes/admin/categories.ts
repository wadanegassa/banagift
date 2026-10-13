import { Router } from 'express';
import { z } from 'zod';
import { badRequest } from '../../lib/errors.js';
import { validate } from '../../middleware/validate.js';
import {
  createCategory,
  deleteCategory,
  getCategoryByIdAdmin,
  listCategories,
  updateCategory,
} from '../../services/categories.js';
import type { ApiSuccess } from '../../types/api.js';
import type { Category } from '../../types/models.js';

export const adminCategoriesRouter: Router = Router();

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const idParamsSchema = z.object({ id: z.string().uuid() });

adminCategoriesRouter.get('/categories', async (_req, res, next) => {
  try {
    const categories = await listCategories(false);
    const body: ApiSuccess<Category[]> = { data: categories };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

adminCategoriesRouter.get('/categories/:id', validate({ params: idParamsSchema }), async (req, res, next) => {
  try {
    const { id } = req.params as unknown as z.infer<typeof idParamsSchema>;
    const category = await getCategoryByIdAdmin(id);
    const body: ApiSuccess<Category> = { data: category };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

const createBodySchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    slug: z.string().trim().regex(slugPattern, 'slug must be lowercase, alphanumeric, hyphen-separated'),
    description: z.string().trim().max(2000).nullable().optional(),
    image_path: z.string().trim().max(500).nullable().optional(),
    sort_order: z.number().int().min(0).optional().default(0),
    is_active: z.boolean().optional().default(true),
  })
  .strict();

adminCategoriesRouter.post('/categories', validate({ body: createBodySchema }), async (req, res, next) => {
  try {
    const input = req.body as z.infer<typeof createBodySchema>;
    const category = await createCategory(input);
    const body: ApiSuccess<Category> = { data: category };
    res.status(201).json(body);
  } catch (err) {
    next(err);
  }
});

const updateBodySchema = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    slug: z.string().trim().regex(slugPattern).optional(),
    description: z.string().trim().max(2000).nullable().optional(),
    image_path: z.string().trim().max(500).nullable().optional(),
    sort_order: z.number().int().min(0).optional(),
    is_active: z.boolean().optional(),
  })
  .strict();

adminCategoriesRouter.patch(
  '/categories/:id',
  validate({ params: idParamsSchema, body: updateBodySchema }),
  async (req, res, next) => {
    try {
      const { id } = req.params as unknown as z.infer<typeof idParamsSchema>;
      const patch = req.body as z.infer<typeof updateBodySchema>;
      if (Object.keys(patch).length === 0) {
        throw badRequest('EMPTY_UPDATE', 'At least one field must be provided');
      }
      const category = await updateCategory(id, patch);
      const body: ApiSuccess<Category> = { data: category };
      res.json(body);
    } catch (err) {
      next(err);
    }
  },
);

adminCategoriesRouter.delete('/categories/:id', validate({ params: idParamsSchema }), async (req, res, next) => {
  try {
    const { id } = req.params as unknown as z.infer<typeof idParamsSchema>;
    await deleteCategory(id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

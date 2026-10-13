import { Router } from 'express';
import { z } from 'zod';
import { badRequest } from '../../lib/errors.js';
import { validate } from '../../middleware/validate.js';
import {
  archiveProduct,
  createProduct,
  getProductById,
  listProducts,
  updateProduct,
} from '../../services/products.js';
import { productImageUpload, uploadProductImage } from '../../services/storage.js';
import type { ApiSuccess } from '../../types/api.js';
import type { ProductImage, ProductWithRelations } from '../../types/models.js';

export const adminProductsRouter: Router = Router();

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const listQuerySchema = z.object({
  search: z.string().trim().min(1).max(200).optional(),
  category: z.string().trim().regex(slugPattern).optional(),
  featured: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  archived: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

adminProductsRouter.get('/products', validate({ query: listQuerySchema }), async (req, res, next) => {
  try {
    const query = req.query as unknown as z.infer<typeof listQuerySchema>;
    const { items, total } = await listProducts({
      search: query.search,
      category: query.category,
      featured: query.featured,
      page: query.page,
      limit: query.limit,
      includeUnavailable: true,
      includeArchived: query.archived ?? false,
    });
    const body: ApiSuccess<ProductWithRelations[]> = {
      data: items,
      meta: { page: query.page, limit: query.limit, total },
    };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

const idParamsSchema = z.object({ id: z.string().uuid() });

adminProductsRouter.get('/products/:id', validate({ params: idParamsSchema }), async (req, res, next) => {
  try {
    const { id } = req.params as unknown as z.infer<typeof idParamsSchema>;
    const product = await getProductById(id);
    const body: ApiSuccess<ProductWithRelations> = { data: product };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

const createBodySchema = z
  .object({
    category_id: z.string().uuid().nullable().optional(),
    name: z.string().trim().min(1).max(200),
    slug: z.string().trim().regex(slugPattern, 'slug must be lowercase, alphanumeric, hyphen-separated'),
    description: z.string().trim().max(5000).optional().default(''),
    price: z.number().min(0),
    is_available: z.boolean().optional().default(true),
    is_featured: z.boolean().optional().default(false),
  })
  .strict();

adminProductsRouter.post('/products', validate({ body: createBodySchema }), async (req, res, next) => {
  try {
    const input = req.body as z.infer<typeof createBodySchema>;
    const product = await createProduct({ ...input, category_id: input.category_id ?? null });
    const body: ApiSuccess<ProductWithRelations> = { data: product };
    res.status(201).json(body);
  } catch (err) {
    next(err);
  }
});

const updateBodySchema = z
  .object({
    category_id: z.string().uuid().nullable().optional(),
    name: z.string().trim().min(1).max(200).optional(),
    slug: z.string().trim().regex(slugPattern).optional(),
    description: z.string().trim().max(5000).optional(),
    price: z.number().min(0).optional(),
    is_available: z.boolean().optional(),
    is_featured: z.boolean().optional(),
  })
  .strict();

adminProductsRouter.patch(
  '/products/:id',
  validate({ params: idParamsSchema, body: updateBodySchema }),
  async (req, res, next) => {
    try {
      const { id } = req.params as unknown as z.infer<typeof idParamsSchema>;
      const patch = req.body as z.infer<typeof updateBodySchema>;
      if (Object.keys(patch).length === 0) {
        throw badRequest('EMPTY_UPDATE', 'At least one field must be provided');
      }
      const product = await updateProduct(id, patch);
      const body: ApiSuccess<ProductWithRelations> = { data: product };
      res.json(body);
    } catch (err) {
      next(err);
    }
  },
);

// DELETE = soft archive (sets archived_at), never a hard delete.
adminProductsRouter.delete('/products/:id', validate({ params: idParamsSchema }), async (req, res, next) => {
  try {
    const { id } = req.params as unknown as z.infer<typeof idParamsSchema>;
    await archiveProduct(id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

const imageBodySchema = z.object({
  alt_text: z.string().trim().max(300).optional(),
  sort_order: z.coerce.number().int().min(0).optional().default(0),
});

adminProductsRouter.post(
  '/products/:id/images',
  validate({ params: idParamsSchema }),
  (req, res, next) => {
    productImageUpload(req, res, (err) => {
      if (err) {
        next(
          err instanceof Error && 'code' in err && (err as { code?: string }).code === 'LIMIT_FILE_SIZE'
            ? badRequest('FILE_TOO_LARGE', 'Image must be 5MB or smaller')
            : err,
        );
        return;
      }
      next();
    });
  },
  validate({ body: imageBodySchema }),
  async (req, res, next) => {
    try {
      const { id } = req.params as unknown as z.infer<typeof idParamsSchema>;
      const { alt_text, sort_order } = req.body as z.infer<typeof imageBodySchema>;
      if (!req.file) {
        throw badRequest('MISSING_FILE', 'An image file is required (field name: "image")');
      }
      const image = await uploadProductImage(id, req.file, alt_text ?? null, sort_order);
      const body: ApiSuccess<ProductImage> = { data: image };
      res.status(201).json(body);
    } catch (err) {
      next(err);
    }
  },
);

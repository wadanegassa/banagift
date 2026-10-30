import { config } from '../config.js';
import { conflict, notFound } from '../lib/errors.js';
import { enrichProduct, enrichProducts } from '../lib/images.js';
import { mockCategories, mockProductImages, mockProducts } from '../lib/mockDb.js';
import { getSupabaseAdmin } from '../lib/supabase.js';
import type { Category, Product, ProductImage, ProductWithRelations } from '../types/models.js';

export interface ListProductsParams {
  search?: string;
  category?: string;
  sort?: 'price_asc' | 'price_desc' | 'newest';
  featured?: boolean;
  page: number;
  limit: number;
  /** Admin-only: include archived / unavailable products. */
  includeArchived?: boolean;
  includeUnavailable?: boolean;
}

export interface ListProductsResult {
  items: ProductWithRelations[];
  total: number;
}

function toProductWithRelations(
  product: Product,
  category: Category | null,
  images: ProductImage[],
): ProductWithRelations {
  return {
    ...product,
    category: category ? { id: category.id, name: category.name, slug: category.slug } : null,
    images,
  };
}

export async function listProducts(params: ListProductsParams): Promise<ListProductsResult> {
  if (config.useMockDb) {
    const { items, total } = mockProducts.list({
      search: params.search,
      categorySlug: params.category,
      featured: params.featured,
      sort: params.sort,
      page: params.page,
      limit: params.limit,
      includeArchived: params.includeArchived,
      includeUnavailable: params.includeUnavailable,
    });
    const images = mockProductImages.listForProducts(items.map((p) => p.id));
    const enriched = items.map((p) => {
      const category = p.category_id ? mockCategories.findById(p.category_id) ?? null : null;
      const productImages = images.filter((img) => img.product_id === p.id);
      return toProductWithRelations(p, category, productImages);
    });
    return { items: enriched, total };
  }

  const supabase = getSupabaseAdmin();
  let query = supabase
    .from('products')
    .select('*, category:categories(id, name, slug), images:product_images(*)', { count: 'exact' });

  if (!params.includeArchived) query = query.is('archived_at', null);
  if (!params.includeUnavailable) query = query.eq('is_available', true);
  if (params.featured !== undefined) query = query.eq('is_featured', params.featured);
  if (params.category) {
    const { data: category } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', params.category)
      .maybeSingle();
    if (!category) return { items: [], total: 0 };
    query = query.eq('category_id', category.id);
  }
  if (params.search) {
    const term = params.search.replace(/[%,]/g, '');
    query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%`);
  }

  switch (params.sort) {
    case 'price_asc':
      query = query.order('price', { ascending: true });
      break;
    case 'price_desc':
      query = query.order('price', { ascending: false });
      break;
    default:
      query = query.order('created_at', { ascending: false });
      break;
  }

  const start = (params.page - 1) * params.limit;
  query = query.range(start, start + params.limit - 1);

  const { data, error, count } = await query;
  if (error) throw error;
  return {
    items: enrichProducts((data ?? []) as unknown as ProductWithRelations[]),
    total: count ?? 0,
  };
}

export async function getProductBySlug(slug: string): Promise<ProductWithRelations> {
  if (config.useMockDb) {
    const product = mockProducts.findBySlug(slug);
    // Archived products are never shown publicly; unavailable-but-active
    // products remain visible (e.g. "temporarily out of stock").
    if (!product || product.archived_at !== null) {
      throw notFound('Product not found');
    }
    const category = product.category_id ? mockCategories.findById(product.category_id) ?? null : null;
    const images = mockProductImages.listForProduct(product.id);
    return toProductWithRelations(product, category, images);
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories(id, name, slug), images:product_images(*)')
    .eq('slug', slug)
    .is('archived_at', null)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw notFound('Product not found');
  return enrichProduct(data as unknown as ProductWithRelations);
}

export async function getProductById(id: string): Promise<ProductWithRelations> {
  if (config.useMockDb) {
    const product = mockProducts.findById(id);
    if (!product) throw notFound('Product not found');
    const category = product.category_id ? mockCategories.findById(product.category_id) ?? null : null;
    const images = mockProductImages.listForProduct(product.id);
    return toProductWithRelations(product, category, images);
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories(id, name, slug), images:product_images(*)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw notFound('Product not found');
  return enrichProduct(data as unknown as ProductWithRelations);
}

export interface CreateProductInput {
  category_id: string | null;
  name: string;
  slug: string;
  description: string;
  price: number;
  stock_quantity: number;
  is_available: boolean;
  is_featured: boolean;
}

export async function createProduct(input: CreateProductInput): Promise<ProductWithRelations> {
  const stock_quantity = Math.max(0, Math.floor(input.stock_quantity ?? 0));
  const payload = {
    ...input,
    stock_quantity,
    is_available: stock_quantity === 0 ? false : input.is_available,
  };

  if (config.useMockDb) {
    if (mockProducts.slugExists(payload.slug)) {
      throw conflict('SLUG_TAKEN', 'A product with this slug already exists');
    }
    const product = mockProducts.create(payload);
    return getProductById(product.id);
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from('products').insert(payload).select('id').single();
  if (error) {
    if (error.code === '23505') throw conflict('SLUG_TAKEN', 'A product with this slug already exists');
    throw error;
  }
  return getProductById(data.id);
}

export interface UpdateProductInput {
  category_id?: string | null;
  name?: string;
  slug?: string;
  description?: string;
  price?: number;
  stock_quantity?: number;
  is_available?: boolean;
  is_featured?: boolean;
}

function normalizeStockPatch<T extends { stock_quantity?: number; is_available?: boolean }>(patch: T): T {
  if (typeof patch.stock_quantity !== 'number') return patch;
  const stock = Math.max(0, Math.floor(patch.stock_quantity));
  const next = { ...patch, stock_quantity: stock };
  if (stock === 0) next.is_available = false;
  return next;
}

export async function updateProduct(id: string, patch: UpdateProductInput): Promise<ProductWithRelations> {
  const normalized = normalizeStockPatch(patch);
  if (config.useMockDb) {
    if (!mockProducts.findById(id)) throw notFound('Product not found');
    if (normalized.slug && mockProducts.slugExists(normalized.slug, id)) {
      throw conflict('SLUG_TAKEN', 'A product with this slug already exists');
    }
    mockProducts.update(id, normalized);
    return getProductById(id);
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('products').update(normalized).eq('id', id);
  if (error) {
    if (error.code === '23505') throw conflict('SLUG_TAKEN', 'A product with this slug already exists');
    throw error;
  }
  return getProductById(id);
}

export async function archiveProduct(id: string): Promise<void> {
  if (config.useMockDb) {
    const product = mockProducts.archive(id);
    if (!product) throw notFound('Product not found');
    return;
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('products')
    .update({ archived_at: new Date().toISOString(), is_available: false })
    .eq('id', id);
  if (error) throw error;
}

export async function addProductImage(
  productId: string,
  storagePath: string,
  url: string,
  altText: string | null,
  sortOrder: number,
): Promise<ProductImage> {
  if (config.useMockDb) {
    if (!mockProducts.findById(productId)) throw notFound('Product not found');
    return mockProductImages.add({
      product_id: productId,
      storage_path: storagePath,
      url,
      alt_text: altText,
      sort_order: sortOrder,
    });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('product_images')
    .insert({ product_id: productId, storage_path: storagePath, alt_text: altText, sort_order: sortOrder })
    .select('*')
    .single();
  if (error) throw error;
  return { ...(data as ProductImage), url };
}

/** Fetches multiple products by id (used to recalculate order prices). */
export async function getProductsByIds(ids: string[]): Promise<ProductWithRelations[]> {
  if (ids.length === 0) return [];
  if (config.useMockDb) {
    return mockProducts.findByIds(ids).map((product) => {
      const category = product.category_id ? mockCategories.findById(product.category_id) ?? null : null;
      const images = mockProductImages.listForProduct(product.id);
      return toProductWithRelations(product, category, images);
    });
  }
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories(id, name, slug), images:product_images(*)')
    .in('id', ids);
  if (error) throw error;
  return enrichProducts((data ?? []) as unknown as ProductWithRelations[]);
}

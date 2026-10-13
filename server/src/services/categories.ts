import { config } from '../config.js';
import { conflict, notFound } from '../lib/errors.js';
import { resolveImageUrl } from '../lib/images.js';
import { mockCategories } from '../lib/mockDb.js';
import { getSupabaseAdmin } from '../lib/supabase.js';
import type { Category } from '../types/models.js';
import { listProducts, type ListProductsResult } from './products.js';

export type CategoryPublic = Category & { image_url: string | null };

function withCategoryImage(category: Category): CategoryPublic {
  return { ...category, image_url: resolveImageUrl(category.image_path) };
}

export async function listCategories(activeOnly = true): Promise<CategoryPublic[]> {
  if (config.useMockDb) {
    return mockCategories.list(activeOnly).map(withCategoryImage);
  }
  const supabase = getSupabaseAdmin();
  let query = supabase.from('categories').select('*').order('sort_order', { ascending: true });
  if (activeOnly) query = query.eq('is_active', true);
  const { data, error } = await query;
  if (error) throw error;
  return ((data ?? []) as Category[]).map(withCategoryImage);
}

export async function getCategoryBySlug(slug: string): Promise<Category> {
  if (config.useMockDb) {
    const category = mockCategories.findBySlug(slug);
    if (!category || !category.is_active) throw notFound('Category not found');
    return category;
  }
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw notFound('Category not found');
  return data as Category;
}

export async function getCategoryByIdAdmin(id: string): Promise<Category> {
  if (config.useMockDb) {
    const category = mockCategories.findById(id);
    if (!category) throw notFound('Category not found');
    return category;
  }
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from('categories').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data) throw notFound('Category not found');
  return data as Category;
}

export async function listProductsForCategory(
  slug: string,
  params: { page: number; limit: number; sort?: 'price_asc' | 'price_desc' | 'newest' },
): Promise<ListProductsResult & { category: Category }> {
  const category = await getCategoryBySlug(slug);
  const result = await listProducts({ ...params, category: slug });
  return { ...result, category };
}

export interface CategoryInput {
  name: string;
  slug: string;
  description?: string | null;
  image_path?: string | null;
  sort_order?: number;
  is_active?: boolean;
}

export async function createCategory(input: CategoryInput): Promise<Category> {
  if (config.useMockDb) {
    if (mockCategories.slugExists(input.slug)) {
      throw conflict('SLUG_TAKEN', 'A category with this slug already exists');
    }
    return mockCategories.create({
      name: input.name,
      slug: input.slug,
      description: input.description ?? null,
      image_path: input.image_path ?? null,
      sort_order: input.sort_order ?? 0,
      is_active: input.is_active ?? true,
    });
  }
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from('categories').insert(input).select('*').single();
  if (error) {
    if (error.code === '23505') throw conflict('SLUG_TAKEN', 'A category with this slug already exists');
    throw error;
  }
  return data as Category;
}

export async function updateCategory(id: string, patch: Partial<CategoryInput>): Promise<Category> {
  if (config.useMockDb) {
    if (!mockCategories.findById(id)) throw notFound('Category not found');
    if (patch.slug && mockCategories.slugExists(patch.slug, id)) {
      throw conflict('SLUG_TAKEN', 'A category with this slug already exists');
    }
    const updated = mockCategories.update(id, patch);
    if (!updated) throw notFound('Category not found');
    return updated;
  }
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from('categories').update(patch).eq('id', id).select('*').maybeSingle();
  if (error) {
    if (error.code === '23505') throw conflict('SLUG_TAKEN', 'A category with this slug already exists');
    throw error;
  }
  if (!data) throw notFound('Category not found');
  return data as Category;
}

export async function deleteCategory(id: string): Promise<void> {
  if (config.useMockDb) {
    const deleted = mockCategories.delete(id);
    if (!deleted) throw notFound('Category not found');
    return;
  }
  const supabase = getSupabaseAdmin();
  const { error, count } = await supabase.from('categories').delete({ count: 'exact' }).eq('id', id);
  if (error) throw error;
  if (!count) throw notFound('Category not found');
}

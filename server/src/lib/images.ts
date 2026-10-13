import { config } from '../config.js';
import type { ProductImage, ProductWithRelations } from '../types/models.js';

/**
 * Curated photography for demo seed paths. These are Unsplash images
 * (permitted for this use) so the storefront looks polished even before
 * real product photos are uploaded to Storage.
 */
const DEMO_IMAGES: Record<string, string> = {
  'demo/products/garden-rose-bouquet.jpg':
    'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=900&q=80',
  'demo/products/wild-meadow.jpg':
    'https://images.unsplash.com/photo-1468327768560-75b630cbb148?auto=format&fit=crop&w=900&q=80',
  'demo/products/evening-indulgence.jpg':
    'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=900&q=80',
  'demo/products/morning-ritual.jpg':
    'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=900&q=80',
  'demo/products/truffles.jpg':
    'https://images.unsplash.com/photo-1481391319762-47dff72954d9?auto=format&fit=crop&w=900&q=80',
  'demo/products/caramels.jpg':
    'https://images.unsplash.com/photo-1511381939415-e44015466834?auto=format&fit=crop&w=900&q=80',
  'demo/products/birthday-bloom.jpg':
    'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=900&q=80',
  'demo/products/anniversary-duo.jpg':
    'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=900&q=80',
  'demo/products/graduate-desk.jpg':
    'https://images.unsplash.com/photo-1456324504439-367cee3b3c32?auto=format&fit=crop&w=900&q=80',
  'demo/products/monogram-candle.jpg':
    'https://images.unsplash.com/photo-1602607388856-c72e9c0b0e6a?auto=format&fit=crop&w=900&q=80',
  'demo/products/balloons.jpg':
    'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=900&q=80',
  'demo/products/hostess-tray.jpg':
    'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=900&q=80',
  'demo/categories/flowers.jpg':
    'https://images.unsplash.com/photo-1487530811176-3780da8112fd?auto=format&fit=crop&w=800&q=80',
  'demo/categories/gift-boxes.jpg':
    'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?auto=format&fit=crop&w=800&q=80',
  'demo/categories/chocolates.jpg':
    'https://images.unsplash.com/photo-1548907040-4baa42d10919?auto=format&fit=crop&w=800&q=80',
  'demo/categories/birthday.jpg':
    'https://images.unsplash.com/photo-1464349153735-7db50ed83c84?auto=format&fit=crop&w=800&q=80',
  'demo/categories/anniversary.jpg':
    'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=800&q=80',
  'demo/categories/graduation.jpg':
    'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=80',
  'demo/categories/personalized.jpg':
    'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=800&q=80',
};

export function resolveImageUrl(storagePath: string | null | undefined): string | null {
  if (!storagePath) return null;
  if (/^https?:\/\//i.test(storagePath)) return storagePath;

  const demo = DEMO_IMAGES[storagePath];
  if (demo) return demo;

  if (!config.supabaseUrl) return null;
  const cleaned = storagePath.replace(/^\/+/, '');
  return `${config.supabaseUrl}/storage/v1/object/public/product-images/${cleaned}`;
}

export function withImageUrls(images: Array<Partial<ProductImage> & { storage_path: string }>): ProductImage[] {
  return images.map((img, index) => ({
    id: img.id ?? `img-${index}`,
    product_id: img.product_id ?? '',
    storage_path: img.storage_path,
    url: img.url || resolveImageUrl(img.storage_path) || '',
    alt_text: img.alt_text ?? null,
    sort_order: img.sort_order ?? index,
    created_at: img.created_at ?? new Date().toISOString(),
  }));
}

export function enrichProduct<T extends ProductWithRelations>(product: T): T {
  const images = Array.isArray(product.images) ? withImageUrls(product.images) : [];
  return { ...product, images };
}

export function enrichProducts<T extends ProductWithRelations>(products: T[]): T[] {
  return products.map((p) => enrichProduct(p));
}

import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';
import multer from 'multer';
import { config } from '../config.js';
import { badRequest } from '../lib/errors.js';
import { getSupabaseAdmin } from '../lib/supabase.js';
import type { ProductImage } from '../types/models.js';
import { addProductImage } from './products.js';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const EXTENSION_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};
const PRODUCT_IMAGES_BUCKET = 'product-images';

/** In-memory "object storage" used only when USE_MOCK_DB=true. */
const mockFileStore = new Map<string, Buffer>();

export function getMockUploadedFile(storagePath: string): Buffer | undefined {
  return mockFileStore.get(storagePath);
}

export const productImageUpload: RequestHandler = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(badRequest('INVALID_FILE_TYPE', 'Only JPEG, PNG, WEBP, and GIF images are allowed'));
      return;
    }
    cb(null, true);
  },
}).single('image');

export async function uploadProductImage(
  productId: string,
  file: { buffer: Buffer; mimetype: string },
  altText: string | null,
  sortOrder: number,
): Promise<ProductImage> {
  const extension = EXTENSION_BY_MIME[file.mimetype] ?? 'bin';
  const storagePath = `products/${productId}/${randomUUID()}.${extension}`;

  if (config.useMockDb) {
    mockFileStore.set(storagePath, file.buffer);
    const url = `/uploads/mock/${encodeURIComponent(storagePath)}`;
    return addProductImage(productId, storagePath, url, altText, sortOrder);
  }

  const supabase = getSupabaseAdmin();
  const { error: uploadError } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(storagePath, file.buffer, { contentType: file.mimetype, upsert: false });
  if (uploadError) throw uploadError;

  const { data: publicUrlData } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(storagePath);
  return addProductImage(productId, storagePath, publicUrlData.publicUrl, altText, sortOrder);
}

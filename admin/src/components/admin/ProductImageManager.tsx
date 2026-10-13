import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ProductImage } from '@/components/products/ProductImage';
import { useUploadProductImage } from '@/hooks/useAdmin';
import { useToast } from '@/components/ui/Toast';
import { ApiError } from '@/types/api';
import type { ProductImage as ProductImageType } from '@/types/models';

export interface ProductImageManagerProps {
  productId: string;
  images: ProductImageType[];
}

export function ProductImageManager({ productId, images }: ProductImageManagerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadImage = useUploadProductImage(productId);
  const { show } = useToast();
  const [altText, setAltText] = useState('');

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadImage.mutateAsync({ file, altText: altText || undefined, sortOrder: images.length });
      show({ tone: 'success', title: 'Image uploaded' });
      setAltText('');
    } catch (err) {
      show({ tone: 'error', title: 'Upload failed', description: err instanceof ApiError ? err.message : undefined });
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {images.map((img) => (
          <div key={img.id} className="aspect-square overflow-hidden border border-border">
            <ProductImage src={img.url} alt={img.alt_text || 'Product image'} className="h-full w-full" />
          </div>
        ))}
        {images.length === 0 && <p className="col-span-full text-sm text-muted">No images uploaded yet.</p>}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Alt text (optional)"
          value={altText}
          onChange={(e) => setAltText(e.target.value)}
          className="rounded border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none"
        />
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleFileChange} />
        <Button
          type="button"
          variant="outline"
          size="sm"
          isLoading={uploadImage.isPending}
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-2"
        >
          <Upload className="h-3.5 w-3.5" /> Upload image
        </Button>
      </div>
      <p className="mt-1 text-xs text-muted">JPEG, PNG, WEBP, or GIF. Up to 5MB.</p>
    </div>
  );
}

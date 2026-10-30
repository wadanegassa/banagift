import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { slugify } from '@/lib/format';
import type { Category, ProductWithRelations } from '@/types/models';

export const productFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(200),
  slug: z
    .string()
    .trim()
    .min(1, 'Slug is required')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers, and hyphens only'),
  category_id: z.string().optional(),
  description: z.string().trim().max(5000).optional(),
  price: z.coerce.number().min(0, 'Price must be 0 or more'),
  stock_quantity: z.coerce.number().int().min(0, 'Stock must be 0 or more'),
  is_available: z.boolean(),
  is_featured: z.boolean(),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;

export interface ProductFormProps {
  categories: Category[];
  initialProduct?: ProductWithRelations;
  isSubmitting: boolean;
  onSubmit: (values: ProductFormValues) => void;
  submitLabel?: string;
}

export function ProductForm({ categories, initialProduct, isSubmitting, onSubmit, submitLabel = 'Save product' }: ProductFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, dirtyFields },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: initialProduct?.name ?? '',
      slug: initialProduct?.slug ?? '',
      category_id: initialProduct?.category_id ?? '',
      description: initialProduct?.description ?? '',
      price: initialProduct?.price ?? 0,
      stock_quantity: initialProduct?.stock_quantity ?? 10,
      is_available: initialProduct?.is_available ?? true,
      is_featured: initialProduct?.is_featured ?? false,
    },
  });

  const nameValue = watch('name');

  useEffect(() => {
    if (!initialProduct && !dirtyFields.slug && nameValue) {
      setValue('slug', slugify(nameValue));
    }
  }, [nameValue, initialProduct, dirtyFields.slug, setValue]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="name" required>
            Name
          </Label>
          <Input id="name" {...register('name')} />
          {errors.name && <p className="mt-1 text-xs text-danger">{errors.name.message}</p>}
        </div>
        <div>
          <Label htmlFor="slug" required>
            Slug
          </Label>
          <Input id="slug" {...register('slug')} />
          {errors.slug && <p className="mt-1 text-xs text-danger">{errors.slug.message}</p>}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="category_id">Category</Label>
          <Select id="category_id" {...register('category_id')}>
            <option value="">No category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="price" required>
            Price (ETB)
          </Label>
          <Input id="price" type="number" min={0} step="0.01" {...register('price')} />
          {errors.price && <p className="mt-1 text-xs text-danger">{errors.price.message}</p>}
        </div>
        <div>
          <Label htmlFor="stock_quantity" required>
            Stock
          </Label>
          <Input id="stock_quantity" type="number" min={0} step="1" {...register('stock_quantity')} />
          {errors.stock_quantity && (
            <p className="mt-1 text-xs text-danger">{errors.stock_quantity.message}</p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" rows={5} {...register('description')} />
      </div>

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm text-text">
          <input type="checkbox" className="h-4 w-4" {...register('is_available')} />
          Available for purchase
        </label>
        <label className="flex items-center gap-2 text-sm text-text">
          <input type="checkbox" className="h-4 w-4" {...register('is_featured')} />
          Featured on homepage
        </label>
      </div>

      <Button type="submit" isLoading={isSubmitting}>
        {submitLabel}
      </Button>
    </form>
  );
}

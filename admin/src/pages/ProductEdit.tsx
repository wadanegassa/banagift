import { Link, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { PageMeta } from '@/components/ui/PageMeta';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { ProductForm, type ProductFormValues } from '@/components/admin/ProductForm';
import { ProductImageManager } from '@/components/admin/ProductImageManager';
import { useAdminCategories, useAdminProduct, useUpdateProduct } from '@/hooks/useAdmin';
import { useToast } from '@/components/ui/Toast';
import { ApiError } from '@/types/api';

export function ProductEdit() {
  const { id } = useParams<{ id: string }>();
  const { data: productRes, isLoading, isError, refetch } = useAdminProduct(id);
  const { data: categoriesRes } = useAdminCategories();
  const updateProduct = useUpdateProduct(id ?? '');
  const { show } = useToast();

  if (isLoading) return <Spinner />;
  if (isError || !productRes) {
    return <ErrorState message="Couldn't load this product." onRetry={() => refetch()} />;
  }

  const product = productRes.data;

  async function handleSubmit(values: ProductFormValues) {
    try {
      await updateProduct.mutateAsync({
        ...values,
        category_id: values.category_id || null,
        description: values.description ?? '',
      });
      show({ tone: 'success', title: 'Product updated' });
    } catch (err) {
      show({ tone: 'error', title: 'Could not update product', description: err instanceof ApiError ? err.message : undefined });
    }
  }

  return (
    <div>
      <PageMeta title={`Edit ${product.name}`} noIndex />
      <Link to="/products" className="inline-flex items-center gap-1 text-sm text-muted hover:text-accent">
        <ChevronLeft className="h-4 w-4" /> Back to products
      </Link>
      <h1 className="mt-3 font-serif text-3xl text-text">{product.name}</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="border border-border bg-white p-6">
          <ProductForm
            categories={categoriesRes?.data ?? []}
            initialProduct={product}
            isSubmitting={updateProduct.isPending}
            onSubmit={handleSubmit}
          />
        </div>
        <div className="border border-border bg-white p-6">
          <h2 className="font-serif text-xl text-text">Images</h2>
          <div className="mt-4">
            <ProductImageManager productId={product.id} images={product.images} />
          </div>
        </div>
      </div>
    </div>
  );
}

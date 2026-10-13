import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { PageMeta } from '@/components/ui/PageMeta';
import { Spinner } from '@/components/ui/Spinner';
import { ProductForm, type ProductFormValues } from '@/components/admin/ProductForm';
import { useAdminCategories, useCreateProduct } from '@/hooks/useAdmin';
import { useToast } from '@/components/ui/Toast';
import { ApiError } from '@/types/api';

export function ProductNew() {
  const { data: categoriesRes, isLoading } = useAdminCategories();
  const createProduct = useCreateProduct();
  const { show } = useToast();
  const navigate = useNavigate();

  async function handleSubmit(values: ProductFormValues) {
    try {
      const res = await createProduct.mutateAsync({
        ...values,
        category_id: values.category_id || null,
        description: values.description ?? '',
      });
      show({ tone: 'success', title: 'Product created' });
      navigate(`/products/${res.data.id}/edit`);
    } catch (err) {
      show({ tone: 'error', title: 'Could not create product', description: err instanceof ApiError ? err.message : undefined });
    }
  }

  return (
    <div>
      <PageMeta title="New product" noIndex />
      <Link to="/products" className="inline-flex items-center gap-1 text-sm text-muted hover:text-accent">
        <ChevronLeft className="h-4 w-4" /> Back to products
      </Link>
      <h1 className="mt-3 font-serif text-3xl text-text">New product</h1>

      <div className="mt-6 max-w-2xl border border-border bg-white p-6">
        {isLoading ? (
          <Spinner />
        ) : (
          <ProductForm
            categories={categoriesRes?.data ?? []}
            isSubmitting={createProduct.isPending}
            onSubmit={handleSubmit}
            submitLabel="Create product"
          />
        )}
      </div>
    </div>
  );
}

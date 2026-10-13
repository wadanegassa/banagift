import { useState, type FormEvent } from 'react';
import { Plus } from 'lucide-react';
import { PageMeta } from '@/components/ui/PageMeta';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAdminCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/hooks/useAdmin';
import { useToast } from '@/components/ui/Toast';
import { slugify } from '@/lib/format';
import { ApiError } from '@/types/api';
import type { Category } from '@/types/models';

interface CategoryFormState {
  name: string;
  slug: string;
  description: string;
  is_active: boolean;
}

const emptyForm: CategoryFormState = { name: '', slug: '', description: '', is_active: true };

export function Categories() {
  const { data, isLoading, isError, refetch } = useAdminCategories();

  const [modalState, setModalState] = useState<{ mode: 'create' | 'edit'; category?: Category } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  return (
    <div>
      <PageMeta title="Categories" noIndex />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-serif text-3xl text-text">Categories</h1>
        <Button className="flex items-center gap-2" onClick={() => setModalState({ mode: 'create' })}>
          <Plus className="h-4 w-4" /> Add category
        </Button>
      </div>

      <div className="mt-6 border border-border bg-white">
        {isError ? (
          <div className="p-6">
            <ErrorState message="Couldn't load categories." onRetry={() => refetch()} />
          </div>
        ) : isLoading ? (
          <Spinner />
        ) : (data?.data ?? []).length === 0 ? (
          <div className="p-6">
            <EmptyState title="No categories yet" description="Add your first category." />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Slug</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(data?.data ?? []).map((category) => (
                <tr key={category.id} className="border-b border-border last:border-b-0 hover:bg-surface/60">
                  <td className="px-5 py-3 font-medium text-text">{category.name}</td>
                  <td className="px-5 py-3 text-muted">{category.slug}</td>
                  <td className="px-5 py-3">
                    <Badge tone={category.is_active ? 'success' : 'neutral'}>
                      {category.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => setModalState({ mode: 'edit', category })}>
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(category)}>
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalState && (
        <CategoryModal
          mode={modalState.mode}
          category={modalState.category}
          onClose={() => setModalState(null)}
        />
      )}

      <DeleteCategoryDialog category={deleteTarget} onClose={() => setDeleteTarget(null)} />
    </div>
  );
}

function CategoryModal({
  mode,
  category,
  onClose,
}: {
  mode: 'create' | 'edit';
  category?: Category;
  onClose: () => void;
}) {
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory(category?.id ?? '');
  const { show } = useToast();
  const [form, setForm] = useState<CategoryFormState>(
    category
      ? { name: category.name, slug: category.slug, description: category.description ?? '', is_active: category.is_active }
      : emptyForm,
  );
  const [slugTouched, setSlugTouched] = useState(Boolean(category));

  const isSubmitting = createCategory.isPending || updateCategory.isPending;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      description: form.description.trim() || null,
      is_active: form.is_active,
    };
    try {
      if (mode === 'create') {
        await createCategory.mutateAsync(payload);
        show({ tone: 'success', title: 'Category created' });
      } else {
        await updateCategory.mutateAsync(payload);
        show({ tone: 'success', title: 'Category updated' });
      }
      onClose();
    } catch (err) {
      show({ tone: 'error', title: 'Could not save category', description: err instanceof ApiError ? err.message : undefined });
    }
  }

  return (
    <Modal isOpen onClose={onClose} title={mode === 'create' ? 'Add category' : 'Edit category'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="cat-name" required>
            Name
          </Label>
          <Input
            id="cat-name"
            value={form.name}
            onChange={(e) => {
              const name = e.target.value;
              setForm((f) => ({ ...f, name, slug: slugTouched ? f.slug : slugify(name) }));
            }}
            required
          />
        </div>
        <div>
          <Label htmlFor="cat-slug" required>
            Slug
          </Label>
          <Input
            id="cat-slug"
            value={form.slug}
            onChange={(e) => {
              setSlugTouched(true);
              setForm((f) => ({ ...f, slug: e.target.value }));
            }}
            required
          />
        </div>
        <div>
          <Label htmlFor="cat-description">Description</Label>
          <Textarea
            id="cat-description"
            rows={3}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-text">
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={form.is_active}
            onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
          />
          Active (visible on storefront)
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {mode === 'create' ? 'Create' : 'Save changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function DeleteCategoryDialog({ category, onClose }: { category: Category | null; onClose: () => void }) {
  const deleteCategory = useDeleteCategory();
  const { show } = useToast();

  async function handleConfirm() {
    if (!category) return;
    try {
      await deleteCategory.mutateAsync(category.id);
      show({ tone: 'success', title: 'Category deleted' });
      onClose();
    } catch (err) {
      show({ tone: 'error', title: 'Could not delete category', description: err instanceof ApiError ? err.message : undefined });
    }
  }

  return (
    <ConfirmDialog
      isOpen={category !== null}
      title={`Delete "${category?.name}"?`}
      description="Products in this category will become uncategorized."
      confirmLabel="Delete"
      tone="danger"
      isLoading={deleteCategory.isPending}
      onConfirm={handleConfirm}
      onCancel={onClose}
    />
  );
}

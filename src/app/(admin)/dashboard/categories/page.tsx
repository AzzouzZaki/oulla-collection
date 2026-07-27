'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Category {
  id: number;
  name: string;
  slug: string;
  created_at: string;
}

export default function CategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  // Form State
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: '', slug: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Delete State
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/categories');
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch categories');
      const data = await res.json();
      setCategories(data.data);
    } catch (err) {
      showToast((err as Error).message || 'Something went wrong. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    if (!editingCategory) {
      // Auto-generate slug on Add
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      setFormData({ name, slug });
    } else {
      setFormData({ ...formData, name });
    }
  };

  const openAddModal = () => {
    setEditingCategory(null);
    setFormData({ name: '', slug: '' });
    setIsFormModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setFormData({ name: cat.name, slug: cat.slug });
    setIsFormModalOpen(true);
  };

  const closeFormModal = () => {
    setIsFormModalOpen(false);
    setEditingCategory(null);
  };

  const openDeleteModal = (id: number) => {
    setDeletingId(id);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeletingId(null);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const url = editingCategory ? `/api/categories/${editingCategory.id}` : '/api/categories';
      const method = editingCategory ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save category');

      showToast(`Category ${editingCategory ? 'updated' : 'created'} successfully`, 'success');
      closeFormModal();
      fetchCategories();
    } catch (err) {
      showToast((err as Error).message || 'Something went wrong. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/categories/${deletingId}`, { method: 'DELETE' });
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete category');

      showToast('Category deleted successfully', 'success');
      closeDeleteModal();
      fetchCategories();
    } catch (err) {
      showToast((err as Error).message || 'Something went wrong. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categoryToDelete = categories.find(c => c.id === deletingId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[#111827]">Categories</h1>
        <button
          onClick={openAddModal}
          className="bg-[#18181B] text-white rounded-[6px] px-4 py-2 text-sm font-medium hover:opacity-80"
        >
          Add category
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[8px] border border-[#E5E7EB] w-full overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-[#F8F9FA] text-[#6B7280] text-xs font-semibold uppercase tracking-wide">
              <th className="px-6 py-4 border-b border-[#E5E7EB]">Name</th>
              <th className="px-6 py-4 border-b border-[#E5E7EB]">Slug</th>
              <th className="px-6 py-4 border-b border-[#E5E7EB]">Created</th>
              <th className="px-6 py-4 border-b border-[#E5E7EB] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm text-[#111827]">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-t border-[#E5E7EB]">
                  <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded animate-pulse w-16 ml-auto"></div></td>
                </tr>
              ))
            ) : categories.length === 0 ? (
              <tr className="border-t border-[#E5E7EB]">
                <td colSpan={4} className="px-6 py-8 text-center text-[#6B7280]">
                  No categories found.
                </td>
              </tr>
            ) : (
              categories.map((cat) => (
                <tr key={cat.id} className="border-t border-[#E5E7EB] hover:bg-[#F8F9FA]">
                  <td className="px-6 py-4 font-medium">{cat.name}</td>
                  <td className="px-6 py-4 text-[#6B7280] font-mono text-xs">{cat.slug}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-[#6B7280]">
                    {new Date(cat.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => openEditModal(cat)}
                      className="border border-[#E5E7EB] text-[#111827] rounded-[6px] px-3 py-1.5 text-sm font-medium hover:bg-[#F8F9FA] mr-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => openDeleteModal(cat.id)}
                      className="border border-[#E5E7EB] text-[#EF4444] rounded-[6px] px-3 py-1.5 text-sm font-medium hover:bg-[#F8F9FA]"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Form Modal */}
      {isFormModalOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center"
          onClick={closeFormModal}
        >
          <div 
            className="bg-white rounded-[8px] w-full max-w-lg mx-4 p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold mb-4">{editingCategory ? 'Edit Category' : 'Add Category'}</h2>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleNameChange}
                  className="w-full border border-[#E5E7EB] rounded-[6px] px-3 py-2 text-sm text-[#111827] outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-1">Slug</label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full border border-[#E5E7EB] rounded-[6px] px-3 py-2 text-sm text-[#111827] outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1]"
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={closeFormModal}
                  className="border border-[#E5E7EB] text-[#111827] rounded-[6px] px-4 py-2 text-sm font-medium hover:bg-[#F8F9FA]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#18181B] text-white rounded-[6px] px-4 py-2 text-sm font-medium hover:opacity-80 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center"
          onClick={closeDeleteModal}
        >
          <div 
            className="bg-white rounded-[8px] w-full max-w-sm mx-4 p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold mb-2">Delete Category</h2>
            <p className="text-sm text-[#6B7280] mb-6">
              Delete {categoryToDelete?.name}? Products in this category will not be deleted.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={closeDeleteModal}
                className="border border-[#E5E7EB] text-[#111827] rounded-[6px] px-4 py-2 text-sm font-medium hover:bg-[#F8F9FA]"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isSubmitting}
                className="bg-[#EF4444] text-white rounded-[6px] px-4 py-2 text-sm font-medium hover:opacity-80 disabled:opacity-50"
              >
                {isSubmitting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-4 right-4 bg-white shadow-lg rounded-md border-l-4 p-4 min-w-[300px] flex items-center justify-between animate-fade-in-up z-50
          ${toast.type === 'success' ? 'border-green-500' : 'border-red-500'}`}
        >
          <p className="text-[#111827] text-sm font-medium">{toast.message}</p>
          <button onClick={() => setToast(null)} className="text-gray-400 hover:text-gray-600 ml-4">
            ×
          </button>
        </div>
      )}
    </div>
  );
}

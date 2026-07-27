'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import dynamic from 'next/dynamic';

const ImageViewer = dynamic(() => import('@/components/shared/ImageViewer'), { ssr: false });
const ImageCropper = dynamic(() => import('@/components/admin/ImageCropper'), { ssr: false });

interface Category {
  id: number;
  name: string;
}

interface ProductImage {
  url: string;
  is_primary: boolean;
  order: number;
  public_id?: string;
}

interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  category_id: number | null;
  stock: number;
  is_available: boolean;
  colors?: string[];
  sizes?: string[];
  fabric?: string | null;
  images?: ProductImage[];
  category?: Category;
}

interface PaginatedProducts {
  data: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function ProductsPage() {
  const router = useRouter();
  
  // Data State
  const [productsData, setProductsData] = useState<PaginatedProducts | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const limit = 12;

  // Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Image Viewer State
  const [fullScreenImage, setFullScreenImage] = useState<{ src: string; alt: string } | null>(null);

  // Image Cropper State
  const [cropPreviewUrl, setCropPreviewUrl] = useState<string | null>(null);
  
  // Form State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    category_id: '' as string | number,
    stock: 0,
    is_available: true,
    colors: [] as string[],
    sizes: [] as string[],
    fabric: '' as string | null,
  });
  const [formImages, setFormImages] = useState<ProductImage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const [colorInput, setColorInput] = useState('');
  const [sizeInput, setSizeInput] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete State
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchProducts = async (page: number) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/products?page=${page}&limit=${limit}`);
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch products');
      const data = await res.json();
      setProductsData(data);
    } catch (err) {
      showToast((err as Error).message || 'Something went wrong. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch categories', err);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProducts(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCategories();
  }, []);

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      price: 0,
      category_id: '',
      stock: 0,
      is_available: true,
      colors: [],
      sizes: [],
      fabric: '',
    });
    setFormImages([]);
    setIsFormModalOpen(true);
  };

  const openEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setFormData({
      name: prod.name,
      description: prod.description || '',
      price: prod.price,
      category_id: prod.category_id || '',
      stock: prod.stock,
      is_available: prod.is_available,
      colors: prod.colors || [],
      sizes: prod.sizes || [],
      fabric: prod.fabric || '',
    });
    setFormImages(prod.images ? [...prod.images] : []);
    setIsFormModalOpen(true);
  };

  const closeFormModal = () => {
    setIsFormModalOpen(false);
    setEditingProduct(null);
  };

  const openDeleteModal = (id: number) => {
    setDeletingId(id);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeletingId(null);
  };

  // Step 1: File selected → open cropper
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setCropPreviewUrl(objectUrl);
    // Reset input so same file can be selected again if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Step 2: Crop confirmed → upload blob to Cloudinary
  const uploadCroppedBlob = useCallback(async (blob: Blob) => {
    setCropPreviewUrl(null);
    setUploadingImage(true);
    try {
      const formDataObj = new FormData();
      formDataObj.append('file', blob, 'cropped.jpg');
      
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formDataObj,
      });

      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload image');
      
      const newImage: ProductImage = {
        url: data.url,
        public_id: data.public_id,
        is_primary: formImages.length === 0,
        order: formImages.length,
      };
      
      setFormImages(prev => [...prev, newImage]);
      showToast('Image ajoutée avec succès', 'success');
    } catch (err) {
      showToast((err as Error).message || 'Image upload failed', 'error');
    } finally {
      setUploadingImage(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formImages.length]);

  const removeImage = (indexToRemove: number) => {
    setFormImages(prev => {
      const newImages = prev.filter((_, idx) => idx !== indexToRemove);
      // Ensure there's a primary image if there are any left
      if (newImages.length > 0 && !newImages.some(img => img.is_primary)) {
        newImages[0].is_primary = true;
      }
      // Reset order
      return newImages.map((img, idx) => ({ ...img, order: idx }));
    });
  };

  const makePrimaryImage = (primaryIndex: number) => {
    setFormImages(prev =>
      prev.map((img, idx) => ({
        ...img,
        is_primary: idx === primaryIndex,
      }))
    );
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        category_id: formData.category_id === '' ? null : Number(formData.category_id),
        images: formImages.map((img, idx) => ({
          ...img,
          is_primary: formImages.some(image => image.is_primary) ? img.is_primary : idx === 0,
          order: idx,
        })),
      };

      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save product');

      showToast(`Product ${editingProduct ? 'updated' : 'created'} successfully`, 'success');
      closeFormModal();
      fetchProducts(currentPage);
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
      const res = await fetch(`/api/products/${deletingId}`, { method: 'DELETE' });
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete product');

      showToast('Product deleted successfully', 'success');
      closeDeleteModal();
      
      // If deleting the last item on the page, go to previous page if possible
      if (productsData?.data.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      } else {
        fetchProducts(currentPage);
      }
    } catch (err) {
      showToast((err as Error).message || 'Something went wrong. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const productToDelete = productsData?.data.find(p => p.id === deletingId);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[#111827]">Products</h1>
        <div className="flex items-center space-x-4">
          {/* View Toggle */}
          <div className="flex bg-[#F8F9FA] rounded-[6px] border border-[#E5E7EB] p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-[4px] ${viewMode === 'table' ? 'bg-white shadow-sm text-[#111827]' : 'text-[#6B7280] hover:text-[#111827]'}`}
              title="Table view"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-[4px] ${viewMode === 'grid' ? 'bg-white shadow-sm text-[#111827]' : 'text-[#6B7280] hover:text-[#111827]'}`}
              title="Grid view"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
            </button>
          </div>
          <button
            onClick={openAddModal}
            className="bg-[#18181B] text-white rounded-[6px] px-4 py-2 text-sm font-medium hover:opacity-80"
          >
            Add product
          </button>
        </div>
      </div>

      {/* Content Area */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-[8px] border border-[#E5E7EB] w-full overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-[#F8F9FA] text-[#6B7280] text-xs font-semibold uppercase tracking-wide">
              <th className="px-6 py-4 border-b border-[#E5E7EB]">Image</th>
              <th className="px-6 py-4 border-b border-[#E5E7EB]">Name</th>
              <th className="px-6 py-4 border-b border-[#E5E7EB]">Category</th>
              <th className="px-6 py-4 border-b border-[#E5E7EB]">Price</th>
              <th className="px-6 py-4 border-b border-[#E5E7EB]">Stock</th>
              <th className="px-6 py-4 border-b border-[#E5E7EB]">Available</th>
              <th className="px-6 py-4 border-b border-[#E5E7EB] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm text-[#111827]">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-t border-[#E5E7EB]">
                  <td className="px-6 py-4"><div className="w-10 h-10 bg-gray-200 rounded animate-pulse"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded animate-pulse w-12"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded animate-pulse w-12"></div></td>
                  <td className="px-6 py-4"><div className="h-8 bg-gray-200 rounded animate-pulse w-24 ml-auto"></div></td>
                </tr>
              ))
            ) : productsData?.data.length === 0 ? (
              <tr className="border-t border-[#E5E7EB]">
                <td colSpan={7} className="px-6 py-8 text-center text-[#6B7280]">
                  No products found.
                </td>
              </tr>
            ) : (
              productsData?.data.map((prod) => {
                const primaryImage = prod.images?.find(img => img.is_primary) || prod.images?.[0];
                return (
                  <tr key={prod.id} className="border-t border-[#E5E7EB] hover:bg-[#F8F9FA]">
                    <td className="px-6 py-4">
                      {primaryImage ? (
                        <div
                          className="w-10 h-10 relative rounded overflow-hidden cursor-zoom-in"
                          onClick={() => setFullScreenImage({ src: primaryImage.url, alt: prod.name })}
                        >
                          <Image src={primaryImage.url} alt={prod.name} fill className="object-cover" sizes="40px" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">No img</div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium">{prod.name}</td>
                    <td className="px-6 py-4 text-[#6B7280]">{prod.category?.name || '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{prod.price} DZD</td>
                    <td className={`px-6 py-4 font-medium ${prod.stock <= 3 ? 'text-[#EF4444]' : ''}`}>
                      {prod.stock}
                    </td>
                    <td className="px-6 py-4">
                      {prod.is_available ? (
                        <span className="text-green-600 font-medium text-xs">Yes</span>
                      ) : (
                        <span className="text-[#6B7280] font-medium text-xs">No</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => openEditModal(prod)}
                        className="border border-[#E5E7EB] text-[#111827] rounded-[6px] px-3 py-1.5 text-sm font-medium hover:bg-[#F8F9FA] mr-2"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => openDeleteModal(prod.id)}
                        className="border border-[#E5E7EB] text-[#EF4444] rounded-[6px] px-3 py-1.5 text-sm font-medium hover:bg-[#F8F9FA]"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-[8px] border border-[#E5E7EB] overflow-hidden flex flex-col">
                <div className="w-full h-48 bg-gray-200 animate-pulse"></div>
                <div className="p-4 space-y-3">
                  <div className="h-5 bg-gray-200 rounded animate-pulse w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4"></div>
                </div>
              </div>
            ))
          ) : productsData?.data.length === 0 ? (
            <div className="col-span-full py-12 text-center text-[#6B7280] bg-white rounded-[8px] border border-[#E5E7EB]">
              No products found.
            </div>
          ) : (
            productsData?.data.map((prod) => {
              const primaryImage = prod.images?.find(img => img.is_primary) || prod.images?.[0];
              return (
                <div key={prod.id} className="bg-white rounded-[8px] border border-[#E5E7EB] overflow-hidden flex flex-col hover:shadow-sm transition-shadow">
                  <div
                    className={`w-full h-48 relative bg-gray-100 border-b border-[#E5E7EB] ${primaryImage ? 'cursor-zoom-in' : ''}`}
                    onClick={() => primaryImage && setFullScreenImage({ src: primaryImage.url, alt: prod.name })}
                  >
                    {primaryImage ? (
                      <Image src={primaryImage.url} alt={prod.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 300px" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">No image</div>
                    )}
                    {!prod.is_available && (
                      <div className="absolute top-2 right-2 bg-white/90 backdrop-blur text-[#6B7280] text-xs font-semibold px-2 py-1 rounded">
                        Unavailable
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-medium text-[#111827] truncate pr-2">{prod.name}</h3>
                      <span className="font-semibold whitespace-nowrap">{prod.price} DZD</span>
                    </div>
                    <p className="text-sm text-[#6B7280] mb-4">{prod.category?.name || '—'}</p>
                    
                    <div className="mt-auto flex items-center justify-between">
                      <span className={`text-sm font-medium ${prod.stock <= 3 ? 'text-[#EF4444]' : 'text-[#6B7280]'}`}>
                        Stock: {prod.stock}
                      </span>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openEditModal(prod)}
                          className="p-1.5 text-[#6B7280] hover:text-[#111827] hover:bg-[#F8F9FA] rounded-[4px] transition-colors"
                          title="Edit"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button
                          onClick={() => openDeleteModal(prod.id)}
                          className="p-1.5 text-[#6B7280] hover:text-[#EF4444] hover:bg-red-50 rounded-[4px] transition-colors"
                          title="Delete"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Pagination */}
      {productsData && productsData.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-[#6B7280]">
            Page {productsData.page} of {productsData.totalPages}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={productsData.page === 1}
              className="border border-[#E5E7EB] text-[#111827] rounded-[6px] px-4 py-2 text-sm font-medium hover:bg-[#F8F9FA] disabled:opacity-50 disabled:hover:bg-transparent"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(productsData.totalPages, p + 1))}
              disabled={productsData.page === productsData.totalPages}
              className="border border-[#E5E7EB] text-[#111827] rounded-[6px] px-4 py-2 text-sm font-medium hover:bg-[#F8F9FA] disabled:opacity-50 disabled:hover:bg-transparent"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {isFormModalOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center overflow-y-auto pt-10 pb-10"
          onClick={closeFormModal}
        >
          <div 
            className="bg-white rounded-[8px] w-full max-w-lg mx-4 p-6 shadow-lg my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold mb-4">{editingProduct ? 'Edit Product' : 'Add Product'}</h2>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-[#E5E7EB] rounded-[6px] px-3 py-2 text-sm text-[#111827] outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1]"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-1">Description (Optional)</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-[#E5E7EB] rounded-[6px] px-3 py-2 text-sm text-[#111827] outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-1">Price (DZD)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full border border-[#E5E7EB] rounded-[6px] px-3 py-2 text-sm text-[#111827] outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-1">Stock</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                    className="w-full border border-[#E5E7EB] rounded-[6px] px-3 py-2 text-sm text-[#111827] outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#111827] mb-1">Category</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full border border-[#E5E7EB] rounded-[6px] px-3 py-2 text-sm text-[#111827] outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] bg-white"
                >
                  <option value="">No category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-1">Colors (Press Enter to add)</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.colors.map(color => (
                      <span key={color} className="bg-[#F8F9FA] border border-[#E5E7EB] text-xs px-2 py-1 rounded flex items-center gap-1">
                        {color}
                        <button type="button" onClick={() => setFormData(prev => ({ ...prev, colors: prev.colors.filter(c => c !== color) }))} className="text-[#EF4444] hover:text-red-700">&times;</button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={colorInput}
                    onChange={(e) => setColorInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const val = colorInput.trim();
                        if (val && !formData.colors.includes(val)) {
                          setFormData(prev => ({ ...prev, colors: [...prev.colors, val] }));
                          setColorInput('');
                        }
                      }
                    }}
                    placeholder="e.g. Noir, Beige..."
                    className="w-full border border-[#E5E7EB] rounded-[6px] px-3 py-2 text-sm text-[#111827] outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-1">Sizes (Press Enter to add)</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.sizes.map(size => (
                      <span key={size} className="bg-[#F8F9FA] border border-[#E5E7EB] text-xs px-2 py-1 rounded flex items-center gap-1">
                        {size}
                        <button type="button" onClick={() => setFormData(prev => ({ ...prev, sizes: prev.sizes.filter(s => s !== size) }))} className="text-[#EF4444] hover:text-red-700">&times;</button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={sizeInput}
                    onChange={(e) => setSizeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const val = sizeInput.trim();
                        if (val && !formData.sizes.includes(val)) {
                          setFormData(prev => ({ ...prev, sizes: [...prev.sizes, val] }));
                          setSizeInput('');
                        }
                      }
                    }}
                    placeholder="e.g. S, M, L..."
                    className="w-full border border-[#E5E7EB] rounded-[6px] px-3 py-2 text-sm text-[#111827] outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#111827] mb-1">Fabric (Optional)</label>
                <input
                  type="text"
                  value={formData.fabric || ''}
                  onChange={(e) => setFormData({ ...formData, fabric: e.target.value })}
                  placeholder="e.g. Fine Silk, Premium Linen..."
                  className="w-full border border-[#E5E7EB] rounded-[6px] px-3 py-2 text-sm text-[#111827] outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1]"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_available"
                  checked={formData.is_available}
                  onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                  className="rounded border-[#E5E7EB] text-[#6366F1] focus:ring-[#6366F1]"
                />
                <label htmlFor="is_available" className="text-sm font-medium text-[#111827]">
                  Available for purchase
                </label>
              </div>

              {/* Images Section */}
              <div className="border-t border-[#E5E7EB] pt-4 mt-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-[#111827]">Images</label>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="text-sm text-[#6366F1] font-medium hover:underline disabled:opacity-50"
                  >
                    + Add image
                  </button>
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
                
                {uploadingImage && (
                  <div className="text-xs text-[#6B7280] mb-2 flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-[#6366F1]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uploading...
                  </div>
                )}

                <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1">
                  {formImages.length === 0 ? (
                    <p className="text-xs text-[#6B7280] italic">No images uploaded.</p>
                  ) : (
                    formImages.map((img, idx) => (
                      <div key={idx} className="flex items-center justify-between border border-[#E5E7EB] rounded-[6px] p-2 bg-[#F8F9FA]">
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-10 h-10 relative rounded overflow-hidden bg-white border border-[#E5E7EB] cursor-zoom-in"
                            onClick={() => setFullScreenImage({ src: img.url, alt: img.is_primary ? 'Image principale' : `Image ${idx + 1}` })}
                          >
                            <Image src={img.url} alt="preview" fill className="object-cover" sizes="40px" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-[#111827]">
                              {img.is_primary ? 'Image principale' : `Image ${idx + 1}`}
                            </span>
                            <span className="text-[10px] text-[#6B7280]">Cliquer pour agrandir</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => makePrimaryImage(idx)}
                            disabled={img.is_primary}
                            className="border border-[#E5E7EB] bg-white text-[#111827] rounded-[6px] px-2 py-1 text-xs font-medium hover:bg-[#F8F9FA] focus:outline-none focus:ring-2 focus:ring-[#6366F1]/30 disabled:border-[#D1FAE5] disabled:bg-[#ECFDF5] disabled:text-[#047857] disabled:hover:bg-[#ECFDF5]"
                          >
                            {img.is_primary ? 'Primary' : 'Make primary'}
                          </button>
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="text-[#EF4444] text-xs font-medium hover:underline px-2"
                          >
                            Supprimer
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={closeFormModal}
                  className="border border-[#E5E7EB] text-[#111827] rounded-[6px] px-4 py-2 text-sm font-medium hover:bg-[#F8F9FA]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || uploadingImage}
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
            <h2 className="text-xl font-semibold mb-2">Delete Product</h2>
            <p className="text-sm text-[#6B7280] mb-6">
              Delete {productToDelete?.name}? This cannot be undone.
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

      {/* Full-Screen Image Viewer */}
      {fullScreenImage && (
        <ImageViewer
          src={fullScreenImage.src}
          alt={fullScreenImage.alt}
          onClose={() => setFullScreenImage(null)}
        />
      )}

      {/* Image Crop Modal */}
      {cropPreviewUrl && (
        <ImageCropper
          src={cropPreviewUrl}
          onConfirm={(blob) => {
            URL.revokeObjectURL(cropPreviewUrl);
            uploadCroppedBlob(blob);
          }}
          onCancel={() => {
            URL.revokeObjectURL(cropPreviewUrl);
            setCropPreviewUrl(null);
          }}
        />
      )}
    </div>
  );
}

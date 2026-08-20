'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

interface OrderItem {
  id: number;
  order_id: number;
  product_id: number | null;
  product_name?: string;
  quantity: number;
  unit_price: number;
  color?: string;
  size?: string;
}

interface Order {
  id: number;
  customer_name: string;
  customer_phone: string;
  customer_instagram: string | null;
  customer_address: string;
  wilaya: string;
  total_price: number;
  status: OrderStatus;
  notes: string | null;
  created_at: string;
  items?: OrderItem[];
}

interface PaginatedOrders {
  data: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const getStatusColor = (status: OrderStatus) => {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'confirmed': return 'bg-blue-100 text-blue-800';
    case 'shipped': return 'bg-indigo-100 text-indigo-800';
    case 'delivered': return 'bg-green-100 text-green-800';
    case 'cancelled': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export default function OrdersPage() {
  const router = useRouter();

  // Data State
  const [ordersData, setOrdersData] = useState<PaginatedOrders | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Filter & Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    status: '',
    from: '',
    to: ''
  });
  const limit = 12;

  // Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Modal State
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [orderDetail, setOrderDetail] = useState<Order | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState<OrderStatus | ''>('');

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchOrders = async (page: number, currentFilters: typeof filters) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (currentFilters.status) queryParams.append('status', currentFilters.status);
      if (currentFilters.from) queryParams.append('from', currentFilters.from);
      if (currentFilters.to) queryParams.append('to', currentFilters.to);

      const res = await fetch(`/api/orders?${queryParams.toString()}`);
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch orders');
      const data = await res.json();
      setOrdersData(data);
    } catch (err) {
      showToast((err as Error).message || 'Something went wrong. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch when page or filters change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrders(currentPage, filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, filters]);

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to page 1 on filter change
  };

  const resetFilters = () => {
    setFilters({ status: '', from: '', to: '' });
    setCurrentPage(1);
  };

  const openOrderModal = async (id: number) => {
    setSelectedOrderId(id);
    setLoadingDetail(true);
    setOrderDetail(null);
    setNewStatus('');
    try {
      const res = await fetch(`/api/orders/${id}`);
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch order details');
      const data = await res.json();
      setOrderDetail(data);
      setNewStatus(data.status);
    } catch (err) {
      showToast((err as Error).message || 'Something went wrong.', 'error');
      closeOrderModal();
    } finally {
      setLoadingDetail(false);
    }
  };

  const closeOrderModal = () => {
    setSelectedOrderId(null);
    setOrderDetail(null);
  };

  const handleStatusUpdate = async () => {
    if (!orderDetail || !newStatus || newStatus === orderDetail.status) return;

    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/orders/${orderDetail.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update status');

      showToast('Status updated successfully', 'success');
      
      // Update modal state
      setOrderDetail(prev => prev ? { ...prev, status: newStatus as OrderStatus } : null);
      
      // Update table state without full re-fetch
      setOrdersData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          data: prev.data.map(o => o.id === orderDetail.id ? { ...o, status: newStatus as OrderStatus } : o)
        };
      });
    } catch (err) {
      showToast((err as Error).message || 'Something went wrong. Please try again.', 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const renderStockWarning = () => {
    if (!orderDetail || !newStatus) return null;
    
    if (orderDetail.status === 'confirmed' && newStatus === 'shipped') {
      return <p className="text-xs text-[#6B7280] mt-1">Changing to Shipped will decrement stock for all items.</p>;
    }
    
    if (orderDetail.status === 'shipped' && newStatus === 'cancelled') {
      return <p className="text-xs text-[#6B7280] mt-1">Changing to Cancelled will restore stock for all items.</p>;
    }
    
    return null;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[#111827]">Orders</h1>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-[8px] border border-[#E5E7EB]">
        <div>
          <label className="block text-xs font-medium text-[#6B7280] mb-1">Status</label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="border border-[#E5E7EB] rounded-[6px] px-3 py-1.5 text-sm text-[#111827] outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] bg-white min-w-[150px]"
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        
        <div>
          <label className="block text-xs font-medium text-[#6B7280] mb-1">Date from</label>
          <input
            type="date"
            value={filters.from}
            onChange={(e) => handleFilterChange('from', e.target.value)}
            className="border border-[#E5E7EB] rounded-[6px] px-3 py-1.5 text-sm text-[#111827] outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1]"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#6B7280] mb-1">Date to</label>
          <input
            type="date"
            value={filters.to}
            onChange={(e) => handleFilterChange('to', e.target.value)}
            className="border border-[#E5E7EB] rounded-[6px] px-3 py-1.5 text-sm text-[#111827] outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1]"
          />
        </div>

        <div className="mt-5">
          <button
            onClick={resetFilters}
            className="border border-[#E5E7EB] text-[#111827] rounded-[6px] px-4 py-1.5 text-sm font-medium hover:bg-[#F8F9FA]"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[8px] border border-[#E5E7EB] w-full overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-[#F8F9FA] text-[#6B7280] text-xs font-semibold uppercase tracking-wide">
              <th className="px-6 py-4 border-b border-[#E5E7EB]">ID</th>
              <th className="px-6 py-4 border-b border-[#E5E7EB]">Customer</th>
              <th className="px-6 py-4 border-b border-[#E5E7EB]">Wilaya</th>
              <th className="px-6 py-4 border-b border-[#E5E7EB]">Total</th>
              <th className="px-6 py-4 border-b border-[#E5E7EB]">Status</th>
              <th className="px-6 py-4 border-b border-[#E5E7EB]">Date</th>
              <th className="px-6 py-4 border-b border-[#E5E7EB] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm text-[#111827]">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-t border-[#E5E7EB]">
                  <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded animate-pulse w-8"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div></td>
                  <td className="px-6 py-4"><div className="h-6 bg-gray-200 rounded-full animate-pulse w-20"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div></td>
                  <td className="px-6 py-4"><div className="h-8 bg-gray-200 rounded animate-pulse w-16 ml-auto"></div></td>
                </tr>
              ))
            ) : ordersData?.data.length === 0 ? (
              <tr className="border-t border-[#E5E7EB]">
                <td colSpan={7} className="px-6 py-8 text-center text-[#6B7280]">
                  No orders found.
                </td>
              </tr>
            ) : (
              ordersData?.data.map((order) => (
                <tr key={order.id} className="border-t border-[#E5E7EB] hover:bg-[#F8F9FA]">
                  <td className="px-6 py-4 text-[#6B7280] font-mono text-xs">#{order.id}</td>
                  <td className="px-6 py-4 font-medium">{order.customer_name}</td>
                  <td className="px-6 py-4 text-[#6B7280]">{order.wilaya}</td>
                  <td className="px-6 py-4 font-medium">{order.total_price} DZD</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[#6B7280] whitespace-nowrap">
                    {new Date(order.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => openOrderModal(order.id)}
                      className="border border-[#E5E7EB] text-[#111827] rounded-[6px] px-3 py-1.5 text-sm font-medium hover:bg-[#F8F9FA]"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {ordersData && ordersData.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-[#6B7280]">
            Page {ordersData.page} of {ordersData.totalPages}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={ordersData.page === 1}
              className="border border-[#E5E7EB] text-[#111827] rounded-[6px] px-4 py-2 text-sm font-medium hover:bg-[#F8F9FA] disabled:opacity-50 disabled:hover:bg-transparent"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(ordersData.totalPages, p + 1))}
              disabled={ordersData.page === ordersData.totalPages}
              className="border border-[#E5E7EB] text-[#111827] rounded-[6px] px-4 py-2 text-sm font-medium hover:bg-[#F8F9FA] disabled:opacity-50 disabled:hover:bg-transparent"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrderId && (
        <div 
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center overflow-y-auto py-10"
          onClick={closeOrderModal}
        >
          <div 
            className="bg-white rounded-[8px] w-full max-w-2xl mx-4 p-6 shadow-lg my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-xl font-semibold">Order #{selectedOrderId}</h2>
              <button onClick={closeOrderModal} className="text-gray-400 hover:text-gray-600">×</button>
            </div>

            {loadingDetail ? (
              <div className="py-12 flex justify-center">
                <svg className="animate-spin h-8 w-8 text-[#6366F1]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : orderDetail ? (
              <div className="space-y-8">
                {/* Section 1 - Customer info */}
                <div>
                  <h3 className="text-sm font-semibold text-[#6B7280] uppercase tracking-wide mb-3">Customer Information</h3>
                  <div className="bg-[#F8F9FA] rounded-[8px] p-4 border border-[#E5E7EB] grid grid-cols-2 gap-4 text-sm text-[#111827]">
                    <div>
                      <span className="text-[#6B7280] block mb-1">Name</span>
                      <span className="font-medium">{orderDetail.customer_name}</span>
                    </div>
                    <div>
                      <span className="text-[#6B7280] block mb-1">Phone</span>
                      <span className="font-medium">{orderDetail.customer_phone}</span>
                    </div>
                    {orderDetail.customer_instagram && (
                      <div>
                        <span className="text-[#6B7280] block mb-1">Instagram</span>
                        <span className="font-medium">{orderDetail.customer_instagram}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-[#6B7280] block mb-1">Location</span>
                      <span className="font-medium">{orderDetail.wilaya}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[#6B7280] block mb-1">Address</span>
                      <span className="font-medium">{orderDetail.customer_address}</span>
                    </div>
                    {orderDetail.notes && (
                      <div className="col-span-2">
                        <span className="text-[#6B7280] block mb-1">Notes</span>
                        <span className="font-medium">{orderDetail.notes}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section 2 - Order items */}
                <div>
                  <h3 className="text-sm font-semibold text-[#6B7280] uppercase tracking-wide mb-3">Order Items</h3>
                  <div className="border border-[#E5E7EB] rounded-[8px] overflow-hidden">
                    <table className="w-full text-left text-sm text-[#111827]">
                      <thead className="bg-[#F8F9FA] border-b border-[#E5E7EB]">
                        <tr>
                          <th className="px-4 py-2 font-medium">Product</th>
                          <th className="px-4 py-2 font-medium text-right">Qty</th>
                          <th className="px-4 py-2 font-medium text-right">Unit Price</th>
                          <th className="px-4 py-2 font-medium text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5E7EB]">
                        {orderDetail.items?.map(item => (
                          <tr key={item.id}>
                            <td className="px-4 py-3">
                              <div>{item.product_name || 'Product deleted'}</div>
                              {(item.color || item.size) && (
                                <div className="text-xs text-[#6B7280] mt-0.5">
                                  {item.color || '—'} / {item.size || '—'}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">{item.quantity}</td>
                            <td className="px-4 py-3 text-right">{item.unit_price} DZD</td>
                            <td className="px-4 py-3 text-right font-medium">{item.unit_price * item.quantity} DZD</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Section 3 - Order summary */}
                <div className="flex justify-between items-center border-t border-[#E5E7EB] pt-4">
                  <div className="text-sm text-[#6B7280]">
                    Placed on: {new Date(orderDetail.created_at).toLocaleString()}
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-[#6B7280] mr-4">Total Amount:</span>
                    <span className="text-lg font-semibold text-[#111827]">{orderDetail.total_price} DZD</span>
                  </div>
                </div>

                {/* Section 4 - Status update */}
                <div className="bg-[#F8F9FA] rounded-[8px] p-4 border border-[#E5E7EB]">
                  <h3 className="text-sm font-semibold text-[#6B7280] uppercase tracking-wide mb-3">Update Status</h3>
                  <div className="flex items-end gap-4">
                    <div className="flex-1">
                      <label className="block text-xs text-[#6B7280] mb-1">
                        Current: <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ml-1 ${getStatusColor(orderDetail.status)}`}>{orderDetail.status}</span>
                      </label>
                      <select
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                        className="w-full border border-[#E5E7EB] rounded-[6px] px-3 py-2 text-sm text-[#111827] outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] bg-white"
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                    <button
                      onClick={handleStatusUpdate}
                      disabled={updatingStatus || newStatus === orderDetail.status || !newStatus}
                      className="bg-[#18181B] text-white rounded-[6px] px-4 py-2 text-sm font-medium hover:opacity-80 disabled:opacity-50"
                    >
                      {updatingStatus ? 'Updating...' : 'Update status'}
                    </button>
                  </div>
                  {renderStockWarning()}
                </div>
              </div>
            ) : (
              <p className="text-center text-[#6B7280] py-8">Failed to load order detail.</p>
            )}
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

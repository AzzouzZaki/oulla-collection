'use client';

import { useState, useEffect } from 'react';
import type { Order, Product, OrderStatus } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface StatsData {
  totalOrders: number;
  pendingOrders: number;
  totalProducts: number;
  lowStockProducts: number;
}

interface RecentOrder {
  id: number;
  customer_name: string;
  wilaya: string;
  total_price: number;
  status: OrderStatus;
  created_at: string;
}

// ─── Status badge config ──────────────────────────────────────────────────────

const statusStyles: Record<OrderStatus, string> = {
  pending: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  confirmed: 'bg-blue-50 text-blue-700 border border-blue-200',
  shipped: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
  delivered: 'bg-green-50 text-green-700 border border-green-200',
  cancelled: 'bg-red-50 text-red-700 border border-red-200',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-[8px] border border-[#E5E7EB] p-5 animate-pulse">
      <div className="h-3.5 w-24 bg-[#E5E7EB] rounded mb-3" />
      <div className="h-8 w-16 bg-[#E5E7EB] rounded" />
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-12 bg-[#E5E7EB] rounded" />
      ))}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number | null;
  accent?: boolean;
}

function StatCard({ label, value, accent = false }: StatCardProps) {
  return (
    <div className="bg-white rounded-[8px] border border-[#E5E7EB] p-5">
      <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide mb-2">
        {label}
      </p>
      <p
        className={`text-3xl font-semibold ${
          accent ? 'text-[#6366F1]' : 'text-[#111827]'
        }`}
      >
        {value ?? '—'}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-[4px] text-xs font-medium ${statusStyles[status]}`}
    >
      {status}
    </span>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[] | null>(null);
  const [statsError, setStatsError] = useState(false);
  const [ordersError, setOrdersError] = useState(false);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [totalOrdersRes, pendingOrdersRes, productsRes] =
          await Promise.all([
            fetch('/api/orders?limit=1'),
            fetch('/api/orders?status=pending&limit=1'),
            fetch('/api/products?page=1&limit=1'),
          ]);

        if (!totalOrdersRes.ok || !pendingOrdersRes.ok || !productsRes.ok) {
          setStatsError(true);
          return;
        }

        const [totalOrdersData, pendingOrdersData, productsData] =
          await Promise.all([
            totalOrdersRes.json() as Promise<{ total: number }>,
            pendingOrdersRes.json() as Promise<{ total: number }>,
            productsRes.json() as Promise<{ total: number }>,
          ]);

        // Fetch all products to count low stock client-side
        const allProductsRes = await fetch('/api/products');
        if (!allProductsRes.ok) {
          setStatsError(true);
          return;
        }
        const allProductsData = (await allProductsRes.json()) as {
          data: Product[];
        };
        const lowStock = allProductsData.data.filter(
          (p) => p.stock <= 3
        ).length;

        setStats({
          totalOrders: totalOrdersData.total,
          pendingOrders: pendingOrdersData.total,
          totalProducts: productsData.total,
          lowStockProducts: lowStock,
        });
      } catch {
        setStatsError(true);
      }
    }

    async function fetchRecentOrders() {
      try {
        const res = await fetch('/api/orders?limit=5');
        if (!res.ok) {
          setOrdersError(true);
          return;
        }
        const data = (await res.json()) as { data: Order[] };
        setRecentOrders(
          data.data.map((o) => ({
            id: o.id,
            customer_name: o.customer_name,
            wilaya: o.wilaya,
            total_price: o.total_price,
            status: o.status,
            created_at: o.created_at,
          }))
        );
      } catch {
        setOrdersError(true);
      }
    }

    fetchStats();
    fetchRecentOrders();
  }, []);

  const statsLoading = stats === null && !statsError;
  const ordersLoading = recentOrders === null && !ordersError;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Page heading */}
      <h1 className="text-xl font-semibold text-[#111827] mb-6">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statsLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : statsError ? (
          <p className="col-span-4 text-sm text-[#6B7280]">
            Could not load stats.
          </p>
        ) : (
          <>
            <StatCard label="Total orders" value={stats!.totalOrders} />
            <StatCard
              label="Pending orders"
              value={stats!.pendingOrders}
              accent
            />
            <StatCard label="Total products" value={stats!.totalProducts} />
            <StatCard
              label="Low stock"
              value={stats!.lowStockProducts}
            />
          </>
        )}
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-[8px] border border-[#E5E7EB]">
        <div className="px-5 py-4 border-b border-[#E5E7EB]">
          <h2 className="text-sm font-semibold text-[#111827]">
            Recent orders
          </h2>
        </div>

        {ordersLoading ? (
          <div className="p-5">
            <TableSkeleton />
          </div>
        ) : ordersError ? (
          <p className="px-5 py-8 text-sm text-[#6B7280] text-center">
            Could not load orders.
          </p>
        ) : recentOrders!.length === 0 ? (
          <p className="px-5 py-8 text-sm text-[#6B7280] text-center">
            No orders yet
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E5E7EB]">
                  {[
                    'Order ID',
                    'Customer',
                    'Wilaya',
                    'Total',
                    'Status',
                    'Date',
                  ].map((col) => (
                    <th
                      key={col}
                      className="px-5 py-3 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wide whitespace-nowrap"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentOrders!.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-[#E5E7EB] last:border-0 hover:bg-[#F8F9FA] transition-colors"
                  >
                    <td className="px-5 py-3.5 font-medium text-[#111827]">
                      #{order.id}
                    </td>
                    <td className="px-5 py-3.5 text-[#111827]">
                      {order.customer_name}
                    </td>
                    <td className="px-5 py-3.5 text-[#6B7280]">
                      {order.wilaya}
                    </td>
                    <td className="px-5 py-3.5 text-[#111827] whitespace-nowrap">
                      {Number(order.total_price).toLocaleString('fr-DZ')} DA
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-5 py-3.5 text-[#6B7280] whitespace-nowrap">
                      {new Date(order.created_at).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// TODO: implement
import React from 'react';

export default function AdminOrdersPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Admin Orders Management</h1>
      </div>
      
      {/* Search and Filters */}
      <div className="flex gap-4 p-4 bg-white rounded border border-gray-200">
        <input 
          type="text" 
          placeholder="Search orders (by name, phone)..." 
          className="flex-1 px-3 py-2 border rounded"
        />
        <select className="px-3 py-2 border rounded">
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <button className="px-4 py-2 bg-blue-600 text-white rounded">Search</button>
      </div>

      {/* Orders List Table Placeholder */}
      <div className="bg-white rounded border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">#1001</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Jane Doe</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">0550123456</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                  pending
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-950">4,500.00 DZD</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 hover:text-blue-900 cursor-pointer">
                View
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

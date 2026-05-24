'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Loader2, Filter, Eye, AlertCircle, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';

import { useAuth } from '@/context/AuthContext';
import type { Order, OrderStatus } from '@/types';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // Route Protection
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.replace('/');
    }
  }, [user, authLoading, router]);

  const fetchOrders = async (signal?: AbortSignal) => {
    try {
      const res = await fetch('/api/admin/orders', { signal });
      if (!res.ok) throw new Error('Failed to fetch orders');
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        toast.error('Could not load orders');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    const controller = new AbortController();
    fetchOrders(controller.signal);
    return () => controller.abort();
  }, [user]);

  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error('Failed to update status');
      
      toast.success(`Order marked as ${newStatus}`);
      // Update local state to reflect changes instantly
      setOrders(orders.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };

  // Filter orders locally
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) || 
      order.shippingAddress.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 space-y-4">
        <Loader2 className="animate-spin text-blue-600" size={48} />
        <p className="text-gray-500 font-medium">Loading Orders...</p>
      </div>
    );
  }

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Order Management</h1>
          <p className="text-gray-500 mt-1">Process fulfillments, track shipments, and manage customer orders.</p>
        </div>

        {/* Toolbar */}
        <div className="bg-white p-4 rounded-t-2xl border border-b-0 border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by Order ID or Customer Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Filter size={20} className="text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')}
              className="w-full md:w-48 py-2.5 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-gray-700 font-medium"
            >
              <option value="all">All Orders</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-b-2xl shadow-sm border border-gray-100 overflow-hidden">
          {filteredOrders.length === 0 ? (
            <div className="p-12 text-center text-gray-500 flex flex-col items-center">
              <ShoppingBag size={48} className="text-gray-300 mb-4" />
              <p className="text-lg font-medium text-gray-900">No orders found</p>
              <p>Adjust your filters or search query.</p>
            </div>
          ) : (
            <div className="overflow-x-auto min-h-[50vh]">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                    <th className="p-4 font-semibold">Order ID & Date</th>
                    <th className="p-4 font-semibold">Customer</th>
                    <th className="p-4 font-semibold">Payment</th>
                    <th className="p-4 font-semibold">Total</th>
                    <th className="p-4 font-semibold">Fulfillment Status</th>
                    <th className="p-4 font-semibold text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-gray-900">{order.orderNumber}</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {new Date(order.createdAt).toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-gray-900">{order.shippingAddress?.name || 'Unknown'}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{order.shippingAddress?.phone || 'N/A'}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          {order.paymentMethod === 'mpesa' ? (
                            <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded">M-Pesa</span>
                          ) : (
                            <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Card</span>
                          )}
                          <span className={`${order.paymentStatus === 'completed' ? 'text-green-600' : 'text-yellow-600'}`}>
                            • {order.paymentStatus}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 font-extrabold text-gray-900">
                        KES {order.total.toLocaleString()}
                      </td>
                      <td className="p-4">
                        {/* Inline Status Updater */}
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusUpdate(order._id, e.target.value as OrderStatus)}
                          className={`
                            text-xs font-bold uppercase tracking-wider py-1.5 px-2 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none border-r-8 border-transparent
                            ${order.status === 'delivered' ? 'bg-green-100 text-green-800' : ''}
                            ${order.status === 'shipped' ? 'bg-blue-100 text-blue-800' : ''}
                            ${order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' : ''}
                            ${order.status === 'pending' ? 'bg-gray-100 text-gray-800' : ''}
                            ${order.status === 'cancelled' ? 'bg-red-100 text-red-800' : ''}
                          `}
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="p-4 text-right">
                        <Link 
                          href={`/track-order?order=${order.orderNumber}`}
                          className="inline-flex items-center justify-center p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          aria-label="View order details"
                          target="_blank"
                        >
                          <Eye size={20} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}

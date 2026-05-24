'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Package, ShoppingBag, Users, DollarSign, TrendingUp, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import type { Order } from '@/types';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    totalUsers: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // Protect the route: Only allow admins
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.replace('/'); // Boot them out
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    // Only fetch if they are verified as an admin
    if (!user || user.role !== 'admin') return;

    const controller = new AbortController();
    
    const fetchDashboardData = async () => {
      try {
        const [ordersRes, productsRes] = await Promise.all([
          fetch('/api/admin/orders', { signal: controller.signal }),
          fetch('/api/admin/products', { signal: controller.signal }),
        ]);

        const ordersData = await ordersRes.json();
        const productsData = await productsRes.json();

        // Calculate total revenue from completed orders
        const totalRevenue = ordersData.orders?.reduce(
          (sum: number, order: Order) => sum + (order.paymentStatus === 'completed' ? order.total : 0),
          0
        ) || 0;

        setStats({
          totalOrders: ordersData.orders?.length || 0,
          totalRevenue,
          totalProducts: productsData.products?.length || 0,
          totalUsers: 0, // Placeholder until users API is built
        });

        // Grab top 5 most recent orders
        setRecentOrders(ordersData.orders?.slice(0, 5) || []);
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Failed to fetch dashboard data:', error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    return () => controller.abort();
  }, [user]);

  // Show a loading screen while checking auth or fetching data
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 space-y-4">
        <Loader2 className="animate-spin text-blue-600" size={48} />
        <p className="text-gray-500 font-medium">Loading Dashboard Data...</p>
      </div>
    );
  }

  // Double check protection before rendering
  if (!user || user.role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Admin Overview</h1>
          <p className="text-gray-500 mt-2">Welcome back, {user.name}. Here's what's happening in your store.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all">
            <div>
              <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">Total Orders</p>
              <p className="text-3xl font-black text-gray-900 mt-2">{stats.totalOrders}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-xl group-hover:scale-110 transition-transform">
              <ShoppingBag className="text-blue-600" size={28} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all">
            <div>
              <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">Revenue</p>
              <p className="text-3xl font-black text-gray-900 mt-2">KES {stats.totalRevenue.toLocaleString()}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-xl group-hover:scale-110 transition-transform">
              <DollarSign className="text-green-600" size={28} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all">
            <div>
              <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">Products</p>
              <p className="text-3xl font-black text-gray-900 mt-2">{stats.totalProducts}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-xl group-hover:scale-110 transition-transform">
              <Package className="text-purple-600" size={28} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all">
            <div>
              <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">Growth</p>
              <p className="text-3xl font-black text-green-500 mt-2 flex items-center">
                +12% <TrendingUp size={20} className="ml-2" />
              </p>
            </div>
            <div className="bg-orange-50 p-4 rounded-xl group-hover:scale-110 transition-transform">
              <Users className="text-orange-600" size={28} />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <Link href="/admin/products" className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-2xl shadow-md text-white hover:shadow-lg hover:-translate-y-1 transition-all">
            <Package className="text-blue-200 mb-4" size={32} />
            <h3 className="text-xl font-bold mb-2">Manage Products</h3>
            <p className="text-blue-100 text-sm">Add, edit, or check stock levels.</p>
          </Link>

          <Link href="/admin/orders" className="bg-gradient-to-br from-green-600 to-green-800 p-6 rounded-2xl shadow-md text-white hover:shadow-lg hover:-translate-y-1 transition-all">
            <ShoppingBag className="text-green-200 mb-4" size={32} />
            <h3 className="text-xl font-bold mb-2">Process Orders</h3>
            <p className="text-green-100 text-sm">Update tracking and fulfillment status.</p>
          </Link>

          <div className="bg-gradient-to-br from-purple-600 to-purple-800 p-6 rounded-2xl shadow-md text-white hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer opacity-75">
            <Users className="text-purple-200 mb-4" size={32} />
            <h3 className="text-xl font-bold mb-2">Customers (Coming Soon)</h3>
            <p className="text-purple-100 text-sm">Manage user accounts and permissions.</p>
          </div>
        </div>

        {/* Recent Orders Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Recent Orders</h2>
            <Link href="/admin/orders" className="text-blue-600 text-sm font-semibold hover:text-blue-800">View All</Link>
          </div>
          
          {recentOrders.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <AlertCircle className="mx-auto mb-2 text-gray-300" size={32} />
              No orders have been placed yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-sm uppercase tracking-wider">
                    <th className="p-4 font-medium">Order ID</th>
                    <th className="p-4 font-medium">Customer</th>
                    <th className="p-4 font-medium">Total</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-medium text-gray-900">{order.orderNumber}</td>
                      <td className="p-4 text-gray-600">{order.shippingAddress?.name || 'Unknown'}</td>
                      <td className="p-4 font-bold text-gray-900">KES {order.total.toLocaleString()}</td>
                      <td className="p-4">
                        <span className={`
                          px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider
                          ${order.status === 'delivered' ? 'bg-green-100 text-green-800' : ''}
                          ${order.status === 'shipped' ? 'bg-blue-100 text-blue-800' : ''}
                          ${order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' : ''}
                          ${order.status === 'pending' ? 'bg-gray-100 text-gray-800' : ''}
                          ${order.status === 'cancelled' ? 'bg-red-100 text-red-800' : ''}
                        `}>
                          {order.status}
                        </span>
                      </td>
                      <td className="p-4 text-gray-500 text-sm">
                        {new Date(order.createdAt).toLocaleDateString('en-KE')}
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

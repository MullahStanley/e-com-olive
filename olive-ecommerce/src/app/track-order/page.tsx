'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, Package, Loader2, AlertCircle } from 'lucide-react';
import OrderTracker from '@/components/OrderTracker';
import toast from 'react-hot-toast';
import type { Order } from '@/types';

function TrackOrderContent() {
  const [orderNumber, setOrderNumber] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const orderParam = searchParams.get('order');
    if (orderParam) {
      setOrderNumber(orderParam);
      fetchOrder(orderParam);
    }
  }, [searchParams]);

  const fetchOrder = async (number: string) => {
    setLoading(true);
    setHasSearched(true);
    try {
      const res = await fetch(`/api/orders/track?orderNumber=${encodeURIComponent(number)}`);
      
      let data;
      try { data = await res.json(); } catch (e) { throw new Error('Invalid server response'); }

      if (!res.ok) throw new Error(data.error || 'Order not found');

      setOrder(data.order);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch order');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedOrder = orderNumber.trim();
    if (trimmedOrder) {
      // Update the URL so it's shareable/bookmarkable!
      router.push(`/track-order?order=${encodeURIComponent(trimmedOrder)}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 min-h-[70vh]">
      <h1 className="text-4xl font-extrabold mb-8 text-center text-gray-900 tracking-tight">Track Your Order</h1>

      {/* Search Form */}
      <form onSubmit={handleSubmit} className="mb-12 max-w-2xl mx-auto">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="Enter order number (e.g., ORD-12345)"
              className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading || !orderNumber.trim()}
            className="flex items-center justify-center bg-blue-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md hover:shadow-lg disabled:bg-gray-400 disabled:shadow-none whitespace-nowrap"
          >
            {loading ? <Loader2 className="animate-spin mr-2" size={20} /> : null}
            {loading ? 'Tracking...' : 'Track Order'}
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-3 text-center">
          Your order number can be found in your confirmation email.
        </p>
      </form>

      {/* Loading State */}
      {loading && !order && (
        <div className="flex flex-col items-center justify-center py-12 text-blue-600">
          <Loader2 className="animate-spin mb-4" size={48} />
          <p className="font-medium">Locating your order...</p>
        </div>
      )}

      {/* Order Details */}
      {order && !loading && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Order Header */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Order #{order.orderNumber}</h2>
                <p className="text-gray-500 mt-1">
                  Placed on {new Date(order.createdAt).toLocaleDateString('en-KE', {
                    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </p>
              </div>
              <div className={`
                px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider w-fit
                ${order.status === 'delivered' ? 'bg-green-100 text-green-800' : ''}
                ${order.status === 'shipped' ? 'bg-blue-100 text-blue-800' : ''}
                ${order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' : ''}
                ${order.status === 'pending' ? 'bg-gray-100 text-gray-800' : ''}
                ${order.status === 'cancelled' ? 'bg-red-100 text-red-800' : ''}
              `}>
                {order.status}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900 mb-3 flex items-center">
                  <Package className="mr-2 text-gray-400" size={18} /> Shipping To
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  <span className="font-medium text-gray-900">{order.shippingAddress.name}</span><br />
                  {order.shippingAddress.address}<br />
                  {order.shippingAddress.city} {order.shippingAddress.postalCode && `- ${order.shippingAddress.postalCode}`}<br />
                  {order.shippingAddress.phone}
                </p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-3">Payment Summary</h3>
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Method:</span>
                    <span className="font-medium text-gray-900">{order.paymentMethod === 'mpesa' ? 'M-Pesa' : 'Card'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status:</span>
                    <span className={`font-bold ${order.paymentStatus === 'completed' ? 'text-green-600' : order.paymentStatus === 'failed' ? 'text-red-600' : 'text-yellow-600'}`}>
                      {order.paymentStatus.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-gray-100 pt-2 mt-2">
                    <span className="font-bold text-gray-900">Total:</span>
                    <span className="font-extrabold text-blue-600 text-lg">KES {order.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* External Tracker Component */}
          <OrderTracker status={order.status} trackingHistory={order.trackingHistory} />

          {/* Order Items */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold mb-6 text-gray-900">Items in this Order</h3>
            <div className="space-y-6">
              {order.items.map((item, index) => (
                <div key={index} className="flex items-center gap-4 pb-6 border-b border-gray-50 last:border-0 last:pb-0">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    {/* Fallback icon if you don't use next/image here */}
                    <Package className="text-gray-400" size={24} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 line-clamp-2">{item.name}</h4>
                    <p className="text-sm text-gray-500 mt-1">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-extrabold text-gray-900 whitespace-nowrap">KES {(item.price * item.quantity).toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mt-1">KES {item.price.toLocaleString()} each</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* No Order Found State */}
      {!loading && !order && hasSearched && (
        <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100 animate-in fade-in">
          <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={40} className="text-gray-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h3>
          <p className="text-gray-500 max-w-sm mx-auto">
            We couldn't find an order with that number. Please double-check the exact number from your email.
          </p>
        </div>
      )}
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    }>
      <TrackOrderContent />
    </Suspense>
  );
}

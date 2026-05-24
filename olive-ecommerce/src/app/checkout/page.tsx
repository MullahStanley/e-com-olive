'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MapPin, Loader2, ShieldCheck, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';

import '@/styles/pages/checkout.css';
import type { CartItem } from '@/types';
import { useAuth } from '@/context/AuthContext';

const SHIPPING_COST = 200;

export default function CheckoutPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
  });

  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  useEffect(() => {
    if (searchParams.get('cancelled') === '1') {
      toast.error('Payment was cancelled. Your cart is unchanged.');
    }
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || user.name,
        phone: prev.phone || user.phone || '',
      }));
    }
  }, [user]);

  useEffect(() => {
    setIsMounted(true);
    try {
      const cartData: CartItem[] = JSON.parse(localStorage.getItem('cart') || '[]');
      if (cartData.length === 0) {
        router.replace('/cart');
      } else {
        setCart(cartData);
      }
    } catch {
      router.replace('/cart');
    }
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const items = cart.map((item) => ({
        productId: item._id,
        quantity: item.quantity,
      }));

      const shippingAddress = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        postalCode: formData.postalCode.trim(),
      };

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, shippingAddress }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data) {
        throw new Error(data?.error || 'Checkout failed');
      }

      if (!data.checkoutUrl) {
        throw new Error('Stripe checkout URL was not returned');
      }

      localStorage.removeItem('cart');
      window.dispatchEvent(new Event('cartUpdated'));
      window.location.href = data.checkoutUrl;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Checkout failed';
      toast.error(message);
      setLoading(false);
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const grandTotal = subtotal + SHIPPING_COST;

  if (!isMounted || cart.length === 0) {
    return (
      <div className="min-h-screen flex justify-center py-32 bg-gray-50">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="checkout-title">Secure Checkout</h1>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="checkout-panel">
              <h2 className="checkout-panel-title flex items-center">
                <MapPin className="mr-3 text-blue-600" size={24} />
                Shipping Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="checkout-label">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="checkout-input"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="checkout-label">Phone Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className="checkout-input"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="checkout-label">City *</label>
                  <input
                    type="text"
                    name="city"
                    required
                    value={formData.city}
                    onChange={handleChange}
                    className="checkout-input"
                    disabled={loading}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="checkout-label">Detailed Address *</label>
                  <input
                    type="text"
                    name="address"
                    required
                    value={formData.address}
                    onChange={handleChange}
                    className="checkout-input"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="checkout-label">Postal Code</label>
                  <input
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleChange}
                    className="checkout-input"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            <div className="checkout-panel">
              <h2 className="checkout-panel-title">Payment</h2>
              <div className="flex items-center p-4 border-2 border-indigo-500 bg-indigo-50 rounded-xl">
                <CreditCard className="mr-4 text-indigo-600" size={28} />
                <div>
                  <div className="font-bold text-gray-900">Stripe Checkout</div>
                  <div className="text-sm text-gray-500">
                    Cards, Apple Pay, Google Pay — configured in your Stripe Dashboard
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="checkout-summary-sticky">
              <h2 className="checkout-panel-title">Order Summary</h2>

              <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2">
                {cart.map((item) => (
                  <div key={item._id} className="flex justify-between text-sm items-start gap-4">
                    <span className="text-gray-600 flex-1 leading-tight">
                      {item.name}{' '}
                      <span className="text-gray-400 font-medium">x {item.quantity}</span>
                    </span>
                    <span className="font-semibold text-gray-900 whitespace-nowrap">
                      {(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-6 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold">{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-semibold">{SHIPPING_COST.toLocaleString()}</span>
                </div>
                <div className="border-t border-gray-100 pt-4 flex justify-between items-center">
                  <span className="text-lg font-bold">Total</span>
                  <span className="text-2xl font-extrabold text-blue-600">
                    {grandTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              <button type="submit" disabled={loading} className="checkout-pay-btn">
                {loading ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={20} />
                    Redirecting to Stripe...
                  </>
                ) : (
                  'Continue to Stripe'
                )}
              </button>

              <div className="mt-6 flex flex-col items-center space-y-2 text-center">
                <div className="checkout-stripe-note">
                  <ShieldCheck size={18} className="text-green-500 mr-2" />
                  PCI-compliant payments via Stripe
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, Smartphone, MapPin, Loader2, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

// Import shared types and Auth Context
import type { CartItem } from '@/types';
import { useAuth } from '@/context/AuthContext';

const SHIPPING_COST = 200;

export default function CheckoutPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'card'>('mpesa');
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    city: '',
    postalCode: '',
    mpesaPhone: '',
  });

  const router = useRouter();
  const { user } = useAuth(); // Pull in the logged-in user

  // 1. Pre-fill the form if the user is logged in
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || user.name,
        phone: prev.phone || user.phone || '',
        mpesaPhone: prev.mpesaPhone || user.phone || '', 
      }));
    }
  }, [user]);

  // 2. Safely load cart and prevent hydration redirects
  useEffect(() => {
    setIsMounted(true);
    try {
      const cartData: CartItem[] = JSON.parse(localStorage.getItem('cart') || '[]');
      if (cartData.length === 0) {
        router.replace('/cart'); // Boot them back to cart if it's empty
      } else {
        setCart(cartData);
      }
    } catch (error) {
      console.error('Failed to parse cart:', error);
      router.replace('/cart');
    }
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 3. M-Pesa Phone Validation
    if (paymentMethod === 'mpesa') {
      const phoneToUse = formData.mpesaPhone || formData.phone;
      const phoneRegex = /^(?:254|\+254|0)?(7|1)\d{8}$/;
      if (!phoneRegex.test(phoneToUse)) {
        toast.error('Please enter a valid Kenyan phone number for M-Pesa');
        return;
      }
    }

    setLoading(true);

    try {
      // Map frontend cart strictly to what the backend expects
      const items = cart.map(item => ({
        productId: item._id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.images?.[0] || '/placeholder.png', // Fallback for image array
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
        body: JSON.stringify({
          items,
          shippingAddress,
          paymentMethod,
          phoneNumber: formData.mpesaPhone || formData.phone,
        }),
      });

      // 4. Safe JSON parsing
      let data;
      try {
        data = await res.json();
      } catch (err) {
        throw new Error('Server returned an invalid response.');
      }

      if (!res.ok) {
        throw new Error(data.error || 'Checkout failed');
      }

      // Clear the cart globally
      localStorage.removeItem('cart');
      window.dispatchEvent(new Event('cartUpdated'));

      toast.success('Order placed successfully!');
      router.push(`/track-order?order=${data.orderNumber}`);
      
    } catch (error: any) {
      toast.error(error.message || 'An unexpected error occurred during checkout.');
    } finally {
      setLoading(false);
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const grandTotal = subtotal + SHIPPING_COST;

  // Prevent UI flashing during SSR
  if (!isMounted || cart.length === 0) {
    return (
      <div className="min-h-screen flex justify-center py-32 bg-gray-50">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-8">
          Secure Checkout
        </h1>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Forms */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Shipping Information */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold mb-6 flex items-center text-gray-900">
                <MapPin className="mr-3 text-blue-600" size={24} />
                Shipping Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1.5 text-gray-700">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="John Doe"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5 text-gray-700">Phone Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="0700 000 000"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5 text-gray-700">City *</label>
                  <input
                    type="text"
                    name="city"
                    required
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="Nairobi"
                    disabled={loading}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1.5 text-gray-700">Detailed Address *</label>
                  <input
                    type="text"
                    name="address"
                    required
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="Apartment, Studio, or Floor"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5 text-gray-700">Postal Code</label>
                  <input
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="00100"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold mb-6 text-gray-900">Payment Method</h2>

              <div className="space-y-4">
                {/* M-Pesa Option */}
                <label className={`
                  flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all
                  ${paymentMethod === 'mpesa' ? 'border-green-500 bg-green-50' : 'border-gray-100 hover:border-green-200'}
                `}>
                  <input
                    type="radio"
                    name="payment"
                    value="mpesa"
                    checked={paymentMethod === 'mpesa'}
                    onChange={() => setPaymentMethod('mpesa')}
                    className="mr-4 h-5 w-5 text-green-600 focus:ring-green-500"
                    disabled={loading}
                  />
                  <Smartphone className="mr-4 text-green-600" size={28} />
                  <div className="flex-1">
                    <div className="font-bold text-gray-900">M-Pesa</div>
                    <div className="text-sm text-gray-500">Instant STK Push to your phone</div>
                  </div>
                </label>

                {/* Conditional M-Pesa Phone Input */}
                {paymentMethod === 'mpesa' && (
                  <div className="ml-0 sm:ml-12 p-5 bg-green-50/50 border border-green-100 rounded-xl animate-in fade-in slide-in-from-top-2">
                    <label className="block text-sm font-bold mb-1.5 text-gray-900">M-Pesa Number *</label>
                    <input
                      type="tel"
                      name="mpesaPhone"
                      required={paymentMethod === 'mpesa'}
                      value={formData.mpesaPhone || formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                      placeholder="0700 000 000"
                      disabled={loading}
                    />
                    <p className="text-xs text-green-700 mt-2 font-medium">
                      Make sure your phone is unlocked to receive the PIN prompt.
                    </p>
                  </div>
                )}

                {/* Card Option */}
                <label className={`
                  flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all
                  ${paymentMethod === 'card' ? 'border-blue-600 bg-blue-50' : 'border-gray-100 hover:border-blue-200'}
                `}>
                  <input
                    type="radio"
                    name="payment"
                    value="card"
                    checked={paymentMethod === 'card'}
                    onChange={() => setPaymentMethod('card')}
                    className="mr-4 h-5 w-5 text-blue-600"
                    disabled={loading}
                  />
                  <CreditCard className="mr-4 text-blue-600" size={28} />
                  <div className="flex-1">
                    <div className="font-bold text-gray-900">Credit/Debit Card</div>
                    <div className="text-sm text-gray-500">Visa, MasterCard, Amex</div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 sticky top-24">
              <h2 className="text-xl font-bold mb-6 text-gray-900">Order Summary</h2>

              <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {cart.map(item => (
                  <div key={item._id} className="flex justify-between text-sm items-start gap-4">
                    <span className="text-gray-600 flex-1 leading-tight">
                      {item.name} <span className="text-gray-400 font-medium">x {item.quantity}</span>
                    </span>
                    <span className="font-semibold text-gray-900 whitespace-nowrap">
                      KES {(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-6 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold text-gray-900">KES {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-semibold text-gray-900">KES {SHIPPING_COST.toLocaleString()}</span>
                </div>
                
                <div className="border-t border-gray-100 pt-4 mt-2 flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">Total</span>
                  <span className="text-2xl font-extrabold text-blue-600">
                    KES {grandTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-8 flex justify-center items-center bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-md hover:shadow-lg disabled:bg-blue-400 disabled:shadow-none disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={20} />
                    Processing Payment...
                  </>
                ) : (
                  'Pay Securely Now'
                )}
              </button>

              <div className="mt-6 flex flex-col items-center space-y-2 text-center">
                <div className="flex items-center text-sm text-gray-500 font-medium">
                  <ShieldCheck size={18} className="text-green-500 mr-2" />
                  256-bit Secure Checkout
                </div>
                <p className="text-xs text-gray-400">
                  By placing this order, you agree to our Terms of Service and Privacy Policy.
                </p>
              </div>
            </div>
          </div>
          
        </form>
      </div>
    </div>
  );
}

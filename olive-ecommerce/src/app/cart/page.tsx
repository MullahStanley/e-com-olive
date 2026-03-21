'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import CartItem from '@/components/CartItem';
import { ShoppingCart, ArrowRight, ShieldCheck, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import type { CartItem as CartItemType } from '@/types';

const SHIPPING_COST = 200;

export default function CartPage() {
  const [cart, setCart] = useState<CartItemType[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
    loadCart();
    
    window.addEventListener('cartUpdated', loadCart);
    return () => window.removeEventListener('cartUpdated', loadCart);
  }, []);

  const loadCart = () => {
    try {
      const cartData = JSON.parse(localStorage.getItem('cart') || '[]');
      setCart(cartData);
    } catch (error) {
      console.error('Failed to load cart:', error);
      setCart([]);
    }
  };

  const updateQuantity = (id: string, quantity: number) => {
    const updated = cart.map((item) =>
      item._id === id ? { ...item, quantity } : item
    );
    localStorage.setItem('cart', JSON.stringify(updated));
    setCart(updated);
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const removeItem = (id: string) => {
    const updated = cart.filter((item) => item._id !== id);
    localStorage.setItem('cart', JSON.stringify(updated));
    setCart(updated);
    window.dispatchEvent(new Event('cartUpdated'));
    toast.success('Item removed from cart');
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal + SHIPPING_COST;

  // Prevent UI flashing by rendering a subtle skeleton or nothing until mounted
  if (!isMounted) {
    return <div className="min-h-[60vh] bg-gray-50" />; 
  }

  // Beautiful Empty State
  if (cart.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-20 text-center bg-gray-50">
        <div className="bg-white p-8 rounded-full shadow-sm mb-6 border border-gray-100">
          <ShoppingCart size={64} className="text-gray-300" strokeWidth={1.5} />
        </div>
        <h2 className="text-3xl font-extrabold text-gray-900 mb-4 tracking-tight">Your cart is empty</h2>
        <p className="text-gray-500 max-w-md mb-8">
          Looks like you haven't added anything to your cart yet. Discover our latest products and deals!
        </p>
        <Link
          href="/products"
          className="inline-flex items-center bg-blue-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
        >
          Start Shopping
          <ArrowRight className="ml-2" size={20} />
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Shopping Cart <span className="text-gray-400 text-2xl font-medium">({cart.length})</span>
          </h1>
          <Link href="/products" className="hidden sm:flex items-center text-blue-600 font-semibold hover:text-blue-800 transition">
            <ArrowLeft size={18} className="mr-2" />
            Continue Shopping
          </Link>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 text-gray-900">
          
          {/* Cart Items List */}
          <div className="lg:w-2/3 space-y-4">
            {cart.map((item) => (
              <CartItem
                key={item._id}
                item={item}
                onUpdate={updateQuantity}
                onRemove={removeItem}
              />
            ))}
            
            {/* Mobile Continue Shopping Link */}
            <div className="sm:hidden pt-4">
               <Link href="/products" className="flex justify-center items-center text-blue-600 font-semibold hover:text-blue-800 transition">
                <ArrowLeft size={18} className="mr-2" />
                Continue Shopping
              </Link>
            </div>
          </div>

          {/* Sticky Order Summary Sidebar */}
          <div className="lg:w-1/3">
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 sticky top-24">
              <h2 className="text-xl font-bold mb-6 text-gray-900">Order Summary</h2>
              
              <div className="space-y-4 mb-6 text-sm sm:text-base">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-medium text-gray-900">KES {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping Estimate</span>
                  <span className="font-medium text-gray-900">KES {SHIPPING_COST.toLocaleString()}</span>
                </div>
                
                <div className="border-t border-gray-100 pt-4 mt-4 flex justify-between items-center">
                  <span className="font-bold text-lg text-gray-900">Total</span>
                  <span className="font-extrabold text-2xl text-blue-600">
                    KES {total.toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                onClick={() => router.push('/checkout')}
                className="w-full flex items-center justify-center bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-md hover:shadow-lg"
              >
                Proceed to Checkout
                <ArrowRight size={20} className="ml-2" />
              </button>

              <div className="mt-6 flex items-center justify-center text-sm text-gray-500">
                <ShieldCheck size={18} className="text-green-500 mr-2" />
                <span>Secure checkout powered by M-Pesa</span>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}

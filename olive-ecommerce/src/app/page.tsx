'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingBag, Shield, Truck, CreditCard, ChevronRight, Star, ArrowRight } from 'lucide-react';
import ProductCarousel from '@/components/ProductCarousel';

// Import our shared type and the new AuthContext
import type { Product } from '@/types';
import { useAuth } from '@/context/AuthContext';

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  
  // Pull in global user state
  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchFeaturedProducts = async () => {
      try {
        const res = await fetch('/api/products?featured=true&limit=8', { signal });
        if (!res.ok) throw new Error('Failed to fetch products');
        
        const data = await res.json();
        setProducts(data.products || []);
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Error fetching products:', error);
        }
      } finally {
        setProductsLoading(false);
      }
    };

    fetchFeaturedProducts();
    return () => controller.abort();
  }, []);

  return (
    <div className="bg-gray-50 flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-blue-900/50 to-transparent"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="text-center space-y-8 flex flex-col items-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-sm font-medium border border-white/20 shadow-sm">
              <Star className="fill-yellow-400 text-yellow-400" size={16} aria-hidden="true" />
              <span>Trusted by 10,000+ customers</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight">
              Shop Smarter,
              <br />
              <span className="text-blue-200">Live Better</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-blue-100 max-w-2xl text-center leading-relaxed">
              Your trusted online marketplace with secure M-Pesa payments and lightning-fast delivery.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8 w-full sm:w-auto">
              <Link
                href="/products"
                className="group w-full sm:w-auto inline-flex justify-center items-center bg-white text-blue-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-50 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                Start Shopping
                <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" size={24} aria-hidden="true" />
              </Link>
              
              <Link
                href="/track-order"
                className="w-full sm:w-auto inline-flex justify-center items-center bg-black/20 backdrop-blur-sm border-2 border-white/80 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-white/20 hover:border-white transition-all duration-300"
              >
                Track Order
              </Link>
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-gray-50 to-transparent pointer-events-none"></div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose ShopHub?
            </h2>
            <p className="text-xl text-gray-500">Experience shopping the way it should be.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-50 rounded-2xl mb-6 group-hover:bg-blue-600 group-hover:scale-110 transition-all duration-300 shadow-sm">
                <Shield className="text-blue-600 group-hover:text-white transition-colors" size={40} aria-hidden="true" />
              </div>
              <h3 className="font-bold text-xl mb-3 text-gray-900">100% Secure</h3>
              <p className="text-gray-600 leading-relaxed">Bank-level encryption for all payments via M-Pesa and cards.</p>
            </div>
            
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-50 rounded-2xl mb-6 group-hover:bg-green-600 group-hover:scale-110 transition-all duration-300 shadow-sm">
                <Truck className="text-green-600 group-hover:text-white transition-colors" size={40} aria-hidden="true" />
              </div>
              <h3 className="font-bold text-xl mb-3 text-gray-900">Fast Delivery</h3>
              <p className="text-gray-600 leading-relaxed">Track your order in real-time from checkout to your doorstep.</p>
            </div>
            
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-50 rounded-2xl mb-6 group-hover:bg-purple-600 group-hover:scale-110 transition-all duration-300 shadow-sm">
                <CreditCard className="text-purple-600 group-hover:text-white transition-colors" size={40} aria-hidden="true" />
              </div>
              <h3 className="font-bold text-xl mb-3 text-gray-900">Flexible Payment</h3>
              <p className="text-gray-600 leading-relaxed">M-Pesa, Visa, MasterCard — pay securely however you want.</p>
            </div>
            
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-50 rounded-2xl mb-6 group-hover:bg-orange-600 group-hover:scale-110 transition-all duration-300 shadow-sm">
                <ShoppingBag className="text-orange-600 group-hover:text-white transition-colors" size={40} aria-hidden="true" />
              </div>
              <h3 className="font-bold text-xl mb-3 text-gray-900">Premium Quality</h3>
              <p className="text-gray-600 leading-relaxed">A curated selection of authentic, high-quality products.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products Carousel */}
      <section className="py-24 bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                Featured Products
              </h2>
              <p className="text-gray-500 text-lg">Discover our best sellers and new arrivals.</p>
            </div>
            <Link
              href="/products"
              className="hidden md:inline-flex items-center text-blue-600 hover:text-blue-800 font-semibold group transition-colors"
            >
              View All Collection
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} aria-hidden="true" />
            </Link>
          </div>
          
          {productsLoading ? (
            <div className="flex justify-center items-center py-32">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : products.length > 0 ? (
            <ProductCarousel products={products} />
          ) : (
            <div className="text-center py-24 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <ShoppingBag size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 font-medium text-lg">New products arriving soon!</p>
            </div>
          )}
          
          <div className="text-center mt-10 md:hidden">
            <Link
              href="/products"
              className="inline-flex items-center justify-center w-full bg-white border border-gray-200 text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors shadow-sm"
            >
              View All Products
              <ArrowRight className="ml-2" size={18} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* Dynamic CTA Section based on Auth Status */}
      <section className="py-24 bg-gradient-to-r from-blue-700 to-blue-900 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-96 h-96 bg-blue-600 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-96 h-96 bg-blue-800 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight">
            {user ? `Keep Exploring, ${user.name.split(' ')[0]}!` : 'Ready to Start Shopping?'}
          </h2>
          <p className="text-xl md:text-2xl text-blue-100 mb-10 leading-relaxed">
            {user 
              ? 'Check out our latest arrivals and exclusive deals curated just for you.' 
              : 'Join thousands of satisfied customers and experience the best online shopping in Kenya.'}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {authLoading ? (
               // Anti-flicker skeleton for buttons
               <div className="h-[56px] w-[180px] bg-white/20 animate-pulse rounded-lg"></div>
            ) : user ? (
              <Link
                href={user.role === 'admin' ? '/admin' : '/orders'}
                className="inline-flex justify-center items-center bg-white text-blue-700 px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-50 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 w-full sm:w-auto"
              >
                {user.role === 'admin' ? 'Admin Dashboard' : 'View My Orders'}
              </Link>
            ) : (
              <Link
                href="/signup"
                className="inline-flex justify-center items-center bg-white text-blue-700 px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-50 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 w-full sm:w-auto"
              >
                Create Account
              </Link>
            )}

            <Link
              href="/products"
              className="inline-flex justify-center items-center bg-transparent border-2 border-white/80 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-white/10 hover:border-white transition-all duration-300 w-full sm:w-auto"
            >
              Browse Products
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-16 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-gray-100">
            <div className="px-4">
              <div className="text-4xl font-black text-blue-600 mb-2">10K+</div>
              <div className="text-gray-500 font-medium">Happy Customers</div>
            </div>
            <div className="px-4">
              <div className="text-4xl font-black text-blue-600 mb-2">5K+</div>
              <div className="text-gray-500 font-medium">Products</div>
            </div>
            <div className="px-4">
              <div className="text-4xl font-black text-blue-600 mb-2">99%</div>
              <div className="text-gray-500 font-medium">Satisfaction Rate</div>
            </div>
            <div className="px-4">
              <div className="text-4xl font-black text-blue-600 mb-2">24/7</div>
              <div className="text-gray-500 font-medium">Support</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, User as UserIcon, Search, Menu, X, LogOut, Package } from 'lucide-react';
import toast from 'react-hot-toast';

// Importing the types we created earlier (adjust path as needed)
import type { User, CartItem } from '../types'; 

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  // 1. Stabilized function with useCallback for safe event listener binding
  const loadCart = useCallback(() => {
    try {
      const cart: CartItem[] = JSON.parse(localStorage.getItem('cart') || '[]');
      const count = cart.reduce((sum, item) => sum + item.quantity, 0);
      setCartCount(count);
    } catch (error) {
      console.error('Failed to parse cart from local storage:', error);
      setCartCount(0);
    }
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    }
  }, []);

  useEffect(() => {
    checkAuth();
    loadCart();
    
    // Listen for cart updates from other components
    window.addEventListener('cartUpdated', loadCart);
    return () => window.removeEventListener('cartUpdated', loadCart);
  }, [checkAuth, loadCart]);

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (!res.ok) throw new Error('Logout failed');
      
      setUser(null);
      toast.success('Logged out successfully');
      router.push('/');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  // 2. Extracted SearchBar to prevent duplicating the form for Desktop/Mobile
  const SearchBar = ({ isMobile = false }: { isMobile?: boolean }) => {
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = (e: React.FormEvent) => {
      e.preventDefault();
      if (searchQuery.trim()) {
        router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
        setSearchQuery('');
        if (isMobile) setMenuOpen(false);
      }
    };

    return (
      <form onSubmit={handleSearch} className={isMobile ? 'mb-4' : 'hidden md:flex flex-1 max-w-md mx-8'}>
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </form>
    );
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <ShoppingCart className="text-blue-600" size={32} />
            <span className="text-2xl font-bold text-gray-900">ShopHub</span>
          </Link>

          {/* Desktop Search */}
          <SearchBar />

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/products" className="text-gray-700 hover:text-blue-600 font-medium transition">
              Products
            </Link>
            
            {user ? (
              <>
                {user.role === 'admin' && (
                  <Link href="/admin" className="text-gray-700 hover:text-blue-600 font-medium transition">
                    Admin
                  </Link>
                )}
                
                <Link href="/cart" className="relative">
                  <ShoppingCart className="text-gray-700 hover:text-blue-600" size={24} />
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {cartCount}
                    </span>
                  )}
                </Link>

                <div className="relative group">
                  <button className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 focus:outline-none">
                    <UserIcon size={24} />
                    <span className="font-medium">{user.name}</span>
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    <Link href="/track-order" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100">
                      <Package size={18} className="mr-2" />
                      Track Order
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut size={18} className="mr-2" />
                      Logout
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link href="/cart" className="relative">
                  <ShoppingCart className="text-gray-700 hover:text-blue-600" size={24} />
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {cartCount}
                    </span>
                  )}
                </Link>
                <Link href="/login" className="text-gray-700 hover:text-blue-600 font-medium transition">
                  Login
                </Link>
                <Link href="/signup" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition">
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-gray-700 focus:outline-none"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden py-4 border-t">
            <SearchBar isMobile={true} />
            
            <div className="flex flex-col space-y-4">
              <Link href="/products" className="text-gray-700 hover:text-blue-600 font-medium" onClick={() => setMenuOpen(false)}>
                Products
              </Link>
              <Link href="/cart" className="flex items-center text-gray-700 hover:text-blue-600 font-medium" onClick={() => setMenuOpen(false)}>
                <ShoppingCart size={20} className="mr-2" />
                Cart {cartCount > 0 && `(${cartCount})`}
              </Link>
              
              {user ? (
                <>
                  {user.role === 'admin' && (
                    <Link href="/admin" className="text-gray-700 hover:text-blue-600 font-medium" onClick={() => setMenuOpen(false)}>
                      Admin Dashboard
                    </Link>
                  )}
                  <Link href="/track-order" className="text-gray-700 hover:text-blue-600 font-medium" onClick={() => setMenuOpen(false)}>
                    Track Order
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMenuOpen(false);
                    }}
                    className="text-left text-gray-700 hover:text-blue-600 font-medium"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-gray-700 hover:text-blue-600 font-medium" onClick={() => setMenuOpen(false)}>
                    Login
                  </Link>
                  <Link href="/signup" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 text-center" onClick={() => setMenuOpen(false)}>
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
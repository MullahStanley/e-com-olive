'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Plus, Edit, Trash2, Loader2, PackageX, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

import { useAuth } from '@/context/AuthContext';
import type { Product } from '@/types';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // Route Protection
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.replace('/');
    }
  }, [user, authLoading, router]);

  const fetchProducts = async (signal?: AbortSignal) => {
    try {
      const res = await fetch('/api/admin/products', { signal });
      if (!res.ok) throw new Error('Failed to fetch products');
      const data = await res.json();
      setProducts(data.products || []);
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        toast.error('Could not load products');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    const controller = new AbortController();
    fetchProducts(controller.signal);
    return () => controller.abort();
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) return;

    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete product');
      
      toast.success('Product deleted successfully');
      setProducts(products.filter(p => p._id !== id));
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  // Filter products locally based on search
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 space-y-4">
        <Loader2 className="animate-spin text-blue-600" size={48} />
        <p className="text-gray-500 font-medium">Loading Inventory...</p>
      </div>
    );
  }

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Product Catalog</h1>
            <p className="text-gray-500 mt-1">Manage your inventory, pricing, and active listings.</p>
          </div>
          <Link 
            href="/admin/products/new" 
            className="flex items-center justify-center bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-sm hover:shadow-md whitespace-nowrap"
          >
            <Plus size={20} className="mr-2" />
            Add New Product
          </Link>
        </div>

        {/* Toolbar */}
        <div className="bg-white p-4 rounded-t-2xl border border-b-0 border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-center mt-6">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search products by name or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
          <div className="text-sm text-gray-500 font-medium">
            Total: {filteredProducts.length} items
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-b-2xl shadow-sm border border-gray-100 overflow-hidden">
          {filteredProducts.length === 0 ? (
            <div className="p-12 text-center text-gray-500 flex flex-col items-center">
              <PackageX size={48} className="text-gray-300 mb-4" />
              <p className="text-lg font-medium text-gray-900">No products found</p>
              <p>Try adjusting your search or add a new product.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                    <th className="p-4 font-semibold">Product</th>
                    <th className="p-4 font-semibold">Category</th>
                    <th className="p-4 font-semibold">Price</th>
                    <th className="p-4 font-semibold">Stock</th>
                    <th className="p-4 font-semibold">Status</th>
                    <th className="p-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredProducts.map((product) => (
                    <tr key={product._id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="p-4 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden relative border border-gray-200 flex-shrink-0">
                          <Image 
                            src={product.images?.[0] || '/placeholder.png'} 
                            alt={product.name}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 line-clamp-1">{product.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">SKU: {product.sku || 'N/A'}</p>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-gray-600">{product.category}</td>
                      <td className="p-4 font-semibold text-gray-900">
                        KES {product.price.toLocaleString()}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                          product.stock > 10 ? 'bg-green-100 text-green-700' : 
                          product.stock > 0 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {product.stock > 0 ? `${product.stock} in stock` : 'Out of Stock'}
                        </span>
                      </td>
                      <td className="p-4">
                        {product.isActive ? (
                          <div className="flex items-center text-green-600 text-sm font-medium">
                            <CheckCircle size={16} className="mr-1.5" /> Active
                          </div>
                        ) : (
                          <div className="flex items-center text-gray-500 text-sm font-medium">
                            <XCircle size={16} className="mr-1.5" /> Draft
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link 
                            href={`/admin/products/${product._id}`}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            aria-label="Edit product"
                          >
                            <Edit size={18} />
                          </Link>
                          <button 
                            onClick={() => handleDelete(product._id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            aria-label="Delete product"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
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

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import { Search, Filter, Loader2, PackageX } from 'lucide-react';
import type { Product } from '@/types';

// 1. Extract logic into a component that can be wrapped in Suspense
function ProductsContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Local state just for the input box before they hit "Search"
  const [searchInput, setSearchInput] = useState('');
  
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Read current filters directly from the URL
  const currentSearch = searchParams.get('search') || '';
  const currentCategory = searchParams.get('category') || 'All';

  // Sync the input box with the URL when the page loads or URL changes
  useEffect(() => {
    setSearchInput(currentSearch);
  }, [currentSearch]);

  // 2. Fetch products whenever the URL parameters change
  useEffect(() => {
    const controller = new AbortController();
    
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (currentSearch) params.append('search', currentSearch);
        if (currentCategory !== 'All') params.append('category', currentCategory);
        
        const res = await fetch(`/api/products?${params.toString()}`, {
          signal: controller.signal
        });
        
        if (!res.ok) throw new Error('Failed to fetch products');
        
        const data = await res.json();
        setProducts(data.products || []);
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Error fetching products:', error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
    return () => controller.abort();
  }, [currentSearch, currentCategory]);

  // 3. Update the URL instead of fetching directly (URL is the source of truth)
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    
    if (searchInput.trim()) {
      params.set('search', searchInput.trim());
    } else {
      params.delete('search');
    }
    
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCategory = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    
    if (newCategory !== 'All') {
      params.set('category', newCategory);
    } else {
      params.delete('category');
    }
    
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <>
      {/* Search & Filters */}
      <div className="mb-10 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} aria-hidden="true" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
          <button type="submit" className="hidden">Search</button>
        </form>
        
        <div className="relative min-w-[200px]">
          <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} aria-hidden="true" />
          <select
            value={currentCategory}
            onChange={handleCategoryChange}
            className="w-full pl-12 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none cursor-pointer text-gray-700"
            aria-label="Filter by category"
          >
            <option value="All">All Categories</option>
            <option value="Electronics">Electronics</option>
            <option value="Fashion">Fashion</option>
            <option value="Home">Home & Living</option>
            <option value="Sports">Sports & Outdoors</option>
          </select>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="flex flex-col justify-center items-center py-32 space-y-4">
          <Loader2 className="animate-spin text-blue-600" size={48} />
          <p className="text-gray-500 font-medium">Finding products...</p>
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-32 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="bg-gray-50 p-6 rounded-full mb-4">
            <PackageX className="text-gray-400" size={48} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-500 max-w-md">
            We couldn't find anything matching "{currentSearch}" in the {currentCategory} category. Try adjusting your filters or search terms.
          </p>
          {(currentSearch || currentCategory !== 'All') && (
            <button
              onClick={() => router.push(pathname)}
              className="mt-6 text-blue-600 font-semibold hover:text-blue-700 transition-colors"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}
    </>
  );
}

// 4. Main Page wrapper with Suspense
export default function ProductsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Our Collection</h1>
        <p className="mt-2 text-lg text-gray-500">Discover top-quality products at unbeatable prices.</p>
      </div>
      
      <Suspense fallback={
        <div className="flex justify-center py-32">
          <Loader2 className="animate-spin text-blue-600" size={48} />
        </div>
      }>
        <ProductsContent />
      </Suspense>
    </div>
  );
}

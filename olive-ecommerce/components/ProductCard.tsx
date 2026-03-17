'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Star } from 'lucide-react';
import toast from 'react-hot-toast';

// Import CartItem to fix the 'any' type
import type { Product, CartItem } from '../types'; 

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const addToCart = () => {
    try {
      const cart: CartItem[] = JSON.parse(localStorage.getItem('cart') || '[]');
      const existingItem = cart.find((item) => item._id === product._id);

      // Prevent users from adding more items than available in stock
      if (existingItem && existingItem.quantity >= product.stock) {
        toast.error(`Sorry, only ${product.stock} available in stock!`);
        return;
      }

      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        cart.push({ ...product, quantity: 1 });
      }

      localStorage.setItem('cart', JSON.stringify(cart));
      window.dispatchEvent(new Event('cartUpdated'));
      
      // More personalized toast message
      toast.success(`${product.name} added to cart!`);
    } catch (error) {
      console.error('Failed to update cart:', error);
      toast.error('Could not add to cart. Please check your browser settings.');
    }
  };

  // Safely grab the first image from the array, or use a generic fallback placeholder
  const displayImage = product.images?.[0] || '/placeholder.png';
  
  // Use the slug for SEO-friendly URLs instead of the MongoDB _id
  const productUrl = `/products/${product.slug}`;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col h-full">
      <Link href={productUrl} className="block relative h-64 w-full bg-gray-100 flex-shrink-0">
        <Image
          src={displayImage}
          alt={`Image of ${product.name}`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center backdrop-blur-sm">
            <span className="text-white font-bold text-lg tracking-wider">OUT OF STOCK</span>
          </div>
        )}
      </Link>

      {/* flex-1 ensures the card stretches nicely if descriptions are different lengths */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            {product.category}
          </span>
          <div className="flex items-center">
            <Star className="text-yellow-400 fill-yellow-400" size={16} aria-hidden="true" />
            <span className="text-sm text-gray-600 ml-1 font-medium">
              {product.rating.toFixed(1)} <span className="text-gray-400">({product.reviews})</span>
            </span>
          </div>
        </div>

        <Link href={productUrl} className="flex-1">
          <h3 className="font-semibold text-lg text-gray-900 hover:text-blue-600 transition line-clamp-2 mb-2 leading-tight">
            {product.name}
          </h3>
          <p className="text-gray-600 text-sm line-clamp-2 mb-4">
            {product.description}
          </p>
        </Link>

        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
          <span className="text-xl font-bold text-gray-900">
            KES {product.price.toLocaleString()}
          </span>
          <button
            onClick={addToCart}
            disabled={product.stock === 0}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed flex items-center space-x-2 shadow-sm"
            aria-label={`Add ${product.name} to cart`}
          >
            <ShoppingCart size={18} aria-hidden="true" />
            <span className="font-medium">Add</span>
          </button>
        </div>
      </div>
    </div>
  );
}
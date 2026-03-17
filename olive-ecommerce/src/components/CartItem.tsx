'use client';

import Image from 'next/image';
import { Trash2, Plus, Minus } from 'lucide-react';
import type { CartItem as CartItemType } from '../types';

interface CartItemProps {
  item: CartItemType;
  onUpdate: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
}

export default function CartItem({ item, onUpdate, onRemove }: CartItemProps) {
  // 1. Safely grab the first image from our synchronized schema
  const displayImage = item.images?.[0] || '/placeholder.png';

  return (
    // 2. Updated to flex-col on mobile, flex-row on larger screens
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-100 transition-all hover:shadow-md">
      
      {/* Image Container */}
      <div className="relative h-24 w-24 sm:h-28 sm:w-28 flex-shrink-0 bg-gray-50 rounded-md overflow-hidden border border-gray-100">
        <Image
          src={displayImage}
          alt={`Image of ${item.name}`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 96px, 112px"
        />
      </div>

      {/* Product Info */}
      <div className="flex-1 w-full">
        <h3 className="font-semibold text-gray-900 line-clamp-2 leading-tight">
          {item.name}
        </h3>
        <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-medium">
          {item.category}
        </p>
        <p className="text-lg font-bold text-blue-600 mt-2">
          KES {item.price.toLocaleString()}
        </p>
      </div>

      {/* Controls Wrapper - stacks nicely under info on mobile */}
      <div className="flex items-center justify-between w-full sm:w-auto gap-6 sm:gap-8 mt-2 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-gray-100">
        
        {/* Quantity Controls */}
        <div className="flex flex-col items-center">
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-gray-50 shadow-sm">
            <button
              onClick={() => onUpdate(item._id, item.quantity - 1)}
              className="p-2 hover:bg-gray-200 transition disabled:opacity-40 disabled:cursor-not-allowed text-gray-700"
              disabled={item.quantity <= 1}
              aria-label="Decrease quantity"
            >
              <Minus size={16} aria-hidden="true" />
            </button>
            <span className="font-semibold w-10 text-center text-gray-900">
              {item.quantity}
            </span>
            <button
              onClick={() => onUpdate(item._id, item.quantity + 1)}
              className="p-2 hover:bg-gray-200 transition disabled:opacity-40 disabled:cursor-not-allowed text-gray-700"
              disabled={item.quantity >= item.stock}
              aria-label="Increase quantity"
            >
              <Plus size={16} aria-hidden="true" />
            </button>
          </div>
          
          {/* Visual feedback when hitting the inventory limit */}
          {item.quantity >= item.stock && (
            <span className="text-[10px] text-red-500 mt-1 font-medium absolute -bottom-5 sm:relative sm:-bottom-0">
              Max stock
            </span>
          )}
        </div>

        {/* Total Price and Remove Button */}
        <div className="text-right flex flex-col items-end min-w-[100px]">
          <p className="font-bold text-gray-900 text-lg sm:text-xl">
            KES {(item.price * item.quantity).toLocaleString()}
          </p>
          <button
            onClick={() => onRemove(item._id)}
            className="text-gray-400 hover:text-red-500 transition mt-2 flex items-center gap-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500 rounded p-1"
            aria-label={`Remove ${item.name} from cart`}
          >
            <Trash2 size={16} aria-hidden="true" />
            <span className="sm:hidden">Remove</span>
          </button>
        </div>
      </div>
    </div>
  );
}
// Shared Types & Enums

export type Role = 'user' | 'admin';
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentMethod = 'mpesa' | 'card';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';


// User Interfaces

export interface User {
  _id: string;
  email: string;
  name: string;
  role: Role;
  phone?: string;
  address?: string;
  createdAt: string; // Dates become strings when passed through JSON APIs
  updatedAt: string;
}

// Product & Cart Interfaces

export interface Product {
  _id: string;
  name: string;
  slug: string;
  sku?: string;
  description: string;
  price: number;
  category: string;
  images: string[]; // Updated to match the backend array
  stock: number;
  rating: number;
  reviews: number;
  featured: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem extends Product {
  quantity: number;
}

// Order Interfaces

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string; // The first image URL from the product's images array
}

export interface ShippingAddress {
  name: string;
  phone: string;
  address: string;
  city: string;
  postalCode?: string;
}

export interface TrackingUpdate {
  status: string;
  message: string;
  timestamp: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  userId: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  mpesaReceiptNumber?: string;
  mpesaCheckoutRequestId?: string; // Links back to Safaricom's Daraja API
  shippingAddress: ShippingAddress;
  trackingHistory: TrackingUpdate[];
  createdAt: string;
  updatedAt: string;
}
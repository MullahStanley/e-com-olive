// Shared Types & Enums

export type Role = 'user' | 'admin';
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentMethod = 'stripe';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface User {
  _id: string;
  id?: string;
  email: string;
  name: string;
  role: Role;
  phone?: string;
  address?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  _id: string;
  id?: string;
  name: string;
  slug: string;
  sku?: string;
  description: string;
  price: number;
  category: string;
  images: string[];
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

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
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
  id?: string;
  orderNumber: string;
  userId: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  stripeSessionId?: string;
  shippingAddress: ShippingAddress;
  trackingHistory: TrackingUpdate[];
  createdAt: string;
  updatedAt: string;
}

export interface CheckoutItemInput {
  productId: string;
  quantity: number;
}

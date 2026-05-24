import { Prisma, type Product, type SaleOrder, type SaleOrderLine, type OrderTrackingEvent } from '@prisma/client';
import prisma from '@/lib/prisma';

export const SHIPPING_COST = 200;

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export function decimalToNumber(value: Prisma.Decimal | number): number {
  return typeof value === 'number' ? value : Number(value);
}

/** Map DB product to API shape (keeps `_id` for existing UI code). */
export function serializeProduct(product: Product) {
  return {
    _id: product.id,
    id: product.id,
    name: product.name,
    slug: product.slug,
    sku: product.sku ?? undefined,
    description: product.description,
    price: decimalToNumber(product.price),
    category: product.categoryName,
    images: product.images,
    stock: product.stockQty,
    rating: product.rating,
    reviews: product.reviewCount,
    featured: product.featured,
    isActive: product.active,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

type OrderWithRelations = SaleOrder & {
  lines: SaleOrderLine[];
  trackingEvents: OrderTrackingEvent[];
};

export function serializeOrder(order: OrderWithRelations) {
  return {
    _id: order.id,
    id: order.id,
    orderNumber: order.orderNumber,
    userId: order.partnerId,
    items: order.lines.map((line) => ({
      productId: line.productId,
      name: line.productName,
      price: decimalToNumber(line.unitPrice),
      quantity: line.quantity,
      image: line.imageUrl,
    })),
    total: decimalToNumber(order.total),
    status: order.status,
    paymentMethod: 'stripe' as const,
    paymentStatus: order.paymentStatus,
    stripeSessionId: order.stripeSessionId ?? undefined,
    shippingAddress: {
      name: order.shippingName,
      phone: order.shippingPhone,
      address: order.shippingAddress,
      city: order.shippingCity,
      postalCode: order.shippingPostalCode ?? undefined,
    },
    trackingHistory: order.trackingEvents.map((event) => ({
      status: event.status,
      message: event.message,
      timestamp: event.createdAt.toISOString(),
    })),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

export async function requireAdmin(userId: string) {
  const partner = await prisma.partner.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  return partner?.role === 'admin';
}

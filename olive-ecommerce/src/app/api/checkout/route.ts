import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { generateOrderNumber } from '@/lib/utils';
import { stripe } from '@/lib/stripe';
import { SHIPPING_COST, serializeOrder } from '@/lib/erp';

const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().min(1).max(99),
      })
    )
    .min(1),
  shippingAddress: z.object({
    name: z.string().min(2).max(100),
    phone: z.string().min(7).max(20),
    address: z.string().min(5).max(300),
    city: z.string().min(2).max(100),
    postalCode: z.string().max(20).optional(),
  }),
});

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = checkoutSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid checkout payload' }, { status: 400 });
    }

    const { items, shippingAddress } = parsed.data;
    const orderNumber = generateOrderNumber();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const result = await prisma.$transaction(async (tx) => {
      const productIds = items.map((item) => item.productId);
      const products = await tx.product.findMany({
        where: { id: { in: productIds }, active: true },
      });

      if (products.length !== productIds.length) {
        throw new Error('One or more products are unavailable');
      }

      const productMap = new Map(products.map((p) => [p.id, p]));
      let subtotal = 0;
      const lineData: {
        productId: string;
        productName: string;
        unitPrice: number;
        quantity: number;
        imageUrl: string;
      }[] = [];

      for (const item of items) {
        const product = productMap.get(item.productId);
        if (!product || product.stockQty < item.quantity) {
          throw new Error(`Insufficient stock for ${product?.name ?? 'item'}`);
        }

        const unitPrice = Number(product.price);
        subtotal += unitPrice * item.quantity;
        lineData.push({
          productId: product.id,
          productName: product.name,
          unitPrice,
          quantity: item.quantity,
          imageUrl: product.images[0] ?? '/placeholder.png',
        });
      }

      const grandTotal = subtotal + SHIPPING_COST;

      const order = await tx.saleOrder.create({
        data: {
          orderNumber,
          partnerId: authUser.userId,
          subtotal,
          shippingAmount: SHIPPING_COST,
          total: grandTotal,
          shippingName: shippingAddress.name.trim(),
          shippingPhone: shippingAddress.phone.trim(),
          shippingAddress: shippingAddress.address.trim(),
          shippingCity: shippingAddress.city.trim(),
          shippingPostalCode: shippingAddress.postalCode?.trim() || null,
          lines: {
            create: lineData.map((line) => ({
              productId: line.productId,
              productName: line.productName,
              unitPrice: line.unitPrice,
              quantity: line.quantity,
              imageUrl: line.imageUrl,
            })),
          },
          trackingEvents: {
            create: {
              status: 'pending',
              message: 'Order placed — awaiting payment',
            },
          },
        },
        include: { lines: true, trackingEvents: true },
      });

      for (const line of lineData) {
        const updated = await tx.product.updateMany({
          where: {
            id: line.productId,
            stockQty: { gte: line.quantity },
            active: true,
          },
          data: { stockQty: { decrement: line.quantity } },
        });

        if (updated.count !== 1) {
          throw new Error(`Stock reservation failed for ${line.productName}`);
        }

        await tx.stockMove.create({
          data: {
            productId: line.productId,
            orderId: order.id,
            quantity: -line.quantity,
            moveType: 'out',
            reference: orderNumber,
          },
        });
      }

      return { order, subtotal, grandTotal, lineData };
    });

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      client_reference_id: result.order.id,
      customer_email: authUser.email,
      metadata: {
        orderId: result.order.id,
        orderNumber,
      },
      line_items: [
        ...result.lineData.map((line) => ({
          price_data: {
            currency: (process.env.STRIPE_CURRENCY || 'usd').toLowerCase(),
            product_data: { name: line.productName },
            unit_amount: Math.round(line.unitPrice * 100),
          },
          quantity: line.quantity,
        })),
        {
          price_data: {
            currency: (process.env.STRIPE_CURRENCY || 'usd').toLowerCase(),
            product_data: { name: 'Shipping' },
            unit_amount: Math.round(SHIPPING_COST * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/track-order?order=${orderNumber}&paid=1`,
      cancel_url: `${appUrl}/checkout?cancelled=1`,
    });

    await prisma.saleOrder.update({
      where: { id: result.order.id },
      data: { stripeSessionId: session.id },
    });

    const fullOrder = await prisma.saleOrder.findUniqueOrThrow({
      where: { id: result.order.id },
      include: { lines: true, trackingEvents: { orderBy: { createdAt: 'asc' } } },
    });

    return NextResponse.json(
      {
        message: 'Checkout session created',
        orderNumber,
        orderId: result.order.id,
        checkoutUrl: session.url,
        order: serializeOrder(fullOrder),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Checkout error:', error);
    const message = error instanceof Error ? error.message : 'Checkout failed';
    const status = message.includes('stock') || message.includes('unavailable') ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

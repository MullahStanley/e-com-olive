import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { serializeOrder } from '@/lib/erp';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const orderNumber = new URL(req.url).searchParams.get('orderNumber')?.trim();
    if (!orderNumber) {
      return NextResponse.json({ error: 'Order number is required' }, { status: 400 });
    }

    const authUser = await getAuthUser();

    const order = await prisma.saleOrder.findUnique({
      where: { orderNumber },
      include: {
        lines: true,
        trackingEvents: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Only the order owner or an admin may view order details
    if (authUser) {
      if (order.partnerId !== authUser.userId && authUser.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ order: serializeOrder(order) }, { status: 200 });
  } catch (error) {
    console.error('Order track error:', error);
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
  }
}

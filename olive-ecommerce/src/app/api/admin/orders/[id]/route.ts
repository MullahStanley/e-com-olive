import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { requireAdmin, serializeOrder } from '@/lib/erp';

const patchSchema = z.object({
  status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!(await requireAdmin(authUser.userId))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const parsed = patchSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const order = await prisma.saleOrder.update({
      where: { id },
      data: {
        status: parsed.data.status,
        trackingEvents: {
          create: {
            status: parsed.data.status,
            message: `Order status updated to ${parsed.data.status}`,
          },
        },
      },
      include: {
        lines: true,
        trackingEvents: { orderBy: { createdAt: 'asc' } },
      },
    });

    return NextResponse.json({ order: serializeOrder(order) });
  } catch (error) {
    console.error('Admin order update error:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}

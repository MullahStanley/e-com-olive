import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { requireAdmin, serializeProduct, slugify } from '@/lib/erp';

const updateSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  description: z.string().min(10).max(2000).optional(),
  price: z.number().min(0).optional(),
  category: z.string().min(1).optional(),
  images: z.array(z.string().url()).min(1).optional(),
  stock: z.number().int().min(0).optional(),
  featured: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || !(await requireAdmin(authUser.userId))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const parsed = updateSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid product data' }, { status: 400 });
    }

    const data = parsed.data;
    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(data.name ? { name: data.name, slug: slugify(data.name) } : {}),
        ...(data.description ? { description: data.description } : {}),
        ...(data.price !== undefined ? { price: data.price } : {}),
        ...(data.category ? { categoryName: data.category } : {}),
        ...(data.images ? { images: data.images } : {}),
        ...(data.stock !== undefined ? { stockQty: data.stock } : {}),
        ...(data.featured !== undefined ? { featured: data.featured } : {}),
        ...(data.isActive !== undefined ? { active: data.isActive } : {}),
      },
    });

    return NextResponse.json({ product: serializeProduct(product) });
  } catch (error) {
    console.error('Admin product PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || !(await requireAdmin(authUser.userId))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    await prisma.product.update({
      where: { id },
      data: { active: false },
    });

    return NextResponse.json({ message: 'Product deactivated' });
  } catch (error) {
    console.error('Admin product DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}

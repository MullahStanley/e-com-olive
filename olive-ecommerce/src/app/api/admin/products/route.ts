import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { requireAdmin, serializeProduct, slugify } from '@/lib/erp';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!(await requireAdmin(authUser.userId))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const products = await prisma.product.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json({ products: products.map(serializeProduct) });
  } catch (error) {
    console.error('Admin products GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

const createSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().min(10).max(2000),
  price: z.number().min(0),
  category: z.string().min(1),
  images: z.array(z.string().url()).min(1),
  stock: z.number().int().min(0),
  featured: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || !(await requireAdmin(authUser.userId))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const parsed = createSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid product data' }, { status: 400 });
    }

    const data = parsed.data;
    const slug = slugify(data.name);

    const product = await prisma.product.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        price: data.price,
        categoryName: data.category,
        images: data.images,
        stockQty: data.stock,
        featured: data.featured ?? false,
      },
    });

    return NextResponse.json({ product: serializeProduct(product) }, { status: 201 });
  } catch (error) {
    console.error('Admin products POST error:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}

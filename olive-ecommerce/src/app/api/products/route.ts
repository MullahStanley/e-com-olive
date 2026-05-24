import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { serializeProduct } from '@/lib/erp';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim();
    const category = searchParams.get('category');
    const featured = searchParams.get('featured');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);

    const products = await prisma.product.findMany({
      where: {
        active: true,
        ...(category && category !== 'All' ? { categoryName: category } : {}),
        ...(featured === 'true' ? { featured: true } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json(
      { products: products.map(serializeProduct) },
      { status: 200 }
    );
  } catch (error) {
    console.error('Products fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products. Please try again later.' },
      { status: 500 }
    );
  }
}

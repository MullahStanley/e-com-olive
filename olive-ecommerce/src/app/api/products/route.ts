import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';

// Prevent Next.js from statically caching this route during build
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const featured = searchParams.get('featured');
    const limit = parseInt(searchParams.get('limit') || '20');

    // 1. Base Query: ONLY show active products to public users
    const query: Record<string, any> = { 
      isActive: true 
    };

    // 2. Flexible Regex Search (matches partial words in name or description)
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i'); // 'i' makes it case-insensitive
      query.$or = [
        { name: searchRegex },
        { description: searchRegex }
      ];
    }

    // 3. Category Filter (ignore if 'All')
    if (category && category !== 'All') {
      query.category = category;
    }

    // 4. Featured Filter
    if (featured === 'true') {
      query.isFeatured = true; // Make sure this matches your Schema (isFeatured vs featured)
    }

    // 5. Execute query with .lean() for maximum read performance
    const products = await Product.find(query)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ products }, { status: 200 });

  } catch (error) {
    console.error('Products fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products. Please try again later.' }, 
      { status: 500 }
    );
  }
}
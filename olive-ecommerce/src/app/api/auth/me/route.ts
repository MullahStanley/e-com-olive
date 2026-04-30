import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth'; // Assuming this securely reads cookies natively
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

// Ensures Next.js doesn't try to statically cache this highly dynamic route
export const dynamic = 'force-dynamic'; 

export async function GET() {
  try {
    // 1. Verify the JWT token from the incoming request
    const authUser = await getAuthUser();
    
    if (!authUser || !authUser.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // 2. Fetch fresh user data from the database
    // Use .lean() for performance and explicitly select ONLY safe, required fields
    const user = await User.findById(authUser.userId)
      .select('_id name email role phone')
      .lean();

    // 3. Handle Edge Case: Token is valid, but the user was deleted from the database
    if (!user) {
      return NextResponse.json({ error: 'User profile no longer exists' }, { status: 404 });
    }
    
    // 4. Return the safe user object to the frontend AuthContext
    return NextResponse.json({ user }, { status: 200 });

  } catch (error) {
    console.error('Session verification error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while verifying your session' }, 
      { status: 500 }
    );
  }
}
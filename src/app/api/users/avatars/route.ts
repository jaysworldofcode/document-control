import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper function to verify JWT token and get user info
async function verifyToken(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token');

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token.value, process.env.JWT_SECRET!) as { userId: string; email: string };
    return decoded;
  } catch (error) {
    return null;
  }
}

// GET - Get user avatars by user IDs
export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userIds = searchParams.get('userIds');

    if (!userIds) {
      return NextResponse.json({ error: 'User IDs parameter is required' }, { status: 400 });
    }

    // Parse comma-separated user IDs
    const userIdArray = userIds.split(',').filter(id => id.trim());

    if (userIdArray.length === 0) {
      return NextResponse.json({ error: 'No valid user IDs provided' }, { status: 400 });
    }

    // Get user avatars from database
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('id, first_name, last_name, avatar_url, avatar_thumbnail_url')
      .in('id', userIdArray);

    if (fetchError) {
      console.error('Database fetch error:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch user avatars' }, { status: 500 });
    }

    // Transform data to match expected format
    const userAvatars = users?.map(user => ({
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      avatarUrl: user.avatar_url,
      avatarThumbnailUrl: user.avatar_thumbnail_url,
      initials: `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase()
    })) || [];

    return NextResponse.json({
      success: true,
      users: userAvatars
    });

  } catch (error) {
    console.error('Error in GET /api/users/avatars:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

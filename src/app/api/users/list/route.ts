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

// GET - Fetch all users in the same organization
export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization to filter users
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.userId)
      .single();

    if (!userData?.organization_id) {
      return NextResponse.json({ error: 'User organization not found' }, { status: 404 });
    }

    // Fetch all users in the same organization
    const { data: users, error } = await supabase
      .from('users')
      .select('id, first_name, last_name, email, role, avatar_url, avatar_thumbnail_url')
      .eq('organization_id', userData.organization_id)
      .order('first_name', { ascending: true });

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    // Transform the data to match the frontend interface
    const transformedUsers = users?.map(user => ({
      id: user.id,
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
      role: user.role || '',
      avatar_url: user.avatar_url || null,
      avatar_thumbnail_url: user.avatar_thumbnail_url || null,
      name: `${user.first_name || ''} ${user.last_name || ''}`.trim()
    })) || [];

    return NextResponse.json(transformedUsers);
  } catch (error) {
    console.error('Error in GET /api/users/list:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

async function authenticateUser(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return decoded;
  } catch (error) {
    return null;
  }
}

// PUT /api/roles/[id] - Update a role
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticateUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to manage roles (only owners can modify roles)
    if (user.role !== 'owner') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const roleId = params.id;
    const body = await request.json();
    const { name, description, permissions } = body;

    // Check if it's a system role (cannot be modified)
    const { data: existingRole } = await supabase
      .from('roles')
      .select('is_system_role')
      .eq('id', roleId)
      .eq('organization_id', user.organizationId)
      .single();

    if (existingRole?.is_system_role) {
      return NextResponse.json({ error: 'Cannot modify system roles' }, { status: 400 });
    }

    const { data: role, error } = await supabase
      .from('roles')
      .update({
        name,
        description,
        permissions: permissions || {},
      })
      .eq('id', roleId)
      .eq('organization_id', user.organizationId)
      .eq('is_system_role', false) // Only allow updating custom roles
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json({ error: 'Role name already exists' }, { status: 400 });
      }
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
    }

    if (!role) {
      return NextResponse.json({ error: 'Role not found or cannot be modified' }, { status: 404 });
    }

    return NextResponse.json({ role });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/roles/[id] - Delete a role
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticateUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to manage roles (only owners can delete roles)
    if (user.role !== 'owner') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const roleId = params.id;

    // Check if it's a system role (cannot be deleted)
    const { data: existingRole } = await supabase
      .from('roles')
      .select('is_system_role')
      .eq('id', roleId)
      .eq('organization_id', user.organizationId)
      .single();

    if (existingRole?.is_system_role) {
      return NextResponse.json({ error: 'Cannot delete system roles' }, { status: 400 });
    }

    // Check if role has users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id')
      .eq('role_id', roleId)
      .limit(1);

    if (usersError) {
      console.error('Database error:', usersError);
      return NextResponse.json({ error: 'Failed to check role usage' }, { status: 500 });
    }

    if (users && users.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete role with assigned users. Please reassign users first.' 
      }, { status: 400 });
    }

    const { error } = await supabase
      .from('roles')
      .delete()
      .eq('id', roleId)
      .eq('organization_id', user.organizationId)
      .eq('is_system_role', false); // Only allow deleting custom roles

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to delete role' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Role deleted successfully' });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

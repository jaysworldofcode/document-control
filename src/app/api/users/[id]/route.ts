import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper function to verify JWT token and get user info
async function verifyAuth(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  
  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    return decoded;
  } catch (error) {
    return null;
  }
}

// PUT: Update a specific user
export async function PUT(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions
    if (user.role !== 'owner' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const userId = resolvedParams.id;
    const body = await request.json();
    const { 
      firstName, 
      lastName, 
      email, 
      phone, 
      role, 
      departmentId, 
      roleId,
      location 
    } = body;

    // Verify the user exists and belongs to the same organization
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, organization_id')
      .eq('id', userId)
      .eq('organization_id', user.organizationId)
      .single();

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update the user
    const updateData: any = {};
    if (firstName) updateData.first_name = firstName;
    if (lastName) updateData.last_name = lastName;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (departmentId !== undefined) updateData.department_id = departmentId === 'none' ? null : departmentId;
    if (roleId !== undefined) updateData.role_id = roleId === 'none' ? null : roleId;

    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select(`
        id,
        email,
        first_name,
        last_name,
        role,
        created_at,
        updated_at,
        department_id,
        role_id
      `)
      .single();

    if (updateError) {
      console.error('Error updating user:', updateError);
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }

    // Fetch department and role separately
    let department = null;
    let customRole = null;

    if (updatedUser.department_id) {
      const { data: deptData } = await supabase
        .from('departments')
        .select('id, name')
        .eq('id', updatedUser.department_id)
        .single();
      department = deptData;
    }

    if (updatedUser.role_id) {
      const { data: roleData } = await supabase
        .from('roles')
        .select('id, name, permissions')
        .eq('id', updatedUser.role_id)
        .single();
      customRole = roleData;
    }

    // Transform the response
    const transformedUser = {
      id: updatedUser.id,
      name: `${updatedUser.first_name} ${updatedUser.last_name}`,
      email: updatedUser.email,
      role: customRole?.name || updatedUser.role,
      department: department?.name || 'Unassigned',
      status: 'active',
      permissions: customRole?.permissions || {},
      created_at: updatedUser.created_at,
      updated_at: updatedUser.updated_at
    };

    return NextResponse.json({ 
      user: transformedUser,
      message: 'User updated successfully'
    });

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Delete a specific user
export async function DELETE(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions
    if (user.role !== 'owner' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const userId = resolvedParams.id;

    // Verify the user exists and belongs to the same organization
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, organization_id, role')
      .eq('id', userId)
      .eq('organization_id', user.organizationId)
      .single();

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent deleting organization owner
    if (existingUser.role === 'owner') {
      return NextResponse.json({ 
        error: 'Cannot delete organization owner' 
      }, { status: 400 });
    }

    // Delete the user
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (deleteError) {
      console.error('Error deleting user:', deleteError);
      return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Reset user password
export async function POST(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions
    if (user.role !== 'owner' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const userId = resolvedParams.id;
    const body = await request.json();
    const { action } = body;

    if (action === 'reset-password') {
      // Verify the user exists and belongs to the same organization
      const { data: existingUser } = await supabase
        .from('users')
        .select('id, organization_id, email, first_name, last_name')
        .eq('id', userId)
        .eq('organization_id', user.organizationId)
        .single();

      if (!existingUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Generate new password
      const newPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12);
      const passwordHash = await bcrypt.hash(newPassword, 12);

      // Update password
      const { error: updateError } = await supabase
        .from('users')
        .update({ password_hash: passwordHash })
        .eq('id', userId);

      if (updateError) {
        console.error('Error resetting password:', updateError);
        return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
      }

      return NextResponse.json({ 
        message: 'Password reset successfully',
        newPassword: newPassword // In production, send this via email instead
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Error in user action:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

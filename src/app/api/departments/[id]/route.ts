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

// PUT /api/departments/[id] - Update a department
export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const user = await authenticateUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to manage departments
    if (user.role !== 'owner' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { id: departmentId } = context.params;
    const body = await request.json();
    const { name, description, managerId, budget } = body;

    const { data: department, error } = await supabase
      .from('departments')
      .update({
        name,
        description,
        manager_id: managerId || null,
        budget: budget || null,
      })
      .eq('id', departmentId)
      .eq('organization_id', user.organizationId)
      .select(`
        *,
        manager:manager_id(id, first_name, last_name, email)
      `)
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json({ error: 'Department name already exists' }, { status: 400 });
      }
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to update department' }, { status: 500 });
    }

    if (!department) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    return NextResponse.json({ department });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/departments/[id] - Delete a department
export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const user = await authenticateUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to manage departments
    if (user.role !== 'owner' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { id: departmentId } = context.params;

    // Check if department has users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id')
      .eq('department_id', departmentId)
      .limit(1);

    if (usersError) {
      console.error('Database error:', usersError);
      return NextResponse.json({ error: 'Failed to check department usage' }, { status: 500 });
    }

    if (users && users.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete department with assigned users. Please reassign users first.' 
      }, { status: 400 });
    }

    const { error } = await supabase
      .from('departments')
      .delete()
      .eq('id', departmentId)
      .eq('organization_id', user.organizationId);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to delete department' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Department deleted successfully' });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    email: string;
    organizationId: string;
    role: string;
  };
}

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

// GET /api/departments - Get all departments for user's organization
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: departments, error } = await supabase
      .from('departments')
      .select(`
        *,
        manager:manager_id(id, first_name, last_name, email)
      `)
      .eq('organization_id', user.organizationId)
      .order('name');

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch departments' }, { status: 500 });
    }

    return NextResponse.json({ departments });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/departments - Create a new department
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to manage departments
    if (user.role !== 'owner' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, managerId, budget } = body;

    if (!name) {
      return NextResponse.json({ error: 'Department name is required' }, { status: 400 });
    }

    const { data: department, error } = await supabase
      .from('departments')
      .insert({
        name,
        description,
        organization_id: user.organizationId,
        manager_id: managerId || null,
        budget: budget || null,
      })
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
      return NextResponse.json({ error: 'Failed to create department' }, { status: 500 });
    }

    return NextResponse.json({ department }, { status: 201 });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/departments/[id] - Update a department
export async function PUT(request: NextRequest) {
  try {
    const user = await authenticateUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to manage departments
    if (user.role !== 'owner' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const url = new URL(request.url);
    const departmentId = url.pathname.split('/').pop();
    
    if (!departmentId) {
      return NextResponse.json({ error: 'Department ID is required' }, { status: 400 });
    }

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
export async function DELETE(request: NextRequest) {
  try {
    const user = await authenticateUser(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to manage departments
    if (user.role !== 'owner' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const url = new URL(request.url);
    const departmentId = url.pathname.split('/').pop();
    
    if (!departmentId) {
      return NextResponse.json({ error: 'Department ID is required' }, { status: 400 });
    }

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

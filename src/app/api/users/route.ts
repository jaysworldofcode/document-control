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

// Helper function to generate username from email
function generateUsername(email: string): string {
  return email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Helper function to generate random password
function generateRandomPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// GET: Fetch all users in the organization
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch users with their department and role information
    const { data: users, error } = await supabase
      .from('users')
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
      .eq('organization_id', user.organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    // Transform data to match the UI expectations
    const transformedUsers = [];
    
    for (const userData of users || []) {
      let department = null;
      let customRole = null;

      // Fetch department if exists
      if (userData.department_id) {
        const { data: deptData } = await supabase
          .from('departments')
          .select('id, name')
          .eq('id', userData.department_id)
          .single();
        department = deptData;
      }

      // Fetch custom role if exists
      if (userData.role_id) {
        const { data: roleData } = await supabase
          .from('roles')
          .select('id, name, permissions')
          .eq('id', userData.role_id)
          .single();
        customRole = roleData;
      }

      transformedUsers.push({
        id: userData.id,
        name: `${userData.first_name} ${userData.last_name}`,
        email: userData.email,
        role: customRole?.name || userData.role,
        department: department?.name || 'Unassigned',
        status: 'active', // We'll add this field later if needed
        permissions: customRole?.permissions || {},
        created_at: userData.created_at,
        updated_at: userData.updated_at
      });
    }

    return NextResponse.json({ users: transformedUsers });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create a new user
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to create users
    if (user.role !== 'owner' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      firstName, 
      lastName, 
      email, 
      password, // Add password field
      phone, 
      role, 
      departmentId, 
      roleId, 
      location,
      sendCredentials = true 
    } = body;

    // Validate required fields
    if (!firstName || !lastName || !email) {
      return NextResponse.json({ 
        error: 'First name, last name, and email are required' 
      }, { status: 400 });
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json({ 
        error: 'User with this email already exists' 
      }, { status: 400 });
    }

    // Generate username and password
    const username = generateUsername(email);
    
    // Use provided password or generate a random one
    const tempPassword = password || generateRandomPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    // Get default department if not specified
    let finalDepartmentId = departmentId;
    if (!departmentId) {
      const { data: defaultDept } = await supabase
        .from('departments')
        .select('id')
        .eq('organization_id', user.organizationId)
        .eq('name', 'General')
        .single();
      
      finalDepartmentId = defaultDept?.id;
    }

    // Get default role if not specified
    let finalRoleId = roleId;
    let finalRole = role || 'member';
    if (!roleId && !role) {
      const { data: defaultRole } = await supabase
        .from('roles')
        .select('id')
        .eq('organization_id', user.organizationId)
        .eq('name', 'Member')
        .single();
      
      finalRoleId = defaultRole?.id;
    }

    // Create the user
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        email,
        password_hash: passwordHash,
        first_name: firstName,
        last_name: lastName,
        organization_id: user.organizationId,
        role: finalRole,
        department_id: finalDepartmentId,
        role_id: finalRoleId,
        email_verified: false
      })
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

    if (createError) {
      console.error('Error creating user:', createError);
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }

    // Fetch department and role separately
    let department = null;
    let customRole = null;

    if (newUser.department_id) {
      const { data: deptData } = await supabase
        .from('departments')
        .select('id, name')
        .eq('id', newUser.department_id)
        .single();
      department = deptData;
    }

    if (newUser.role_id) {
      const { data: roleData } = await supabase
        .from('roles')
        .select('id, name, permissions')
        .eq('id', newUser.role_id)
        .single();
      customRole = roleData;
    }

    // Transform the response
    const transformedUser = {
      id: newUser.id,
      name: `${newUser.first_name} ${newUser.last_name}`,
      email: newUser.email,
      role: customRole?.name || newUser.role,
      department: department?.name || 'Unassigned',
      status: 'active',
      permissions: customRole?.permissions || {},
      created_at: newUser.created_at,
      updated_at: newUser.updated_at,
      // Include temporary credentials only if password was auto-generated
      ...(!password && sendCredentials && {
        tempCredentials: {
          username,
          password: tempPassword,
          loginUrl: `${process.env.NEXT_PUBLIC_APP_URL}/login`
        }
      })
    };

    // TODO: Send email with credentials if sendCredentials is true
    // For now, we'll return the credentials in the response

    return NextResponse.json({ 
      user: transformedUser,
      message: 'User created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Update a user
export async function PUT(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions
    if (user.role !== 'owner' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      userId, 
      firstName, 
      lastName, 
      email, 
      phone, 
      role, 
      departmentId, 
      roleId,
      location,
      status 
    } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

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
    if (departmentId !== undefined) updateData.department_id = departmentId;
    if (roleId !== undefined) updateData.role_id = roleId;

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

// DELETE: Delete a user
export async function DELETE(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions
    if (user.role !== 'owner' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

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

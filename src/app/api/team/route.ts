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

// GET - Fetch team members for a project
export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Get user's organization to ensure access
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.userId)
      .single();

    if (!userData?.organization_id) {
      return NextResponse.json({ error: 'User organization not found' }, { status: 404 });
    }

    // Verify project exists and user has access
    const { data: project } = await supabase
      .from('projects')
      .select('id, organization_id')
      .eq('id', projectId)
      .eq('organization_id', userData.organization_id)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 });
    }

    // Fetch all project team members (including managers) except current user
    const { data: teamMembers, error } = await supabase
      .from('project_team')
      .select(`
        id,
        role,
        added_at,
        user:users!project_team_user_id_fkey(
          id,
          first_name,
          last_name,
          email,
          role
        )
      `)
      .eq('project_id', projectId)
      .neq('user_id', user.userId) // Exclude current user
      .order('added_at', { ascending: true });

    // Also get project managers
    const { data: projectManagers } = await supabase
      .from('project_managers')
      .select(`
        id,
        is_primary_manager,
        added_at,
        user:users!project_managers_user_id_fkey(
          id,
          first_name,
          last_name,
          email,
          role
        )
      `)
      .eq('project_id', projectId)
      .neq('user_id', user.userId); // Exclude current user

    if (error) {
      console.error('Error fetching team members:', error);
      return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 });
    }

    // Transform team members and managers to match frontend interface
    const transformedMembers = [
      // Transform team members
      ...(teamMembers?.map(member => ({
        id: member.user.id,
        name: `${member.user.first_name} ${member.user.last_name}`,
        email: member.user.email,
        role: member.role || 'Team Member',
        department: member.user.role?.name || 'No Department',
        addedAt: member.added_at,
        teamMemberId: member.id
      })) || []),
      // Transform project managers
      ...(projectManagers?.map(manager => ({
        id: manager.user.id,
        name: `${manager.user.first_name} ${manager.user.last_name}`,
        email: manager.user.email,
        role: manager.is_primary_manager ? 'Primary Manager' : 'Project Manager',
        department: manager.user.role?.name || 'No Department',
        addedAt: manager.added_at,
        teamMemberId: manager.id
      })) || [])
    ];

    // Remove duplicates (in case someone is both team member and manager)
    const uniqueMembers = Array.from(new Map(transformedMembers.map(item => [item.id, item])).values());

    return NextResponse.json(uniqueMembers);
  } catch (error) {
    console.error('Error in GET /api/team:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Add a team member to a project
export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, userId, role = 'team member' } = body;

    if (!projectId || !userId) {
      return NextResponse.json({ error: 'Project ID and User ID are required' }, { status: 400 });
    }

    // Get user's organization to ensure access
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.userId)
      .single();

    if (!userData?.organization_id) {
      return NextResponse.json({ error: 'User organization not found' }, { status: 404 });
    }

    // Verify project exists and user has access
    const { data: project } = await supabase
      .from('projects')
      .select('id, organization_id')
      .eq('id', projectId)
      .eq('organization_id', userData.organization_id)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 });
    }

    // Verify the user to be added exists and is in the same organization
    const { data: targetUser } = await supabase
      .from('users')
      .select('id, first_name, last_name, email, role, organization_id')
      .eq('id', userId)
      .eq('organization_id', userData.organization_id)
      .single();

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found or not in same organization' }, { status: 404 });
    }

    // Check if user is already a team member
    const { data: existingMember } = await supabase
      .from('project_team')
      .select('id')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .single();

    if (existingMember) {
      return NextResponse.json({ error: 'User is already a team member' }, { status: 400 });
    }

    // Add the team member
    const { data: teamMember, error } = await supabase
      .from('project_team')
      .insert({
        project_id: projectId,
        user_id: userId,
        role,
        added_by: user.userId
      })
      .select(`
        id,
        role,
        added_at,
        user:users!project_team_user_id_fkey(id, first_name, last_name, email, role)
      `)
      .single();

    if (error) {
      console.error('Error adding team member:', error);
      return NextResponse.json({ error: 'Failed to add team member' }, { status: 500 });
    }

    // Transform response to match frontend interface
    const transformedMember = {
      id: teamMember.user.id,
      name: `${teamMember.user.first_name} ${teamMember.user.last_name}`,
      email: teamMember.user.email,
      role: teamMember.role || 'team member',
      addedAt: teamMember.added_at,
      teamMemberId: teamMember.id
    };

    return NextResponse.json(transformedMember, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/team:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Remove a team member from a project
export async function DELETE(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const userId = searchParams.get('userId');

    if (!projectId || !userId) {
      return NextResponse.json({ error: 'Project ID and User ID are required' }, { status: 400 });
    }

    // Get user's organization to ensure access
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.userId)
      .single();

    if (!userData?.organization_id) {
      return NextResponse.json({ error: 'User organization not found' }, { status: 404 });
    }

    // Verify project exists and user has access
    const { data: project } = await supabase
      .from('projects')
      .select('id, organization_id')
      .eq('id', projectId)
      .eq('organization_id', userData.organization_id)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 });
    }

    // Remove the team member
    const { error } = await supabase
      .from('project_team')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error removing team member:', error);
      return NextResponse.json({ error: 'Failed to remove team member' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Team member removed successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/team:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

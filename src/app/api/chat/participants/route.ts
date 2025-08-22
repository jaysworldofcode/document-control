import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface JWTPayload {
  userId: string;
  email: string;
  organizationId: string;
}

async function getUserFromToken(request: NextRequest): Promise<JWTPayload | null> {
  // Try to get token from Authorization header first
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
      return decoded;
    } catch (error) {
      console.error('JWT verification failed:', error);
    }
  }

  // Try to get token from cookie
  const cookieToken = request.cookies.get('auth-token')?.value;
  if (cookieToken) {
    try {
      const decoded = jwt.verify(cookieToken, process.env.JWT_SECRET!) as JWTPayload;
      return decoded;
    } catch (error) {
      console.error('JWT verification failed:', error);
    }
  }

  return null;
}

// GET /api/chat/participants - Fetch chat participants for a project
export async function GET(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');

  if (!projectId) {
    return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
  }

  try {
    // Check if user has access to this project (organization owner OR project member)
    const { data: project } = await supabase
      .from('projects')
      .select('id, organization_id')
      .eq('id', projectId)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check access: organization owner OR project member
    const isOrgOwner = project.organization_id === user.organizationId;
    
    let isProjectMember = false;
    if (!isOrgOwner) {
      // Check project managers
      const { data: managerCheck } = await supabase
        .from('project_managers')
        .select('user_id')
        .eq('project_id', projectId)
        .eq('user_id', user.userId)
        .single();

      // Check project team
      const { data: teamCheck } = await supabase
        .from('project_team')
        .select('user_id')
        .eq('project_id', projectId)
        .eq('user_id', user.userId)
        .single();

      isProjectMember = !!(managerCheck || teamCheck);
    }

    if (!isOrgOwner && !isProjectMember) {
      return NextResponse.json({ error: 'Access denied to this project' }, { status: 403 });
    }

    // Get organization owner
    const { data: orgData } = await supabase
      .from('organizations')
      .select(`
        owner_id,
        users!organizations_owner_id_fkey(id, first_name, last_name, email)
      `)
      .eq('id', project.organization_id)
      .single();

    // Get project managers
    const { data: managers } = await supabase
      .from('project_managers')
      .select(`
        user_id,
        can_approve_documents,
        is_primary_manager,
        users(id, first_name, last_name, email)
      `)
      .eq('project_id', projectId);

    // Get project team members
    const { data: teamMembers } = await supabase
      .from('project_team')
      .select(`
        user_id,
        users(id, first_name, last_name, email)
      `)
      .eq('project_id', projectId);

    // Create participants list
    const participants = [];

    // Add organization owner if they exist
    if (orgData?.users) {
      participants.push({
        userId: orgData.users.id,
        userName: `${orgData.users.first_name || ''} ${orgData.users.last_name || ''}`.trim() || 'Organization Owner',
        userEmail: orgData.users.email,
        role: 'owner',
        isOnline: true, // For now, assume online - in production, you'd check real status
        canApproveDocuments: true
      });
    }

    // Add project managers
    if (managers) {
      managers.forEach(manager => {
        if (manager.users && manager.user_id !== orgData?.owner_id) { // Avoid duplicating owner
          participants.push({
            userId: manager.users.id,
            userName: `${manager.users.first_name || ''} ${manager.users.last_name || ''}`.trim() || 'Unknown Manager',
            userEmail: manager.users.email,
            role: manager.is_primary_manager ? 'primary_manager' : 'manager',
            isOnline: true, // For now, assume online
            canApproveDocuments: manager.can_approve_documents
          });
        }
      });
    }

    // Add team members
    if (teamMembers) {
      teamMembers.forEach(member => {
        if (member.users && 
            member.user_id !== orgData?.owner_id && // Avoid duplicating owner
            !managers?.find(m => m.user_id === member.user_id) // Avoid duplicating managers
        ) {
          participants.push({
            userId: member.users.id,
            userName: `${member.users.first_name || ''} ${member.users.last_name || ''}`.trim() || 'Unknown Member',
            userEmail: member.users.email,
            role: 'member',
            isOnline: true, // For now, assume online
            canApproveDocuments: false
          });
        }
      });
    }

    return NextResponse.json(participants);
  } catch (error) {
    console.error('Error fetching participants:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

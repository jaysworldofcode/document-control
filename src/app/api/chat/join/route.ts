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

// POST /api/chat/join - Ensure user is a participant in project chat
export async function POST(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { projectId } = await request.json();

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Check if user has access to this project
    const { data: projectAccess } = await supabase
      .from('projects')
      .select('id, organization_id')
      .eq('id', projectId)
      .eq('organization_id', user.organizationId)
      .single();

    if (!projectAccess) {
      return NextResponse.json({ error: 'Access denied to this project' }, { status: 403 });
    }

    // Check if user is organization owner
    const { data: orgData } = await supabase
      .from('organizations')
      .select('owner_id')
      .eq('id', user.organizationId)
      .single();

    const isOrgOwner = orgData?.owner_id === user.userId;

    // Check if user is already a participant
    const { data: existingParticipant } = await supabase
      .from('project_chat_participants')
      .select('id')
      .eq('project_id', projectId)
      .eq('user_id', user.userId)
      .single();

    if (!existingParticipant) {
      // Add user as participant if they're org owner, manager, or team member
      const isManager = await supabase
        .from('project_managers')
        .select('user_id')
        .eq('project_id', projectId)
        .eq('user_id', user.userId)
        .single();

      const isTeamMember = await supabase
        .from('project_team')
        .select('user_id')
        .eq('project_id', projectId)
        .eq('user_id', user.userId)
        .single();

      if (isOrgOwner || isManager.data || isTeamMember.data) {
        await supabase
          .from('project_chat_participants')
          .insert({
            project_id: projectId,
            user_id: user.userId,
            organization_id: user.organizationId,
            joined_at: new Date().toISOString()
          });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error joining chat:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

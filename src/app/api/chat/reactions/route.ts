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
  iat?: number;
  exp?: number;
}

async function verifyToken(request: NextRequest): Promise<JWTPayload | null> {
  try {
    // Try cookie first
    const tokenFromCookie = request.cookies.get('auth-token')?.value;
    
    if (tokenFromCookie) {
      return jwt.verify(tokenFromCookie, process.env.JWT_SECRET!) as JWTPayload;
    }

    // Fallback to Authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      return jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    }

    return null;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messageId, reactionType } = body;

    if (!messageId || !reactionType) {
      return NextResponse.json(
        { error: 'Message ID and reaction type are required' },
        { status: 400 }
      );
    }

    const payload = await verifyToken(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the message to verify it exists and get project info
    const { data: message, error: messageError } = await supabase
      .from('project_chat_messages')
      .select(`
        id,
        project_id,
        user_id
      `)
      .eq('id', messageId)
      .single();

    if (messageError || !message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    // Get the project to check organization ownership
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, organization_id')
      .eq('id', message.project_id)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this project (organization owner OR project member)
    const isOrgOwner = project.organization_id === payload.organizationId;
    
    // If not org owner, check project membership
    let isProjectMember = false;
    if (!isOrgOwner) {
      const { data: membership } = await supabase
        .from('project_members')
        .select('user_id')
        .eq('project_id', message.project_id)
        .eq('user_id', payload.userId)
        .single();
      
      isProjectMember = !!membership;
    }

    if (!isOrgOwner && !isProjectMember) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Check if reaction already exists
    const { data: existingReaction } = await supabase
      .from('project_chat_reactions')
      .select('id')
      .eq('message_id', messageId)
      .eq('user_id', payload.userId)
      .eq('reaction_type', reactionType)
      .single();

    if (existingReaction) {
      // Remove existing reaction (toggle off)
      const { error: deleteError } = await supabase
        .from('project_chat_reactions')
        .delete()
        .eq('id', existingReaction.id);

      if (deleteError) {
        console.error('Error removing reaction:', deleteError);
        return NextResponse.json(
          { error: 'Failed to remove reaction' },
          { status: 500 }
        );
      }
    } else {
      // Add new reaction
      const { error: insertError } = await supabase
        .from('project_chat_reactions')
        .insert({
          message_id: messageId,
          user_id: payload.userId,
          reaction_type: reactionType
        });

      if (insertError) {
        console.error('Error adding reaction:', insertError);
        return NextResponse.json(
          { error: 'Failed to add reaction' },
          { status: 500 }
        );
      }
    }

    // Get updated reactions for this message
    const { data: reactions, error: reactionsError } = await supabase
      .from('project_chat_reactions')
      .select(`
        id,
        reaction_type,
        created_at,
        users(id, first_name, last_name)
      `)
      .eq('message_id', messageId);

    if (reactionsError) {
      console.error('Error fetching updated reactions:', reactionsError);
      return NextResponse.json(
        { error: 'Failed to fetch updated reactions' },
        { status: 500 }
      );
    }

    // Format reactions for response
    const formattedReactions = reactions?.map(reaction => ({
      id: reaction.id,
      type: reaction.reaction_type,
      userId: (reaction.users as any)?.id,
      userName: `${(reaction.users as any)?.first_name || ''} ${(reaction.users as any)?.last_name || ''}`.trim(),
      createdAt: reaction.created_at
    })) || [];

    return NextResponse.json({
      success: true,
      reactions: formattedReactions
    });

  } catch (error) {
    console.error('Error in chat reactions API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

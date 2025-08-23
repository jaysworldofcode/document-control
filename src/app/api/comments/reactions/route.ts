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

// POST - Add or toggle a reaction
export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { commentId, reactionType } = body;

    if (!commentId || !reactionType) {
      return NextResponse.json({ error: 'Comment ID and reaction type are required' }, { status: 400 });
    }

    // Validate reaction type
    const validReactions = ['like', 'love', 'helpful'];
    if (!validReactions.includes(reactionType)) {
      return NextResponse.json({ error: 'Invalid reaction type' }, { status: 400 });
    }

    // Get user's organization to ensure access
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id, first_name, last_name')
      .eq('id', user.userId)
      .single();

    if (!userData?.organization_id) {
      return NextResponse.json({ error: 'User organization not found' }, { status: 404 });
    }

    // Verify comment exists and user has access via organization
    const { data: comment } = await supabase
      .from('document_comments')
      .select(`
        id,
        document_id,
        documents!inner(
          id,
          project_id,
          projects!inner(id, organization_id)
        )
      `)
      .eq('id', commentId)
      .eq('documents.projects.organization_id', userData.organization_id)
      .single();

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found or access denied' }, { status: 404 });
    }

    // Check if user already has a reaction on this comment
    const { data: existingReaction } = await supabase
      .from('comment_reactions')
      .select('*')
      .eq('comment_id', commentId)
      .eq('user_id', user.userId)
      .single();

    let reaction;
    let action;

    if (existingReaction) {
      if (existingReaction.reaction_type === reactionType) {
        // Same reaction - remove it (toggle off)
        const { error: deleteError } = await supabase
          .from('comment_reactions')
          .delete()
          .eq('id', existingReaction.id);

        if (deleteError) {
          console.error('Error removing reaction:', deleteError);
          return NextResponse.json({ error: 'Failed to remove reaction' }, { status: 500 });
        }

        action = 'removed';
        reaction = null;
      } else {
        // Different reaction - update it
        const { data: updatedReaction, error: updateError } = await supabase
          .from('comment_reactions')
          .update({
            reaction_type: reactionType,
            created_at: new Date().toISOString()
          })
          .eq('id', existingReaction.id)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating reaction:', updateError);
          return NextResponse.json({ error: 'Failed to update reaction' }, { status: 500 });
        }

        action = 'updated';
        reaction = {
          id: updatedReaction.id,
          userId: updatedReaction.user_id,
          userName: `${userData.first_name} ${userData.last_name}`,
          type: updatedReaction.reaction_type,
          createdAt: updatedReaction.created_at
        };
      }
    } else {
      // No existing reaction - add new one
      const { data: newReaction, error: insertError } = await supabase
        .from('comment_reactions')
        .insert({
          comment_id: commentId,
          user_id: user.userId,
          reaction_type: reactionType
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error adding reaction:', insertError);
        return NextResponse.json({ error: 'Failed to add reaction' }, { status: 500 });
      }

      action = 'added';
      reaction = {
        id: newReaction.id,
        userId: newReaction.user_id,
        userName: `${userData.first_name} ${userData.last_name}`,
        type: newReaction.reaction_type,
        createdAt: newReaction.created_at
      };
    }

    // Get updated reaction counts for the comment
    const { data: reactionCounts } = await supabase
      .from('comment_reactions')
      .select('reaction_type')
      .eq('comment_id', commentId);

    const counts = {
      like: 0,
      love: 0,
      helpful: 0
    };

    reactionCounts?.forEach(r => {
      if (counts.hasOwnProperty(r.reaction_type)) {
        counts[r.reaction_type as keyof typeof counts]++;
      }
    });

    return NextResponse.json({
      success: true,
      action,
      reaction,
      counts,
      message: `Reaction ${action} successfully`
    });

  } catch (error) {
    console.error('Error in POST /api/comments/reactions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - Get reactions for a comment
export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('commentId');

    if (!commentId) {
      return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 });
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

    // Verify comment exists and user has access
    const { data: comment } = await supabase
      .from('document_comments')
      .select(`
        id,
        documents!inner(
          id,
          projects!inner(id, organization_id)
        )
      `)
      .eq('id', commentId)
      .eq('documents.projects.organization_id', userData.organization_id)
      .single();

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found or access denied' }, { status: 404 });
    }

    // Get all reactions for the comment
    const { data: reactions, error } = await supabase
      .from('comment_reactions')
      .select(`
        *,
        user:users!comment_reactions_user_id_fkey(id, first_name, last_name)
      `)
      .eq('comment_id', commentId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching reactions:', error);
      return NextResponse.json({ error: 'Failed to fetch reactions' }, { status: 500 });
    }

    // Transform reactions
    const transformedReactions = reactions?.map(reaction => ({
      id: reaction.id,
      userId: reaction.user_id,
      userName: `${reaction.user.first_name} ${reaction.user.last_name}`,
      type: reaction.reaction_type,
      createdAt: reaction.created_at
    })) || [];

    // Calculate counts
    const counts = {
      like: 0,
      love: 0,
      helpful: 0
    };

    transformedReactions.forEach(reaction => {
      if (counts.hasOwnProperty(reaction.type)) {
        counts[reaction.type as keyof typeof counts]++;
      }
    });

    return NextResponse.json({
      reactions: transformedReactions,
      counts
    });

  } catch (error) {
    console.error('Error in GET /api/comments/reactions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

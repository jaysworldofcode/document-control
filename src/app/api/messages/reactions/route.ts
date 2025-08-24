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

// POST - Add or update a reaction to a message
export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { messageId, reaction } = body;

    if (!messageId || !reaction) {
      return NextResponse.json({ error: 'Message ID and reaction are required' }, { status: 400 });
    }

    // Verify the message exists and user is a participant
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .select('sender_id, recipient_id')
      .eq('id', messageId)
      .single();

    if (messageError || !message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Check if user is allowed to react to this message
    if (message.sender_id !== user.userId && message.recipient_id !== user.userId) {
      return NextResponse.json({ error: 'You are not a participant in this conversation' }, { status: 403 });
    }

    // Insert the reaction (upsert in case it already exists)
    const { data: reactionData, error: reactionError } = await supabase
      .from('message_reactions')
      .upsert({
        message_id: messageId,
        user_id: user.userId,
        reaction: reaction,
      })
      .select();

    if (reactionError) {
      console.error('Error adding reaction:', reactionError);
      return NextResponse.json({ error: 'Failed to add reaction' }, { status: 500 });
    }

    return NextResponse.json({ reaction: reactionData[0] }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/messages/reactions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Remove a reaction from a message
export async function DELETE(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { messageId, reaction } = body;

    if (!messageId || !reaction) {
      return NextResponse.json({ error: 'Message ID and reaction are required' }, { status: 400 });
    }

    // Delete the reaction
    const { error: deleteError } = await supabase
      .from('message_reactions')
      .delete()
      .eq('message_id', messageId)
      .eq('user_id', user.userId)
      .eq('reaction', reaction);

    if (deleteError) {
      console.error('Error removing reaction:', deleteError);
      return NextResponse.json({ error: 'Failed to remove reaction' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in DELETE /api/messages/reactions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

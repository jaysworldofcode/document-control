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

// POST - Mark a message as read
export async function POST(
  request: NextRequest,
  { params }: { params: { messageId: string } }
) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Access messageId from params (params is already resolved in this function signature)
    const { messageId } = params;
    if (!messageId) {
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 });
    }

    // Verify the message exists and is addressed to the current user
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .select('id, recipient_id, read_at')
      .eq('id', messageId)
      .single();

    if (messageError || !message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Ensure the user is the recipient of the message
    if (message.recipient_id !== user.userId) {
      return NextResponse.json({ error: 'Unauthorized to mark this message as read' }, { status: 403 });
    }

    // Only update if not already marked as read
    if (!message.read_at) {
      const { error: updateError } = await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('id', messageId);

      if (updateError) {
        console.error('Error marking message as read:', updateError);
        return NextResponse.json({ error: 'Failed to mark message as read' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in POST /api/messages/read/[messageId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

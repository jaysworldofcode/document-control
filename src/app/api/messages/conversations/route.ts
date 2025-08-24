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

// GET - Get all conversations for current user
export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get conversations where user is either sender or recipient
    const { data: conversations, error } = await supabase
      .from('messages')
      .select(`
        id,
        message,
        sent_at,
        read_at,
        sender_id,
        recipient_id,
        sender:sender_id(id, first_name, last_name, email),
        recipient:recipient_id(id, first_name, last_name, email)
      `)
      .or(`sender_id.eq.${user.userId},recipient_id.eq.${user.userId}`)
      .order('sent_at', { ascending: false });

    if (error) {
      console.error('Error fetching conversations:', error);
      return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
    }

    // Group messages by conversation partner
    const conversationMap = new Map();

    conversations?.forEach(message => {
      const otherUserId = message.sender_id === user.userId ? message.recipient_id : message.sender_id;
      const otherUser = message.sender_id === user.userId ? message.recipient : message.sender;

      if (!conversationMap.has(otherUserId)) {
        conversationMap.set(otherUserId, {
          userId: otherUserId,
          user: otherUser,
          lastMessage: message.message,
          lastMessageTime: message.sent_at,
          lastMessageSender: message.sender_id,
          isRead: message.recipient_id === user.userId ? !!message.read_at : true,
          unreadCount: 0
        });
      }

      // Count unread messages
      if (message.recipient_id === user.userId && !message.read_at) {
        const conversation = conversationMap.get(otherUserId);
        conversation.unreadCount += 1;
      }
    });

    const conversationsList = Array.from(conversationMap.values())
      .sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());

    return NextResponse.json({ conversations: conversationsList });

  } catch (error) {
    console.error('Error in GET /api/messages/conversations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

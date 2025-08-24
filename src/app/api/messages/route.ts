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

// GET - Get messages between current user and another user
export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const otherUserId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!otherUserId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get messages between the two users
    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        id,
        message,
        sent_at,
        read_at,
        sender:sender_id(id, first_name, last_name, email),
        recipient:recipient_id(id, first_name, last_name, email)
      `)
      .or(`and(sender_id.eq.${user.userId},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${user.userId})`)
      .order('sent_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching messages:', error);
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }

    // Fetch attachments for these messages
    const messageIds = messages?.map(msg => msg.id) || [];
    let messageAttachments: any[] = [];
    let messageReactions: any[] = [];
    
    if (messageIds.length > 0) {
      // Get attachments
      const { data: attachments } = await supabase
        .from('message_attachments')
        .select('*')
        .in('message_id', messageIds);
        
      messageAttachments = attachments || [];
      
      // Get reactions
      const { data: reactions } = await supabase
        .from('message_reactions')
        .select(`
          id,
          message_id,
          user_id,
          reaction,
          created_at,
          user:user_id(id, first_name, last_name)
        `)
        .in('message_id', messageIds);
        
      messageReactions = reactions || [];
    }

    // Mark messages as read if they were sent to current user
    const unreadMessageIds = messages
      ?.filter(msg => {
        if (!msg.recipient || !msg.sender) return false;
        // Get recipient ID safely
        let recipientId;
        if (Array.isArray(msg.recipient)) {
          recipientId = msg.recipient[0]?.id;
        } else if (typeof msg.recipient === 'object') {
          recipientId = (msg.recipient as any).id;
        }
        return recipientId === user.userId && !msg.read_at;
      })
      .map(msg => msg.id) || [];

    if (unreadMessageIds.length > 0) {
      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .in('id', unreadMessageIds);
    }
    
    // Associate attachments and reactions with their messages
    const messagesWithAttachmentsAndReactions = messages?.map(msg => {
      // Get attachments for this message
      const attachments = messageAttachments.filter(
        attachment => attachment.message_id === msg.id
      );
      
      // Get reactions for this message
      const reactions = messageReactions.filter(
        reaction => reaction.message_id === msg.id
      );
      
      return {
        ...msg,
        attachments: attachments.length > 0 ? attachments : undefined,
        reactions: reactions.length > 0 ? reactions : undefined
      };
    }) || [];

    return NextResponse.json({ messages: messagesWithAttachmentsAndReactions });

  } catch (error) {
    console.error('Error in GET /api/messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Send a new message
export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { recipientId, message, attachments } = body;

    if (!recipientId || (!message && (!attachments || attachments.length === 0))) {
      return NextResponse.json({ error: 'Recipient ID and either message or attachments are required' }, { status: 400 });
    }

    if (recipientId === user.userId) {
      return NextResponse.json({ error: 'Cannot send message to yourself' }, { status: 400 });
    }

    // Verify recipient exists and is in same organization
    const { data: recipient, error: recipientError } = await supabase
      .from('users')
      .select('id, organization_id')
      .eq('id', recipientId)
      .single();

    if (recipientError || !recipient) {
      return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });
    }

    // Get current user's organization
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.userId)
      .single();

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if users are in same organization
    if (recipient.organization_id !== currentUser.organization_id) {
      return NextResponse.json({ error: 'Can only message users in your organization' }, { status: 403 });
    }

    // Insert the message
    console.log(`API: Sending message from ${user.userId} to ${recipientId}: "${message?.trim() || '<attachment only>'}" with ${attachments?.length || 0} attachments`);
    
    const { data: newMessage, error: insertError } = await supabase
      .from('messages')
      .insert({
        sender_id: user.userId,
        recipient_id: recipientId,
        message: message?.trim() || '', // Empty string if no message (attachment only)
        // Adding a small random value to ensure timestamp uniqueness
        sent_at: new Date().toISOString()
      })
      .select(`
        id,
        message,
        sent_at,
        read_at,
        sender:sender_id(id, first_name, last_name, email),
        recipient:recipient_id(id, first_name, last_name, email)
      `)
      .single();

    if (insertError) {
      console.error('Error sending message:', insertError);
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }
    
    // If there are attachments, save them to the database
    if (attachments && attachments.length > 0) {
      console.log(`Saving ${attachments.length} attachments for message ${newMessage.id}`);
      
      try {
        const attachmentRows = attachments.map((attachment: any) => ({
          message_id: newMessage.id,
          file_name: attachment.fileName,
          file_size: attachment.fileSize,
          file_type: attachment.fileType,
          file_path: attachment.path,
          uploaded_by: user.userId
        }));
        
        // First try with rpc call to bypass RLS completely
        const { error: rpcError } = await supabase.rpc('insert_message_attachments', {
          attachment_data: JSON.stringify(attachmentRows)
        });
        
        // If RPC failed, fall back to direct insert with service role
        if (rpcError) {
          console.error('RPC insert failed, falling back to direct insert:', rpcError);
          
          const { error: attachmentError } = await supabase
            .from('message_attachments')
            .insert(attachmentRows);
          
          if (attachmentError) {
            console.error('Error saving attachments via direct insert:', attachmentError);
            // Continue with the flow even if attachments failed
          }
        }
        
        // Fetch the attachments to include with the response
        const { data: messageAttachments } = await supabase
          .from('message_attachments')
          .select('*')
          .eq('message_id', newMessage.id);
        
        // Add attachments to the message object
        if (messageAttachments) {
          (newMessage as any).attachments = messageAttachments;
        }
      } catch (error) {
        console.error('Unexpected error saving attachments:', error);
        // Continue with the flow even if attachments failed
      }
    }

    if (insertError) {
      console.error('Error sending message:', insertError);
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }
    
    console.log('API: Message sent successfully:', {
      id: newMessage.id,
      message: newMessage.message,
      sent_at: newMessage.sent_at
    });

    return NextResponse.json({ message: newMessage }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

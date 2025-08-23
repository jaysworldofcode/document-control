import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import { uploadChatAttachmentToStorage } from '@/utils/chat-storage';

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

// GET /api/chat - Fetch chat messages for a project
export async function GET(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  if (!projectId) {
    return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
  }

  try {
    // Check if user has access to this project
    // First, check if user is organization owner
    const { data: project } = await supabase
      .from('projects')
      .select('id, organization_id')
      .eq('id', projectId)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check if user is organization owner
    const { data: orgOwnerCheck } = await supabase
      .from('organizations')
      .select('owner_id')
      .eq('id', user.organizationId)
      .single();

    const isOrgOwner = orgOwnerCheck?.owner_id === user.userId;

    // If not org owner, check if user is project manager or team member
    let hasProjectAccess = isOrgOwner;
    
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

      hasProjectAccess = !!(managerCheck || teamCheck);
    }

    if (!hasProjectAccess) {
      return NextResponse.json({ error: 'Access denied to this project' }, { status: 403 });
    }

    // Fetch chat messages with user info, reactions, and attachments
    const { data: messages, error } = await supabase
      .from('project_chat_messages')
      .select(`
        id,
        project_id,
        user_id,
        content,
        message_type,
        reply_to,
        is_edited,
        created_at,
        updated_at,
        users(first_name, last_name, email),
        project_chat_reactions(
          id,
          reaction_type,
          created_at,
          users(id, first_name, last_name)
        ),
        project_chat_attachments(
          id,
          file_name,
          file_size,
          file_type,
          file_url,
          created_at
        )
      `)
      .eq('project_id', projectId)
      .eq('organization_id', user.organizationId)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching messages:', error);
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }

    // Format messages to match ChatMessage interface
    const formattedMessages = messages?.map(msg => ({
      id: msg.id,
      projectId: msg.project_id,
      userId: msg.user_id,
      userName: `${(msg.users as any)?.first_name || ''} ${(msg.users as any)?.last_name || ''}`.trim() || 'Unknown User',
      userEmail: (msg.users as any)?.email || '',
      content: msg.content,
      createdAt: msg.created_at,
      updatedAt: msg.updated_at,
      isEdited: msg.is_edited,
      messageType: msg.message_type,
      replyTo: msg.reply_to,
      attachments: (msg.project_chat_attachments || []).map((attachment: any) => ({
        id: attachment.id,
        fileName: attachment.file_name,
        fileSize: attachment.file_size,
        fileType: attachment.file_type,
        url: attachment.file_url
      })),
      reactions: (msg.project_chat_reactions || []).map((reaction: any) => ({
        id: reaction.id,
        type: reaction.reaction_type,
        userId: reaction.users?.id,
        userName: `${reaction.users?.first_name || ''} ${reaction.users?.last_name || ''}`.trim() || 'Unknown User',
        createdAt: reaction.created_at
      }))
    })) || [];

    return NextResponse.json(formattedMessages);
  } catch (error) {
    console.error('Error in chat GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/chat - Send a new chat message
export async function POST(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Check if this is a multipart form data request (with files)
    const contentType = request.headers.get('content-type') || '';
    let body: any;
    let attachments: File[] = [];

    if (contentType.includes('multipart/form-data')) {
      // Handle file upload
      const formData = await request.formData();
      body = {
        projectId: formData.get('projectId') as string,
        content: formData.get('content') as string,
        messageType: formData.get('messageType') as string || 'text',
        replyTo: formData.get('replyTo') as string
      };

      // Get all files from form data
      const fileEntries = Array.from(formData.entries()).filter(([key]) => key.startsWith('file_'));
      attachments = fileEntries.map(([, value]) => value as File);
    } else {
      // Handle JSON request
      body = await request.json();
    }

    const { projectId, content, messageType = 'text', replyTo } = body;

    if (!projectId || (!content && attachments.length === 0)) {
      return NextResponse.json({ error: 'Project ID and content or attachments are required' }, { status: 400 });
    }

    // Check if user has access to this project
    // First, check if user is organization owner
    const { data: project } = await supabase
      .from('projects')
      .select('id, organization_id')
      .eq('id', projectId)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check if user is organization owner
    const { data: orgOwnerCheck } = await supabase
      .from('organizations')
      .select('owner_id')
      .eq('id', user.organizationId)
      .single();

    const isOrgOwner = orgOwnerCheck?.owner_id === user.userId;

    // If not org owner, check if user is project manager or team member
    let hasProjectAccess = isOrgOwner;
    
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

      hasProjectAccess = !!(managerCheck || teamCheck);
    }

    if (!hasProjectAccess) {
      return NextResponse.json({ error: 'Access denied to this project' }, { status: 403 });
    }

    // Insert the message
    const { data: message, error } = await supabase
      .from('project_chat_messages')
      .insert({
        project_id: projectId,
        user_id: user.userId,
        content: content || '',
        message_type: attachments.length > 0 ? 'file' : messageType,
        reply_to: replyTo || null,
        organization_id: user.organizationId
      })
      .select(`
        id,
        project_id,
        user_id,
        content,
        message_type,
        reply_to,
        is_edited,
        created_at,
        updated_at,
        users(first_name, last_name, email)
      `)
      .single();

    if (error) {
      console.error('Error inserting message:', error);
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }

    // Upload attachments if any
    const uploadedAttachments = [];
    for (const file of attachments) {
      try {
        const { storagePath, storageUrl } = await uploadChatAttachmentToStorage(file, user.userId, message.id);
        
        const { data: attachment, error: attachmentError } = await supabase
          .from('project_chat_attachments')
          .insert({
            message_id: message.id,
            file_name: file.name,
            file_size: file.size,
            file_type: file.type,
            file_url: storageUrl
          })
          .select()
          .single();

        if (attachmentError) {
          console.error('Error creating attachment record:', attachmentError);
          // Don't fail the whole message for attachment errors
          continue;
        }

        uploadedAttachments.push({
          id: attachment.id,
          fileName: attachment.file_name,
          fileSize: attachment.file_size,
          fileType: attachment.file_type,
          url: attachment.file_url
        });
      } catch (uploadError) {
        console.error('Error uploading attachment:', uploadError);
        // Continue with other attachments
      }
    }

    // Format message to match ChatMessage interface
    const formattedMessage = {
      id: message.id,
      projectId: message.project_id,
      userId: message.user_id,
      userName: `${(message.users as any)?.first_name || ''} ${(message.users as any)?.last_name || ''}`.trim() || 'Unknown User',
      userEmail: (message.users as any)?.email || '',
      content: message.content,
      createdAt: message.created_at,
      updatedAt: message.updated_at,
      isEdited: message.is_edited,
      messageType: message.message_type,
      replyTo: message.reply_to,
      attachments: uploadedAttachments,
      reactions: []
    };

    return NextResponse.json(formattedMessage, { status: 201 });
  } catch (error) {
    console.error('Error in chat POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

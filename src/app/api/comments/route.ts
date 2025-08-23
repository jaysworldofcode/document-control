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

// Helper function to upload file to Supabase storage
async function uploadAttachmentToStorage(file: File, userId: string, commentId: string) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${commentId}/${Date.now()}_${file.name}`;
  
  const { data, error } = await supabase.storage
    .from('comment-attachments')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type
    });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('comment-attachments')
    .getPublicUrl(fileName);

  return {
    storagePath: fileName,
    storageUrl: urlData.publicUrl
  };
}

// GET - Fetch comments for a document
export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
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

    // Verify document exists and user has access via project
    const { data: document } = await supabase
      .from('documents')
      .select(`
        id,
        project_id,
        projects!inner(id, organization_id)
      `)
      .eq('id', documentId)
      .eq('projects.organization_id', userData.organization_id)
      .single();

    if (!document) {
      return NextResponse.json({ error: 'Document not found or access denied' }, { status: 404 });
    }

    // Fetch comments with user info, attachments, and reactions
    const { data: comments, error } = await supabase
      .from('document_comments')
      .select(`
        *,
        user:users!document_comments_user_id_fkey(id, first_name, last_name, email),
        attachments:comment_attachments(*),
        reactions:comment_reactions(
          *,
          user:users!comment_reactions_user_id_fkey(id, first_name, last_name)
        )
      `)
      .eq('document_id', documentId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
      return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
    }

    // Transform comments to match frontend interface
    const transformedComments = comments?.map(comment => ({
      id: comment.id,
      documentId: comment.document_id,
      userId: comment.user_id,
      userName: `${comment.user.first_name} ${comment.user.last_name}`,
      userEmail: comment.user.email,
      content: comment.content,
      createdAt: comment.created_at,
      updatedAt: comment.updated_at,
      isEdited: comment.is_edited,
      replyTo: comment.reply_to,
      attachments: comment.attachments?.map((att: any) => ({
        id: att.id,
        fileName: att.file_name,
        fileSize: att.file_size,
        fileType: att.file_type,
        url: att.storage_url
      })) || [],
      reactions: comment.reactions?.map((reaction: any) => ({
        id: reaction.id,
        userId: reaction.user_id,
        userName: `${reaction.user.first_name} ${reaction.user.last_name}`,
        type: reaction.reaction_type,
        createdAt: reaction.created_at
      })) || []
    })) || [];

    return NextResponse.json(transformedComments);
  } catch (error) {
    console.error('Error in GET /api/comments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Add a new comment with optional attachments
export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const documentId = formData.get('documentId') as string;
    const content = formData.get('content') as string;
    const replyTo = formData.get('replyTo') as string | null;
    
    // Get attachment files
    const attachments: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (key === 'attachments' && value instanceof File) {
        attachments.push(value);
      }
    }

    if (!documentId || (!content?.trim() && attachments.length === 0)) {
      return NextResponse.json({ error: 'Document ID and content or attachments are required' }, { status: 400 });
    }

    // Get user's organization to ensure access
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id, first_name, last_name, email')
      .eq('id', user.userId)
      .single();

    if (!userData?.organization_id) {
      return NextResponse.json({ error: 'User organization not found' }, { status: 404 });
    }

    // Verify document exists and user has access
    const { data: document } = await supabase
      .from('documents')
      .select(`
        id,
        project_id,
        projects!inner(id, organization_id)
      `)
      .eq('id', documentId)
      .eq('projects.organization_id', userData.organization_id)
      .single();

    if (!document) {
      return NextResponse.json({ error: 'Document not found or access denied' }, { status: 404 });
    }

    // Create the comment
    const { data: comment, error: commentError } = await supabase
      .from('document_comments')
      .insert({
        document_id: documentId,
        user_id: user.userId,
        content: content || '',
        reply_to: replyTo || null
      })
      .select()
      .single();

    if (commentError) {
      console.error('Error creating comment:', commentError);
      return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
    }

    // Upload attachments if any
    const uploadedAttachments = [];
    for (const file of attachments) {
      try {
        const { storagePath, storageUrl } = await uploadAttachmentToStorage(file, user.userId, comment.id);
        
        const { data: attachment, error: attachmentError } = await supabase
          .from('comment_attachments')
          .insert({
            comment_id: comment.id,
            file_name: file.name,
            file_size: file.size,
            file_type: file.type,
            storage_path: storagePath,
            storage_url: storageUrl,
            uploaded_by: user.userId
          })
          .select()
          .single();

        if (attachmentError) {
          console.error('Error creating attachment record:', attachmentError);
          // Don't fail the whole comment for attachment errors
          continue;
        }

        uploadedAttachments.push({
          id: attachment.id,
          fileName: attachment.file_name,
          fileSize: attachment.file_size,
          fileType: attachment.file_type,
          url: attachment.storage_url
        });
      } catch (uploadError) {
        console.error('Error uploading attachment:', uploadError);
        // Continue with other attachments
      }
    }

    // Return the created comment with user info
    const transformedComment = {
      id: comment.id,
      documentId: comment.document_id,
      userId: comment.user_id,
      userName: `${userData.first_name} ${userData.last_name}`,
      userEmail: userData.email,
      content: comment.content,
      createdAt: comment.created_at,
      updatedAt: comment.updated_at,
      isEdited: comment.is_edited,
      replyTo: comment.reply_to,
      attachments: uploadedAttachments,
      reactions: []
    };

    return NextResponse.json({
      success: true,
      comment: transformedComment,
      message: 'Comment added successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/comments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update a comment
export async function PUT(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { commentId, content } = body;

    if (!commentId || !content?.trim()) {
      return NextResponse.json({ error: 'Comment ID and content are required' }, { status: 400 });
    }

    // Verify comment exists and user owns it
    const { data: comment, error: fetchError } = await supabase
      .from('document_comments')
      .select('*')
      .eq('id', commentId)
      .eq('user_id', user.userId)
      .single();

    if (fetchError || !comment) {
      return NextResponse.json({ error: 'Comment not found or access denied' }, { status: 404 });
    }

    // Update the comment
    const { data: updatedComment, error: updateError } = await supabase
      .from('document_comments')
      .update({
        content,
        is_edited: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', commentId)
      .select(`
        *,
        user:users!document_comments_user_id_fkey(id, first_name, last_name, email)
      `)
      .single();

    if (updateError) {
      console.error('Error updating comment:', updateError);
      return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 });
    }

    const transformedComment = {
      id: updatedComment.id,
      documentId: updatedComment.document_id,
      userId: updatedComment.user_id,
      userName: `${updatedComment.user.first_name} ${updatedComment.user.last_name}`,
      userEmail: updatedComment.user.email,
      content: updatedComment.content,
      createdAt: updatedComment.created_at,
      updatedAt: updatedComment.updated_at,
      isEdited: updatedComment.is_edited,
      replyTo: updatedComment.reply_to
    };

    return NextResponse.json({
      success: true,
      comment: transformedComment,
      message: 'Comment updated successfully'
    });

  } catch (error) {
    console.error('Error in PUT /api/comments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete a comment
export async function DELETE(request: NextRequest) {
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

    // Verify comment exists and user owns it
    const { data: comment, error: fetchError } = await supabase
      .from('document_comments')
      .select('*, attachments:comment_attachments(*)')
      .eq('id', commentId)
      .eq('user_id', user.userId)
      .single();

    if (fetchError || !comment) {
      return NextResponse.json({ error: 'Comment not found or access denied' }, { status: 404 });
    }

    // Delete attachment files from storage
    if (comment.attachments && comment.attachments.length > 0) {
      const filePaths = comment.attachments.map((att: any) => att.storage_path);
      const { error: storageError } = await supabase.storage
        .from('comment-attachments')
        .remove(filePaths);
      
      if (storageError) {
        console.error('Error deleting attachment files:', storageError);
        // Continue with comment deletion even if file deletion fails
      }
    }

    // Delete the comment (this will cascade delete attachments and reactions)
    const { error: deleteError } = await supabase
      .from('document_comments')
      .delete()
      .eq('id', commentId);

    if (deleteError) {
      console.error('Error deleting comment:', deleteError);
      return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Comment deleted successfully'
    });

  } catch (error) {
    console.error('Error in DELETE /api/comments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

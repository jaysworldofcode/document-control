import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { logDocumentActivity } from '@/utils/document-logging';

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

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: documentId } = params;
    const formData = await request.formData();
    const comments = formData.get('comments') as string;
    const files = formData.getAll('files');

    // Get the current workflow and user's step
    const { data: workflow, error: workflowError } = await supabase
      .from('document_approval_workflows')
      .select(`
        *,
        document_approval_steps(*)
      `)
      .eq('document_id', documentId)
      .in('overall_status', ['pending', 'under-review'])
      .single();

    if (workflowError || !workflow) {
      return NextResponse.json({ error: 'No active workflow found' }, { status: 404 });
    }

    const userStep = workflow.document_approval_steps.find(
      (step: any) => step.approver_id === user.userId
    );

    if (!userStep) {
      return NextResponse.json({ error: 'Not authorized to reject this document' }, { status: 403 });
    }

    const now = new Date().toISOString();

    // Handle file uploads
    const uploadedFiles = [];
    for (const file of files) {
      const fileName = file.name;
      const fileType = file.type;
      const fileSize = file.size;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('rejection-attachments')
        .upload(`${documentId}/${userStep.id}/${fileName}`, file, {
          contentType: fileType,
          upsert: true
        });

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        continue;
      }

      // Create attachment record
      const { data: attachment, error: attachmentError } = await supabase
        .from('document_rejection_attachments')
        .insert({
          step_id: userStep.id,
          file_name: fileName,
          file_size: fileSize,
          file_type: fileType,
          storage_path: uploadData.path,
          uploaded_by: user.userId
        })
        .select()
        .single();

      if (attachmentError) {
        console.error('Error creating attachment record:', attachmentError);
        continue;
      }

      uploadedFiles.push(attachment);
    }

    // Update step status
    const { error: stepError } = await supabase
      .from('document_approval_steps')
      .update({
        status: 'rejected',
        comments,
        rejected_at: now,
        updated_at: now
      })
      .eq('id', userStep.id);

    if (stepError) {
      console.error('Error updating step:', stepError);
      return NextResponse.json({ error: 'Failed to update step' }, { status: 500 });
    }

    // Update workflow status
    const { error: workflowUpdateError } = await supabase
      .from('document_approval_workflows')
      .update({
        overall_status: 'rejected',
        completed_at: now,
        updated_at: now
      })
      .eq('id', workflow.id);

    if (workflowUpdateError) {
      console.error('Error updating workflow:', workflowUpdateError);
      return NextResponse.json({ error: 'Failed to update workflow' }, { status: 500 });
    }

    // Update document status
    const { error: docError } = await supabase
      .from('documents')
      .update({
        status: 'rejected',
        updated_at: now
      })
      .eq('id', documentId);

    if (docError) {
      console.error('Error updating document:', docError);
      return NextResponse.json({ error: 'Failed to update document' }, { status: 500 });
    }

    // Log the activity
    await logDocumentActivity(documentId, {
      action: 'rejected',
      description: 'Document rejected',
      details: {
        comments,
        attachments: uploadedFiles.length,
        step: userStep.step_order,
        totalSteps: workflow.total_steps
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Document rejected successfully',
      attachments: uploadedFiles
    });

  } catch (error) {
    console.error('Error in rejection:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

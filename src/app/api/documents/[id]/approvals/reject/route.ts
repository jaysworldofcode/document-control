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

export async function POST(request: NextRequest) {
  try {
    const now = new Date().toISOString();
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await request.nextUrl.pathname.split('/');
    const documentId = params[params.indexOf('documents') + 1];

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { comments, files } = body;

    // Get the current workflow and check if user is authorized to act on it
    const { data: workflow, error: workflowError } = await supabase
      .from('document_approval_workflows')
      .select(\`
        *,
        document_approval_steps(
          *,
          approver:users(id, first_name, last_name, email)
        )
      \`)
      .eq('document_id', documentId)
      .in('overall_status', ['pending', 'under-review'])
      .order('created_at', { ascending: false })
      .single();

    if (workflowError) {
      console.error('Error fetching workflow:', workflowError);
      return NextResponse.json({ error: 'Failed to fetch workflow' }, { status: 500 });
    }

    if (!workflow) {
      return NextResponse.json({ 
        error: 'No active approval workflow found for this document' 
      }, { status: 404 });
    }

    // Find the current user's step
    const userStep = workflow.document_approval_steps.find(
      step => step.approver_id === user.userId
    );

    if (!userStep) {
      return NextResponse.json({ 
        error: 'You are not an approver for this document' 
      }, { status: 403 });
    }

    // Check if it's the user's turn to approve (sequential approval)
    const currentStep = workflow.current_step;
    if (userStep.step_order !== currentStep) {
      return NextResponse.json({ 
        error: \`It's not your turn to approve. Currently waiting for approval from step \${currentStep}\` 
      }, { status: 403 });
    }

    if (userStep.status !== 'pending') {
      return NextResponse.json({ 
        error: 'You have already acted on this document' 
      }, { status: 409 });
    }

    // Update the approval step
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
      console.error('Error updating approval step:', stepError);
      return NextResponse.json({ error: 'Failed to update approval step' }, { status: 500 });
    }

    // Update workflow and document status
    const workflowUpdate = {
      overall_status: 'rejected',
      completed_at: now,
      updated_at: now
    };

    // Update the workflow
    const { error: updateError } = await supabase
      .from('document_approval_workflows')
      .update(workflowUpdate)
      .eq('id', workflow.id);

    if (updateError) {
      console.error('Error updating workflow:', updateError);
      return NextResponse.json({ error: 'Failed to update workflow' }, { status: 500 });
    }

    // Update document status to rejected
    const { error: docError } = await supabase
      .from('documents')
      .update({ 
        status: 'rejected', 
        updated_at: now 
      })
      .eq('id', documentId);

    if (docError) {
      console.error('Error updating document status:', docError);
      return NextResponse.json({ error: 'Failed to update document status' }, { status: 500 });
    }

    // If there are files, handle them
    if (files && files.length > 0) {
      for (const fileInfo of files) {
        // Create attachment record
        const { error: attachmentError } = await supabase
          .from('document_rejection_attachments')
          .insert({
            step_id: userStep.id,
            file_name: fileInfo.name,
            file_size: fileInfo.size,
            file_type: fileInfo.type,
            uploaded_by: user.userId,
            uploaded_at: now
          });

        if (attachmentError) {
          console.error('Error creating attachment record:', attachmentError);
          continue;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Document rejected successfully'
    });

  } catch (error) {
    console.error('Error in rejection action:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
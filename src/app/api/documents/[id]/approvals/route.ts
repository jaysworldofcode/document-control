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

// Helper function to check if user has access to the document
async function checkDocumentAccess(documentId: string, userId: string) {
  const { data: document } = await supabase
    .from('documents')
    .select(`
      id,
      project_id,
      projects!inner(
        id,
        organization_id,
        users!inner(id)
      )
    `)
    .eq('id', documentId)
    .eq('projects.users.id', userId)
    .single();

  return document;
}

// POST - Create a new approval workflow
export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await request.nextUrl.pathname.split('/');
    const documentId = params[params.indexOf('documents') + 1];

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    // Check if user has access to the document
    const document = await checkDocumentAccess(documentId, user.userId);
    if (!document) {
      return NextResponse.json({ error: 'Document not found or access denied' }, { status: 404 });
    }

    const body = await request.json();
    const { approvers, comments } = body;

    if (!approvers || !Array.isArray(approvers) || approvers.length === 0) {
      return NextResponse.json({ error: 'Approvers array is required and cannot be empty' }, { status: 400 });
    }

    // Check if there's already an active approval workflow for this document
    const { data: existingWorkflow } = await supabase
      .from('document_approval_workflows')
      .select('id, overall_status')
      .eq('document_id', documentId)
      .eq('overall_status', 'pending')
      .or('overall_status.eq.under-review')
      .single();

    if (existingWorkflow) {
      return NextResponse.json({ 
        error: 'Document already has an active approval workflow' 
      }, { status: 409 });
    }

    // Validate that all approvers are project members or managers
    const approverIds = approvers.map(a => a.id);

    // Get project team members
    const { data: teamMembers } = await supabase
      .from('project_team')
      .select('user_id')
      .eq('project_id', document.project_id)
      .in('user_id', approverIds);

    // Get project managers
    const { data: projectManagers } = await supabase
      .from('project_managers')
      .select('user_id')
      .eq('project_id', document.project_id)
      .in('user_id', approverIds);

    // Combine all valid user IDs
    const validUserIds = new Set([
      ...(teamMembers?.map(m => m.user_id) || []),
      ...(projectManagers?.map(m => m.user_id) || [])
    ]);

    // Check if all approvers are valid
    const allApproversValid = approverIds.every(id => validUserIds.has(id));

    if (!allApproversValid) {
      return NextResponse.json({ 
        error: 'All approvers must be members of the project' 
      }, { status: 400 });
    }

    // Update document status to pending_review
    const { error: docError } = await supabase
      .from('documents')
      .update({
        status: 'pending_review',
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId);

    if (docError) {
      console.error('Error updating document status:', docError);
      return NextResponse.json({ error: 'Failed to update document status' }, { status: 500 });
    }

    // Create the approval workflow
    const { data: workflow, error: workflowError } = await supabase
      .from('document_approval_workflows')
      .insert({
        document_id: documentId,
        requested_by: user.userId,
        total_steps: approvers.length,
        overall_status: 'pending',
        comments,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (workflowError) {
      console.error('Error creating approval workflow:', workflowError);
      return NextResponse.json({ error: 'Failed to create approval workflow' }, { status: 500 });
    }

    // Create approval steps
    const approvalSteps = approvers.map((approver, index) => ({
      workflow_id: workflow.id,
      approver_id: approver.id,
      step_order: index + 1,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    const { error: stepsError } = await supabase
      .from('document_approval_steps')
      .insert(approvalSteps);

    if (stepsError) {
      console.error('Error creating approval steps:', stepsError);
      // Rollback the workflow creation
      await supabase
        .from('document_approval_workflows')
        .delete()
        .eq('id', workflow.id);
      
      return NextResponse.json({ error: 'Failed to create approval steps' }, { status: 500 });
    }

    // Log the activity
    await logDocumentActivity(documentId, {
      action: 'status_change',
      description: `Document sent for approval to ${approvers.length} approvers`,
      details: {
        oldValue: 'draft',
        newValue: 'pending_review',
        reason: `Approvers: ${approvers.map(a => a.name).join(', ')}`
      }
    });

    // Fetch the complete workflow with steps and updated document for response
    const [{ data: completeWorkflow }, { data: updatedDocument }] = await Promise.all([
      supabase
        .from('document_approval_workflows')
        .select(`
          *,
          document_approval_steps(
            *,
            approver:users(id, first_name, last_name, email)
          )
        `)
        .eq('id', workflow.id)
        .single(),
      supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single()
    ]);

    return NextResponse.json({
      success: true,
      workflow: completeWorkflow,
      document: updatedDocument
    });

  } catch (error) {
    console.error('Error in approval workflow creation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - Get approval workflow for a document
export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await request.nextUrl.pathname.split('/');
    const documentId = params[params.indexOf('documents') + 1];

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    // Check if user has access to the document
    const document = await checkDocumentAccess(documentId, user.userId);
    if (!document) {
      return NextResponse.json({ error: 'Document not found or access denied' }, { status: 404 });
    }

    // Get the workflow with steps
    const { data: workflow, error } = await supabase
      .from('document_approval_workflows')
      .select(`
        *,
        requested_by_user:users!document_approval_workflows_requested_by_fkey(id, first_name, last_name, email),
        document_approval_steps(
          *,
          approver:users(id, first_name, last_name, email)
        )
      `)
      .eq('document_id', documentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error fetching approval workflow:', error);
      return NextResponse.json({ error: 'Failed to fetch approval workflow' }, { status: 500 });
    }

    return NextResponse.json({
      workflow: workflow || null
    });

  } catch (error) {
    console.error('Error in fetching approval workflow:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update approval workflow step (approve/reject)
export async function PUT(request: NextRequest) {
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
    const { action, comments } = body; // action: 'approve' | 'reject'

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Action must be either "approve" or "reject"' }, { status: 400 });
    }

    // Get the current workflow and check if user is authorized to act on it
    console.log('Looking for workflow for document:', documentId);
    const { data: workflow, error: workflowError } = await supabase
      .from('document_approval_workflows')
      .select(`
        *,
        document_approval_steps(
          *,
          approver:users(id, first_name, last_name, email)
        )
      `)
      .eq('document_id', documentId)
      .in('overall_status', ['pending', 'under-review'])
      .order('created_at', { ascending: false })
      .single();

    if (workflowError) {
      console.error('Error fetching workflow:', workflowError);
      return NextResponse.json({ error: 'Failed to fetch workflow' }, { status: 500 });
    }

    if (!workflow) {
      console.log('No workflow found with status pending/under-review');
      return NextResponse.json({ 
        error: 'No active approval workflow found for this document' 
      }, { status: 404 });
    }

    console.log('Found workflow:', {
      id: workflow.id,
      status: workflow.overall_status,
      currentStep: workflow.current_step,
      totalSteps: workflow.total_steps,
      stepsCount: workflow.document_approval_steps?.length
    });

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
    const sortedSteps = workflow.document_approval_steps.sort((a, b) => a.step_order - b.step_order);
    const currentStepData = sortedSteps.find(step => step.step_order === currentStep);

    // If this is the current approver and they haven't viewed the document yet,
    // update the document status to under_review
    if (userStep.step_order === currentStep && !userStep.viewed_document) {
      const { error: docError } = await supabase
        .from('documents')
        .update({ 
          status: 'under_review',
          updated_at: now 
        })
        .eq('id', documentId);

      if (docError) {
        console.error('Error updating document status:', docError);
        return NextResponse.json({ error: 'Failed to update document status' }, { status: 500 });
      }

      // Update the step to mark document as viewed
      const { error: stepError } = await supabase
        .from('document_approval_steps')
        .update({ 
          viewed_document: true,
          updated_at: now 
        })
        .eq('id', userStep.id);

      if (stepError) {
        console.error('Error updating step viewed status:', stepError);
        return NextResponse.json({ error: 'Failed to update step status' }, { status: 500 });
      }

      // Update workflow status
      const { error: workflowError } = await supabase
        .from('document_approval_workflows')
        .update({ 
          overall_status: 'under-review',
          updated_at: now 
        })
        .eq('id', workflow.id);

      if (workflowError) {
        console.error('Error updating workflow status:', workflowError);
        return NextResponse.json({ error: 'Failed to update workflow status' }, { status: 500 });
      }
    }

    if (userStep.step_order !== currentStep) {
      return NextResponse.json({ 
        error: `It's not your turn to approve. Currently waiting for approval from step ${currentStep}` 
      }, { status: 403 });
    }

    if (userStep.status !== 'pending') {
      return NextResponse.json({ 
        error: 'You have already acted on this document' 
      }, { status: 409 });
    }

    // Update the approval step
    const updateData = {
      status: action === 'approve' ? 'approved' : 'rejected',
      comments,
      updated_at: now,
      ...(action === 'approve' ? { approved_at: now } : { rejected_at: now })
    };

    const { error: stepError } = await supabase
      .from('document_approval_steps')
      .update(updateData)
      .eq('id', userStep.id);

    if (stepError) {
      console.error('Error updating approval step:', stepError);
      return NextResponse.json({ error: 'Failed to update approval step' }, { status: 500 });
    }

    // Update workflow and document status
    let workflowUpdate: any = {
      updated_at: now
    };

    if (action === 'reject') {
      // If rejected, mark workflow as rejected
      workflowUpdate.overall_status = 'rejected';
      workflowUpdate.completed_at = now;
      
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

    } else if (action === 'approve') {
      // If approved, check if this was the last step
      if (currentStep === workflow.total_steps) {
        // All steps completed - mark workflow as approved
        workflowUpdate.overall_status = 'approved';
        workflowUpdate.completed_at = now;
        
        // Update document status to approved
        const { error: docError } = await supabase
          .from('documents')
          .update({ 
            status: 'approved', 
            updated_at: now 
          })
          .eq('id', documentId);

        if (docError) {
          console.error('Error updating document status:', docError);
          return NextResponse.json({ error: 'Failed to update document status' }, { status: 500 });
        }
      } else {
        // Move to next step
        workflowUpdate.current_step = currentStep + 1;
        workflowUpdate.overall_status = 'under-review';
        
        // Update document status to under_review
        const { error: docError } = await supabase
          .from('documents')
          .update({ 
            status: 'under_review', 
            updated_at: now 
          })
          .eq('id', documentId);

        if (docError) {
          console.error('Error updating document status:', docError);
          return NextResponse.json({ error: 'Failed to update document status' }, { status: 500 });
        }
      }
    }

    // Update the workflow
    const { error: updateError } = await supabase
      .from('document_approval_workflows')
      .update(workflowUpdate)
      .eq('id', workflow.id);

    if (updateError) {
      console.error('Error updating workflow:', updateError);
      return NextResponse.json({ error: 'Failed to update workflow' }, { status: 500 });
    }

    // Log the activity
    await logDocumentActivity(documentId, {
      action: action === 'approve' ? 'approved' : 'rejected',
      description: action === 'approve' ? 'Document approved' : 'Document rejected',
      details: {
        comments,
        step: currentStep,
        totalSteps: workflow.total_steps
      }
    });

    return NextResponse.json({
      success: true,
      action,
      message: action === 'approve' ? 'Document approved successfully' : 'Document rejected successfully'
    });

  } catch (error) {
    console.error('Error in approval action:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

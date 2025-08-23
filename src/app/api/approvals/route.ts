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

// GET - Get documents pending approval for the current user
export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization to ensure we only show documents from their organization
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.userId)
      .single();

    if (!userData?.organization_id) {
      return NextResponse.json({ error: 'User organization not found' }, { status: 404 });
    }

    // Get approval workflows where:
    // 1. The user is an approver
    // 2. It's currently their turn to approve (sequential approval)
    // 3. Their step status is still 'pending'
    // 4. The overall workflow status is 'pending' or 'under-review'
    const { data: approvalSteps, error } = await supabase
      .from('document_approval_steps')
      .select(`
        *,
        workflow:document_approval_workflows(
          id,
          document_id,
          current_step,
          total_steps,
          overall_status,
          requested_by,
          requested_at,
          comments,
          requested_by_user:users(
            id, first_name, last_name, email
          ),
          document:documents(
            id,
            title,
            file_name,
            file_type,
            file_size,
            uploaded_at,
            project_id,
            sharepoint_path,
            custom_field_values,
            uploaded_by_user:users(
              id, first_name, last_name, email
            ),
            project:projects(
              id,
              name,
              organization_id
            )
          )
        ),
        approver:users(id, first_name, last_name, email)
      `)
      .eq('approver_id', user.userId)
      .eq('status', 'pending')
      .in('workflow.overall_status', ['pending', 'under-review'])
      .eq('workflow.document.project.organization_id', userData.organization_id);

    if (error) {
      console.error('Error fetching pending approvals:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch pending approvals',
        details: error.message,
        hint: error.hint,
        code: error.code
      }, { status: 500 });
    }

    // Filter to only include steps where it's the user's turn (sequential approval)
    const userTurnApprovals = approvalSteps?.filter(step => {
      const workflow = step.workflow;
      // Skip steps without workflow or document
      if (!workflow || !workflow.document) return false;
      return step.step_order === workflow.current_step;
    }) || [];

    // Transform the data to match the frontend Document interface
    const documents = userTurnApprovals.map(step => {
      const doc = step.workflow.document;
      const workflow = step.workflow;
      const uploadedByUser = doc.uploaded_by_user || { first_name: 'Unknown', last_name: 'User' };
      const approver = step.approver || { first_name: 'Unknown', last_name: 'User', email: '' };
      
      return {
        id: doc.id,
        name: doc.title || doc.file_name,
        fileName: doc.file_name,
        fileType: doc.file_type || '',
        fileSize: doc.file_size || 0,
        version: '1.0', // Default version since we don't store it in documents table
        status: workflow.overall_status || 'pending_review',
        uploadedBy: `${uploadedByUser.first_name} ${uploadedByUser.last_name}`,
        uploadedAt: doc.uploaded_at || workflow.created_at || new Date().toISOString(),
        lastModified: doc.uploaded_at || workflow.created_at || new Date().toISOString(),
        lastModifiedBy: `${uploadedByUser.first_name} ${uploadedByUser.last_name}`,
        sharePointPath: doc.sharepoint_path || '',
        description: '',
        tags: [],
        projectId: doc.project_id,
        customFieldValues: {},
        approvalWorkflow: {
          id: workflow.id,
          currentStep: workflow.current_step || 1,
          totalSteps: workflow.total_steps || 1,
          overallStatus: workflow.overall_status || 'pending',
          steps: [{
            id: step.id,
            approverId: step.approver_id,
            approverName: `${approver.first_name} ${approver.last_name}`,
            approverEmail: approver.email,
            department: '', // Could be added to user table if needed
            order: step.step_order || 1,
            status: step.status || 'pending',
            approvedAt: step.approved_at || null,
            rejectedAt: step.rejected_at || null,
            comments: step.comments || '',
            viewedDocument: step.viewed_document || false,
            downloadedDocument: step.downloaded_document || false,
            openedInSharePoint: step.opened_in_sharepoint || false
          }],
          requestedBy: workflow.requested_by,
          requestedAt: workflow.requested_at || workflow.created_at || new Date().toISOString(),
          completedAt: null
        },
        revisionHistory: [] // Could be populated if needed
      };
    });

    // Get project names for the documents
    const projectIds = [...new Set(documents.map(doc => doc.projectId))];
    const { data: projects } = await supabase
      .from('projects')
      .select('id, name')
      .in('id', projectIds);

    const projectMap = new Map(projects?.map(p => [p.id, p.name]) || []);

    // Add project names to the response
    const documentsWithProjects = documents.map(doc => ({
      ...doc,
      projectName: projectMap.get(doc.projectId) || 'Unknown Project'
    }));

    return NextResponse.json({
      documents: documentsWithProjects,
      totalCount: documentsWithProjects.length,
      message: documentsWithProjects.length === 0 
        ? 'No documents pending your approval' 
        : `${documentsWithProjects.length} document(s) pending your approval`
    });

  } catch (error) {
    console.error('Error in fetching user approvals:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

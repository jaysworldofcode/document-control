import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { logDocumentActivity } from '@/utils/document-logging';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper function to get SharePoint access token
async function getSharePointAccessToken(config: {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  siteUrl: string;
  documentLibrary?: string;
  versionControlEnabled?: boolean;
}) {
  try {
    
    // Check if we have an alternative token source for development/testing
    if (process.env.SHAREPOINT_DEV_TOKEN) {
      return process.env.SHAREPOINT_DEV_TOKEN;
    }
    
    const tokenUrl = `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/token`;
    
    const params = new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      scope: 'https://graph.microsoft.com/.default',
      grant_type: 'client_credentials',
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`Token request failed: ${response.status} ${errorText}`);
      
      // Check if it's a conditional access policy issue (53003 error code)
      if (errorText.includes('AADSTS53003') || errorText.includes('conditional access')) {
        console.log('Detected conditional access policy restriction');
        
        // Fallback to cached token if available
        if (process.env.SHAREPOINT_FALLBACK_TOKEN) {
          console.log('Using fallback token');
          return process.env.SHAREPOINT_FALLBACK_TOKEN;
        }
        
        throw new Error(`Access blocked by conditional access policies. This application requires administrator configuration to comply with your organization's security policies.`);
      }
      
      throw new Error(`Failed to get access token: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Error getting SharePoint access token:', error);
    
    // Final fallback for development/testing only
    if (process.env.SHAREPOINT_EMERGENCY_FALLBACK === 'true' && process.env.NODE_ENV !== 'production') {
      console.warn('Using emergency fallback token for development only');
      return process.env.SHAREPOINT_EMERGENCY_FALLBACK_TOKEN || 'fallback-token';
    }
    
    throw error;
  }
}

// Helper function to update Excel row by document ID (preserves existing data)
async function updateRowInExcelFile(accessToken: string, driveId: string, fileId: string, documentData: any) {
  try {
    
    // Get custom fields
    const customFields = documentData.projectCustomFields || [];
    const customFieldValues = documentData.customFieldValues || {};

    // Get the worksheet data to find the row with the matching document ID
    const workbookResponse = await fetch(`https://graph.microsoft.com/v1.0/drives/${driveId}/items/${fileId}/workbook/worksheets/Sheet1/usedRange`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!workbookResponse.ok) {
      return await addRowToExcelFile(accessToken, driveId, fileId, documentData);
    }

    const worksheetData = await workbookResponse.json();
    const values = worksheetData.values || [];
    
    if (values.length === 0) {
      return await addRowToExcelFile(accessToken, driveId, fileId, documentData);
    }

    // Find the row with matching document ID (should be in first column)
    const targetDocumentId = documentData.documentId;
    let targetRowIndex = -1;
    let existingRowData: any[] = [];
    
    for (let i = 0; i < values.length; i++) {
      const row = values[i];
      if (row[0] && row[0].toString() === targetDocumentId.toString()) {
        targetRowIndex = worksheetData.rowIndex + i; // Convert to 0-based Excel row number
        existingRowData = [...row]; // Copy existing row data
        break;
      }
    }

    if (targetRowIndex === -1) {
      return await addRowToExcelFile(accessToken, driveId, fileId, documentData);
    }

    // Rebuild the row with custom field values (in case they were lost in previous operations)
    // Create the complete row data: [documentId, status, ...customFieldValues]
    const completeRowData = [
      documentData.documentId,
      documentData.status,
      ...customFields.map((field: any) => {
        const value = customFieldValues[field.name] || customFieldValues[field.id];
        return value !== undefined ? value : '';
      })
    ];

    // Update the specific row with complete data (preserving + restoring custom fields)
    const updateRange = `Sheet1!A${targetRowIndex + 1}:${String.fromCharCode(65 + completeRowData.length - 1)}${targetRowIndex + 1}`;
    
    const updateResponse = await fetch(`https://graph.microsoft.com/v1.0/drives/${driveId}/items/${fileId}/workbook/worksheets/Sheet1/range(address='${updateRange}')`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: [completeRowData]
      })
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error('Excel update error:', errorText);
    }

  } catch (error) {
    console.error('Error updating row in Excel file:', error);
  }
}

// Helper function to add row to Excel file
async function addRowToExcelFile(accessToken: string, driveId: string, fileId: string, documentData: any) {
  try {
    console.log('addRowToExcelFile called with:', { driveId, fileId, documentId: documentData.documentId });
    
    // Get custom fields
    const customFields = documentData.projectCustomFields || [];
    const customFieldValues = documentData.customFieldValues || {};
    
    if (customFields.length === 0) {
      console.log('No custom fields defined, skipping Excel logging');
      return;
    }

    // Get the current used range to determine where to add the new row
    const workbookResponse = await fetch(`https://graph.microsoft.com/v1.0/drives/${driveId}/items/${fileId}/workbook/worksheets/Sheet1/usedRange`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    let nextRowIndex = 1; // Default to first row if worksheet is empty
    
    if (workbookResponse.ok) {
      const worksheetData = await workbookResponse.json();
      nextRowIndex = (worksheetData.rowIndex || 0) + (worksheetData.rowCount || 0) + 1;
    }

    // Prepare the row data: [documentId, status, ...customFieldValues]
    const rowData = [
      documentData.documentId,
      documentData.status,
      ...customFields.map((field: any) => {
        const value = customFieldValues[field.name];
        return value !== undefined ? value : '';
      })
    ];

    // Determine the range for the new row
    const endColumn = String.fromCharCode(65 + rowData.length - 1); // A, B, C, etc.
    const range = `A${nextRowIndex}:${endColumn}${nextRowIndex}`;
    
    const updateResponse = await fetch(`https://graph.microsoft.com/v1.0/drives/${driveId}/items/${fileId}/workbook/worksheets/Sheet1/range(address='${range}')`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: [rowData]
      })
    });
    
    if (updateResponse.ok) {
      console.log('Successfully added row to Excel worksheet');
    } else {
      const errorText = await updateResponse.text();
      console.log('Update range error:', errorText);
    }
    
  } catch (error) {
    console.error('Error adding row to Excel file:', error);
  }
}

// Helper function to handle SharePoint Excel status update
async function handleSharePointExcelUpdate(documentId: string, newStatus: string) {
  try {
    console.log('handleSharePointExcelUpdate called for document:', documentId, 'with status:', newStatus);

    // Get document with project and custom fields
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select(`
        *,
        projects!inner(
          id,
          name,
          custom_fields,
          organization_id
        )
      `)
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      console.log('Document not found or error:', docError);
      return;
    }

    // Get project SharePoint configurations
    const { data: sharePointConfigs } = await supabase
      .from('project_sharepoint_configs')
      .select('*')
      .eq('project_id', document.project_id)
      .eq('is_enabled', true);

    if (!sharePointConfigs || sharePointConfigs.length === 0) {
      console.log('No enabled SharePoint configurations found for this project');
      return;
    }

    // Find a config with Excel logging enabled
    const config = sharePointConfigs.find(config => 
      config.is_excel_logging_enabled && config.excel_sheet_path
    );

    if (!config) {
      console.log('Excel logging not enabled for this project');
      return;
    }

    // Get the organization's main SharePoint configuration for auth credentials
    const { data: orgConfig, error: orgConfigError } = await supabase
      .from('sharepoint_configs')
      .select('*')
      .eq('organization_id', document.projects.organization_id)
      .single();

    if (orgConfigError || !orgConfig) {
      console.error('Organization SharePoint config not found:', orgConfigError);
      return;
    }

    if (!orgConfig.tenant_id || !orgConfig.client_id || !orgConfig.client_secret) {
      console.log('Incomplete SharePoint credentials in organization config');
      return;
    }

    // Get SharePoint access token
    const accessToken = await getSharePointAccessToken({
      tenantId: orgConfig.tenant_id,
      clientId: orgConfig.client_id,
      clientSecret: orgConfig.client_secret,
      siteUrl: config.site_url,
      documentLibrary: config.document_library,
      versionControlEnabled: config.version_control_enabled
    });

    // Prepare document data for Excel update
    const documentData = {
      documentId: document.id,
      status: newStatus,
      projectCustomFields: document.projects.custom_fields || [],
      customFieldValues: document.custom_field_values || {}
    };

    // Parse SharePoint URL to get file info using the same approach as upload route
    let driveId, fileId;
    
    console.log('Excel sheet path:', config.excel_sheet_path);
    
    if (config.excel_sheet_path.startsWith('https://') && config.excel_sheet_path.includes('sharepoint.com')) {
      // Extract sourcedoc ID from SharePoint URL (same as upload route)
      const sourcedocMatch = config.excel_sheet_path.match(/sourcedoc=([^&]+)/);
      if (!sourcedocMatch) {
        console.log('Could not extract sourcedoc from SharePoint URL');
        return;
      }
      
      let sourcedocId = decodeURIComponent(sourcedocMatch[1]);
      // Remove the %7B and %7D (URL encoded { and }) if present
      sourcedocId = sourcedocId.replace(/^%7B|%7D$/g, '').replace(/^{|}$/g, '');
      
      console.log('Extracted sourcedoc ID:', sourcedocId);
      
      // Use Microsoft Graph to get the file by sourcedoc ID
      // First, get the site information
      const hostMatch = config.site_url.match(/https?:\/\/([^\/]+)/);
      const siteUrlMatch = config.site_url.match(/\/sites\/([^\/]+)/);
      
      if (!hostMatch || !siteUrlMatch) {
        console.log('Invalid SharePoint site URL format');
        return;
      }
      
      const hostname = hostMatch[1];
      const siteName = siteUrlMatch[1];
      
      // Get site information
      const siteInfoUrl = `https://graph.microsoft.com/v1.0/sites/${hostname}:/sites/${siteName}`;
      const siteResponse = await fetch(siteInfoUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!siteResponse.ok) {
        console.log(`Failed to get site information: ${siteResponse.status}`);
        return;
      }

      const siteData = await siteResponse.json();
      const siteId = siteData.id;
      
      // Search for the file by its ID across all drives in the site
      const searchUrl = `https://graph.microsoft.com/v1.0/sites/${siteId}/drives`;
      const drivesResponse = await fetch(searchUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!drivesResponse.ok) {
        console.log(`Failed to get drives: ${drivesResponse.status}`);
        return;
      }

      const drivesData = await drivesResponse.json();
      
      // Search for the file in each drive
      for (const drive of drivesData.value) {
        try {
          const fileSearchUrl = `https://graph.microsoft.com/v1.0/drives/${drive.id}/items/${sourcedocId}`;
          const fileResponse = await fetch(fileSearchUrl, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          });

          if (fileResponse.ok) {
            driveId = drive.id;
            fileId = sourcedocId;
            console.log(`✅ Found Excel file in drive: ${drive.name}`);
            break;
          }
        } catch (error) {
          // Continue to next drive
        }
      }
    }

    if (!driveId || !fileId) {
      console.log('Could not resolve Excel file location');
      return;
    }

    // Update the Excel file
    await updateRowInExcelFile(accessToken, driveId, fileId, documentData);
    console.log('Excel status update completed');

  } catch (error) {
    console.error('Error updating Excel with status change:', error);
  }
}

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
  console.log('🎯 BACKEND: POST /approvals endpoint reached!');
  console.log('🔍 BACKEND: Request URL:', request.url);
  console.log('🔍 BACKEND: Request method:', request.method);
  
  try {
    console.log('🚀 POST approval workflow called');
    
    const user = await verifyToken(request);
    if (!user) {
      console.log('❌ Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ User verified:', user.userId);

    const params = await request.nextUrl.pathname.split('/');
    const documentId = params[params.indexOf('documents') + 1];

    console.log('📄 Document ID extracted:', documentId);

    if (!documentId) {
      console.log('❌ No document ID provided');
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    // Check if user has access to the document
    console.log('🔍 Checking document access...');
    const document = await checkDocumentAccess(documentId, user.userId);
    if (!document) {
      console.log('❌ Document not found or access denied');
      return NextResponse.json({ error: 'Document not found or access denied' }, { status: 404 });
    }

    console.log('✅ Document access verified');

    const body = await request.json();
    const { approvers, comments } = body;

    console.log('📋 Request body:', { approvers: approvers?.length, comments });

    if (!approvers || !Array.isArray(approvers) || approvers.length === 0) {
      console.log('❌ Invalid approvers array');
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
    console.log('🔄 Updating document status to pending_review for document:', documentId);
    const { error: docError } = await supabase
      .from('documents')
      .update({
        status: 'pending_review',
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId);

    if (docError) {
      console.error('❌ Error updating document status:', docError);
      return NextResponse.json({ error: 'Failed to update document status' }, { status: 500 });
    }

    console.log('✅ Document status updated successfully to pending_review');

    // Update Excel with status change
    console.log('📊 Attempting Excel status update...');
    try {
      await handleSharePointExcelUpdate(documentId, 'pending_review');
      console.log('✅ Excel update completed successfully');
    } catch (excelError) {
      console.error('❌ Excel update failed:', excelError);
      // Don't fail the request if Excel update fails
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

    // Get the workflow with steps and attachments
    const { data: workflow, error } = await supabase
      .from('document_approval_workflows')
      .select(`
        *,
        requested_by_user:users!document_approval_workflows_requested_by_fkey(id, first_name, last_name, email),
        document_approval_steps(
          *,
          approver:users(id, first_name, last_name, email),
          attachments:document_rejection_attachments(*)
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
      (step: any) => step.approver_id === user.userId
    );

    if (!userStep) {
      return NextResponse.json({ 
        error: 'You are not an approver for this document' 
      }, { status: 403 });
    }

    // Check if it's the user's turn to approve (sequential approval)
    const currentStep = workflow.current_step;
    const sortedSteps = workflow.document_approval_steps.sort((a: any, b: any) => a.step_order - b.step_order);
    const currentStepData = sortedSteps.find((step: any) => step.step_order === currentStep);

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

      // Update Excel with status change
      try {
        await handleSharePointExcelUpdate(documentId, 'rejected');
      } catch (excelError) {
        console.error('Excel update failed:', excelError);
        // Don't fail the request if Excel update fails
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

        // Update Excel with status change
        try {
          await handleSharePointExcelUpdate(documentId, 'approved');
        } catch (excelError) {
          console.error('Excel update failed:', excelError);
          // Don't fail the request if Excel update fails
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

        // Update Excel with status change
        try {
          await handleSharePointExcelUpdate(documentId, 'under_review');
        } catch (excelError) {
          console.error('Excel update failed:', excelError);
          // Don't fail the request if Excel update fails
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
        reason: comments || ''
      },
      metadata: {
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

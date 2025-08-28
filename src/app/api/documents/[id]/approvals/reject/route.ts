import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

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
    console.log('🔐 Getting access token for SharePoint...');
    
    // Check if we have an alternative token source for development/testing
    if (process.env.SHAREPOINT_DEV_TOKEN) {
      console.log('Using development token from environment variables');
      return process.env.SHAREPOINT_DEV_TOKEN;
    }
    
    const tokenUrl = `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/token`;
    console.log(`Requesting token from ${tokenUrl}`);
    
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

    // Parse SharePoint URL to get file info
    let driveId, fileId;
    
    if (config.excel_sheet_path.startsWith('https://') && config.excel_sheet_path.includes('sharepoint.com')) {
      // Handle SharePoint URL
      const sourcedocMatch = config.excel_sheet_path.match(/sourcedoc=([^&]+)/);
      if (sourcedocMatch) {
        fileId = decodeURIComponent(sourcedocMatch[1]);
        
        // Find the drive containing this file
        const sitesResponse = await fetch('https://graph.microsoft.com/v1.0/sites?search=*', {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        
        if (sitesResponse.ok) {
          const sitesData = await sitesResponse.json();
          for (const site of sitesData.value) {
            try {
              const drivesResponse = await fetch(`https://graph.microsoft.com/v1.0/sites/${site.id}/drives`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
              });
              
              if (drivesResponse.ok) {
                const drivesData = await drivesResponse.json();
                for (const drive of drivesData.value) {
                  try {
                    const fileResponse = await fetch(`https://graph.microsoft.com/v1.0/drives/${drive.id}/items/${fileId}`, {
                      headers: { 'Authorization': `Bearer ${accessToken}` }
                    });
                    
                    if (fileResponse.ok) {
                      driveId = drive.id;
                      console.log(`Found Excel file in drive: ${drive.name} (${drive.id})`);
                      break;
                    }
                  } catch (e) {
                    // File not in this drive, continue
                  }
                }
              }
              if (driveId) break;
            } catch (e) {
              // Site not accessible, continue
            }
          }
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

// Helper function to update Excel row by document ID
async function updateRowInExcelFile(accessToken: string, driveId: string, fileId: string, documentData: any) {
  try {
    console.log('updateRowInExcelFile called with:', { driveId, fileId, documentId: documentData.documentId });
    
    // Get custom fields
    const customFields = documentData.projectCustomFields || [];
    const customFieldValues = documentData.customFieldValues || {};
    
    if (customFields.length === 0) {
      console.log('No custom fields defined, skipping Excel update');
      return;
    }

    // Get the worksheet data to find the row with the matching document ID
    const workbookResponse = await fetch(`https://graph.microsoft.com/v1.0/drives/${driveId}/items/${fileId}/workbook/worksheets/Sheet1/usedRange`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!workbookResponse.ok) {
      console.log('Worksheet is empty or file not found');
      return;
    }

    const worksheetData = await workbookResponse.json();
    const values = worksheetData.values || [];
    
    if (values.length === 0) {
      console.log('Worksheet is empty');
      return;
    }

    // Find the row with matching document ID (should be in first column)
    const targetDocumentId = documentData.documentId;
    let targetRowIndex = -1;
    
    for (let i = 0; i < values.length; i++) {
      const row = values[i];
      if (row[0] && row[0].toString() === targetDocumentId.toString()) {
        targetRowIndex = worksheetData.rowIndex + i + 1; // Convert to 1-based Excel row number
        break;
      }
    }

    if (targetRowIndex === -1) {
      console.log(`Document ID ${targetDocumentId} not found in Excel`);
      return;
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

    // Update the specific row
    const updateRange = `Sheet1!A${targetRowIndex}:${String.fromCharCode(65 + rowData.length - 1)}${targetRowIndex}`;
    
    const updateResponse = await fetch(`https://graph.microsoft.com/v1.0/drives/${driveId}/items/${fileId}/workbook/worksheets/Sheet1/range(address='${updateRange}')`, {
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
      console.log('Successfully updated Excel row');
    } else {
      const errorText = await updateResponse.text();
      console.log('Update row error:', errorText);
    }

  } catch (error) {
    console.error('Error updating row in Excel file:', error);
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
      return NextResponse.json({ 
        error: 'No active approval workflow found for this document' 
      }, { status: 404 });
    }

    // Define the step type based on the query structure
    interface ApprovalStep {
      id: string;
      approver_id: string;
      step_order: number;
      status: string;
      comments?: string;
      rejected_at?: string;
      updated_at?: string;
      approver?: {
        id: string;
        first_name: string;
        last_name: string;
        email: string;
      };
      [key: string]: any; // For any other properties
    }
    
    // Find the current user's step
    const userStep = workflow.document_approval_steps.find(
      (step: ApprovalStep) => step.approver_id === user.userId
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
        error: `It's not your turn to approve. Currently waiting for approval from step ${currentStep}` 
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

    // Update Excel with status change
    try {
      await handleSharePointExcelUpdate(documentId, 'rejected');
    } catch (excelError) {
      console.error('Excel update failed:', excelError);
      // Don't fail the request if Excel update fails
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
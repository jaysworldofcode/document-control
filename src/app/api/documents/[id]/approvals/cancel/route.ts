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
    
    const tokenUrl = `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/token`;
    console.log(`Requesting token from ${tokenUrl}`);
    
    const params = new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      scope: 'https://graph.microsoft.com/.default',
      grant_type: 'client_credentials'
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Token request failed:', response.status, errorText);
      throw new Error(`Failed to get access token: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Access token obtained successfully');
    return data.access_token;
  } catch (error) {
    console.error('Error getting SharePoint access token:', error);
    throw error;
  }
}

// Helper function to update existing row in Excel file (preserves other columns)
async function updateRowInExcelFile(accessToken: string, driveId: string, fileId: string, documentData: any) {
  try {
    console.log('updateRowInExcelFile called with:', { driveId, fileId, documentId: documentData.documentId });
    
    // Get custom fields
    const customFields = documentData.projectCustomFields || [];
    const customFieldValues = documentData.customFieldValues || {};
    
    if (customFields.length === 0) {
      console.log('No custom fields defined, only updating status');
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
      console.log(`Document ID ${targetDocumentId} not found in Excel`);
      return;
    }

    console.log('Found existing row at index:', targetRowIndex + 1, 'with data:', existingRowData);

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

    console.log('Rebuilding row with custom field values:', completeRowData);

    // Update the specific row with complete data (preserving + restoring custom fields)
    const updateRange = `Sheet1!A${targetRowIndex + 1}:${String.fromCharCode(65 + completeRowData.length - 1)}${targetRowIndex + 1}`;
    
    console.log('Updating range:', updateRange, 'with complete data:', completeRowData);
    
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

    if (updateResponse.ok) {
      console.log('✅ Successfully updated Excel row while preserving other data');
    } else {
      const errorText = await updateResponse.text();
      console.log('❌ Update row error:', errorText);
    }

  } catch (error) {
    console.error('Error updating row in Excel file:', error);
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

    // Parse SharePoint URL using the same approach as upload route
    let driveId, fileId;
    
    if (config.excel_sheet_path.startsWith('https://') && config.excel_sheet_path.includes('sharepoint.com')) {
      // Extract sourcedoc ID from SharePoint URL
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

    // Update the Excel file (preserving existing data)
    await updateRowInExcelFile(accessToken, driveId, fileId, documentData);
    console.log('Excel status update completed');

  } catch (error) {
    console.error('Error updating Excel with status change:', error);
  }
}

// Helper function implementation moved above (updateRowInExcelFile that preserves data)

// POST - Cancel approval workflow
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

    // First, let's check what workflows exist for this document
    const { data: allWorkflows, error: allWorkflowsError } = await supabase
      .from('document_approval_workflows')
      .select('*')
      .eq('document_id', documentId);

    console.log('🔍 All workflows for document:', allWorkflows);

    if (allWorkflowsError) {
      console.error('Error fetching all workflows:', allWorkflowsError);
    }

    // Also check the document status
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('status')
      .eq('id', documentId)
      .single();

    console.log('📄 Document status:', document?.status);

    if (docError) {
      console.error('Error fetching document:', docError);
    }

    // Get the current workflow
    const { data: workflows, error: workflowError } = await supabase
      .from('document_approval_workflows')
      .select('*')
      .eq('document_id', documentId)
      .in('overall_status', ['pending', 'under-review'])
      .order('created_at', { ascending: false })
      .limit(1);

    if (workflowError) {
      console.error('Error fetching workflow:', workflowError);
      return NextResponse.json({ error: 'Failed to fetch workflow' }, { status: 500 });
    }

    const now = new Date().toISOString();

    if (!workflows || workflows.length === 0) {
      console.log('🔍 No active workflow found, just updating document status to draft');
      
      // Just update the document status to draft
      console.log('🔄 Updating document status to draft (no workflow path)');
      const { error: updateError } = await supabase
        .from('documents')
        .update({
          status: 'draft',
          updated_at: now
        })
        .eq('id', documentId);

      if (updateError) {
        console.error('❌ Error updating document status (no workflow):', updateError);
        return NextResponse.json({ error: 'Failed to update document status' }, { status: 500 });
      }

      console.log('✅ Document status successfully updated to draft (no workflow path)');

      // Log the activity
      await logDocumentActivity(documentId, {
        action: 'status_change',
        description: 'Document status reset to draft',
        details: {
          oldValue: 'pending_review',
          newValue: 'draft',
          reason: 'No active workflow found, status reset'
        }
      });

      // Update Excel with status change (preserve other data)
      try {
        await handleSharePointExcelUpdate(documentId, 'draft');
        console.log('✅ Excel status updated to draft');
      } catch (excelError) {
        console.error('❌ Excel update failed:', excelError);
        // Don't fail the request if Excel update fails
      }

      return NextResponse.json({
        success: true,
        message: 'Document status updated to draft successfully'
      });
    }

    const workflow = workflows[0];

    // Delete the workflow and its steps (cascade delete will handle steps)
    const { error: deleteError } = await supabase
      .from('document_approval_workflows')
      .delete()
      .eq('id', workflow.id);

    if (deleteError) {
      console.error('Error deleting workflow:', deleteError);
      return NextResponse.json({ error: 'Failed to delete workflow' }, { status: 500 });
    }

    // Reset document status to draft
    console.log('🔄 Updating document status to draft for document:', documentId);
    const { error: updateError } = await supabase
      .from('documents')
      .update({
        status: 'draft',
        updated_at: now
      })
      .eq('id', documentId);

    if (updateError) {
      console.error('❌ Error updating document status:', updateError);
      return NextResponse.json({ error: 'Failed to update document status' }, { status: 500 });
    }

    console.log('✅ Document status successfully updated to draft');

    // Log the activity
    await logDocumentActivity(documentId, {
      action: 'status_change',
      description: 'Approval workflow cancelled',
      details: {
        oldValue: workflow.overall_status,
        newValue: 'draft',
        reason: 'Approval workflow cancelled by user'
      }
    });

    // Update Excel with status change (preserve other data)
    try {
      await handleSharePointExcelUpdate(documentId, 'draft');
    } catch (excelError) {
      console.error('Excel update failed:', excelError);
      // Don't fail the request if Excel update fails
    }

    return NextResponse.json({
      success: true,
      message: 'Approval workflow cancelled successfully'
    });

  } catch (error) {
    console.error('Error in cancelling approval workflow:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

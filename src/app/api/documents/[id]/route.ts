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
}) {
  try {
    const tokenUrl = `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/token`;
    
    const body = new URLSearchParams({
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
      body: body,
    });

    if (!response.ok) {
      throw new Error(`Failed to get access token: ${response.statusText}`);
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Error getting SharePoint access token:', error);
    throw error;
  }
}

// Helper function to find and update existing Excel row by document ID
async function updateRowInExcelFile(accessToken: string, driveId: string, fileId: string, documentData: any) {
  try {
    // Prepare custom field data
    const customFields = documentData.projectCustomFields || [];
    const customFieldValues = documentData.customFieldValues || {};
    
    // Create row data starting with document ID, then custom field values
    const customFieldRowData = customFields.map((field: any, index: number) => {
      let value = customFieldValues[field.name];
      
      // If field name doesn't match, try to find value by index
      if (value === undefined || value === null) {
        const formFieldKeys = Object.keys(customFieldValues);
        
        if (formFieldKeys.length > index) {
          value = customFieldValues[formFieldKeys[index]];
        }
      }
      
      if (value === undefined || value === null) {
        return '';
      }
      
      // Format the value based on field type
      switch (field.type) {
        case 'date':
          return value ? new Date(value).toISOString().split('T')[0] : '';
        case 'boolean':
        case 'checkbox':
          return value ? 'Yes' : 'No';
        case 'number':
          return typeof value === 'number' ? value.toString() : '';
        default:
          return value.toString();
      }
    });
    
    // Combine document ID as first column with custom field values
    const rowData = [documentData.documentId || '', ...customFieldRowData];
    
    if (customFieldRowData.length === 0) {
      console.log('No custom fields defined, skipping Excel update');
      return;
    }

    // Get all data from worksheet to find the document
    const worksheetDataUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${fileId}/workbook/worksheets('Sheet1')/usedRange`;
    
    const dataResponse = await fetch(worksheetDataUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!dataResponse.ok) {
      console.log('Could not get worksheet data for update');
      return;
    }

    const worksheetData = await dataResponse.json();
    
    if (!worksheetData.values || worksheetData.values.length === 0) {
      console.log('No existing data found in Excel');
      return;
    }

    // Find the row with matching document ID (first column)
    const targetDocumentId = documentData.documentId;
    let targetRowIndex = -1;
    
    for (let i = 0; i < worksheetData.values.length; i++) {
      const rowValues = worksheetData.values[i];
      if (rowValues[0] === targetDocumentId) {
        targetRowIndex = worksheetData.rowIndex + i + 1; // Convert to 1-based Excel row number
        break;
      }
    }

    if (targetRowIndex === -1) {
      console.log(`Document ID ${targetDocumentId} not found in Excel`);
      return;
    }

    console.log(`Found existing document at row ${targetRowIndex}, updating...`);

    // Update the existing row
    const startColumn = 'A';
    const endColumn = String.fromCharCode(64 + rowData.length);
    const range = `${startColumn}${targetRowIndex}:${endColumn}${targetRowIndex}`;
    
    const updateRangeUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${fileId}/workbook/worksheets('Sheet1')/range(address='${range}')`;
    
    const updateResponse = await fetch(updateRangeUrl, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [rowData]
      }),
    });
    
    if (updateResponse.ok) {
      console.log('Successfully updated Excel row');
    } else {
      const errorText = await updateResponse.text();
      console.log('Excel update error:', errorText);
    }

  } catch (error) {
    console.error('Error updating Excel row:', error);
  }
}

// Helper function to handle SharePoint Excel URL and extract file ID
async function handleSharePointExcelUpdate(config: any, accessToken: string, documentData: any) {
  try {
    const url = config.excelSheetPath;
    
    // Extract the sourcedoc ID from SharePoint URL
    const sourcedocMatch = url.match(/sourcedoc=%7B([^%]+)%7D/) || url.match(/sourcedoc=\{([^}]+)\}/);
    
    if (!sourcedocMatch) {
      console.log('Could not extract file ID from SharePoint URL');
      return;
    }
    
    const sourcedocId = sourcedocMatch[1].toUpperCase();
    
    // Get site information to find drives
    const hostMatch = config.siteUrl.match(/https?:\/\/([^\/]+)/);
    const siteUrlMatch = config.siteUrl.match(/\/sites\/([^\/]+)/);
    
    if (!hostMatch || !siteUrlMatch) {
      throw new Error('Invalid SharePoint site URL format');
    }
    
    const hostname = hostMatch[1];
    const siteName = siteUrlMatch[1];
    const siteInfoUrl = `https://graph.microsoft.com/v1.0/sites/${hostname}:/sites/${siteName}`;
    
    const siteResponse = await fetch(siteInfoUrl, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    if (!siteResponse.ok) {
      throw new Error('Failed to get site information');
    }

    const siteData = await siteResponse.json();
    const siteId = siteData.id;

    // Get drives to find the Excel file
    const drivesUrl = `https://graph.microsoft.com/v1.0/sites/${siteId}/drives`;
    const drivesResponse = await fetch(drivesUrl, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    if (!drivesResponse.ok) {
      throw new Error('Failed to get drives');
    }

    const drivesData = await drivesResponse.json();
    
    // Find the file in drives
    for (const drive of drivesData.value) {
      try {
        const fileUrl = `https://graph.microsoft.com/v1.0/drives/${drive.id}/items/${sourcedocId}`;
        const fileResponse = await fetch(fileUrl, {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        });
        
        if (fileResponse.ok) {
          console.log(`Found Excel file in drive: ${drive.name}`);
          await updateRowInExcelFile(accessToken, drive.id, sourcedocId, documentData);
          return;
        }
      } catch (error) {
        continue;
      }
    }
    
    console.log('Excel file not found in any drive');
    
  } catch (error) {
    console.error('Error handling SharePoint Excel update:', error);
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: documentId } = await params;
    const body = await request.json();
    
    const {
      description,
      tags,
      status,
      customFieldValues,
      versionNotes,
      isNewVersion,
      file
    } = body;

    // Debug logging
    console.log('Update request body:', {
      description,
      tags,
      status,
      customFieldValues,
      versionNotes,
      isNewVersion
    });

    // First, verify the document exists and user has permission
    const { data: existingDoc, error: fetchError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (fetchError || !existingDoc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // If uploading a new version, handle file upload first
    let newFileData = {};
    if (isNewVersion && file) {
      // For now, we'll just update the metadata without handling file upload
      // File upload would need to be handled separately with multipart/form-data
      console.log('New version upload requested but file handling not implemented in this endpoint');
    }

    // Update document metadata
    const updateData: any = {
      description,
      tags,
      status,
      custom_field_values: customFieldValues, // Use snake_case for database
      updated_at: new Date().toISOString()
    };

    // Debug logging
    console.log('Update data being sent to database:', updateData);
    console.log('Existing document custom_field_values:', existingDoc.custom_field_values);

    // Note: Version handling should be done through the document_versions table
    // For now, we're just updating the main document metadata

    const { data: updatedDoc, error: updateError } = await supabase
      .from('documents')
      .update(updateData)
      .eq('id', documentId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating document:', updateError);
      console.error('Update data that failed:', updateData);
      return NextResponse.json(
        { error: 'Failed to update document' },
        { status: 500 }
      );
    }

    console.log('Document updated successfully:', updatedDoc);

    // Log the update activity
    try {
      await supabase
        .from('document_activity_logs')
        .insert({
          document_id: documentId,
          user_id: user.userId,
          action: isNewVersion ? 'version_uploaded' : 'updated',
          details: {
            changes: {
              description: description !== existingDoc.description,
              tags: JSON.stringify(tags) !== JSON.stringify(existingDoc.tags),
              status: status !== existingDoc.status,
              custom_field_values: JSON.stringify(customFieldValues) !== JSON.stringify(existingDoc.custom_field_values)
            },
            versionNotes: isNewVersion ? versionNotes : undefined
          },
          created_at: new Date().toISOString()
        });
    } catch (logError) {
      console.error('Error logging activity:', logError);
      // Don't fail the request if logging fails
    }

    // Update Excel logging if enabled (only if custom fields were changed)
    if (JSON.stringify(customFieldValues) !== JSON.stringify(existingDoc.custom_field_values)) {
      try {
        // Get project and SharePoint configurations
        const { data: project, error: projectError } = await supabase
          .from('projects')
          .select(`
            *,
            project_sharepoint_configs(*)
          `)
          .eq('id', updatedDoc.project_id)
          .single();

        if (!projectError && project?.project_sharepoint_configs) {
          for (const config of project.project_sharepoint_configs) {
            if (config.is_excel_logging_enabled && config.excel_sheet_path) {
              const accessToken = await getSharePointAccessToken({
                tenantId: config.tenant_id,
                clientId: config.client_id,
                clientSecret: config.client_secret,
              });

              await handleSharePointExcelUpdate(
                {
                  siteUrl: config.site_url,
                  excelSheetPath: config.excel_sheet_path
                },
                accessToken,
                {
                  documentId: updatedDoc.id,
                  customFieldValues: customFieldValues || {},
                  projectCustomFields: project.custom_fields || []
                }
              );
            }
          }
        }
      } catch (excelError) {
        console.error('Error in Excel update logging:', excelError);
        // Don't fail the request if Excel logging fails
      }
    }

    return NextResponse.json({
      success: true,
      document: updatedDoc
    });

  } catch (error) {
    console.error('Error in document PATCH:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: documentId } = await params;

    const { data: document, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (error || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json({ document });

  } catch (error) {
    console.error('Error in document GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: documentId } = await params;

    // First, verify the document exists
    const { data: existingDoc, error: fetchError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (fetchError || !existingDoc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Delete the document
    const { error: deleteError } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId);

    if (deleteError) {
      console.error('Error deleting document:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete document' },
        { status: 500 }
      );
    }

    // Log the deletion activity
    try {
      await supabase
        .from('document_activity_logs')
        .insert({
          document_id: documentId,
          user_id: user.userId,
          action: 'deleted',
          details: {
            documentName: existingDoc.name,
            documentType: existingDoc.fileType
          },
          created_at: new Date().toISOString()
        });
    } catch (logError) {
      console.error('Error logging deletion:', logError);
      // Don't fail the request if logging fails
    }

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully'
    });

  } catch (error) {
    console.error('Error in document DELETE:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

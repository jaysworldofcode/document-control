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

// Helper function to get SharePoint access token
async function getSharePointAccessToken(config: any) {
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
    throw new Error('Failed to get access token');
  }

  const data = await response.json();
  return data.access_token;
}

// Helper function to upload file to SharePoint
async function uploadToSharePoint(file: File, config: any, accessToken: string, fileName: string) {
  try {
    console.log('SharePoint Config:', {
      siteUrl: config.siteUrl,
      tenantId: config.tenantId,
      documentLibrary: config.documentLibrary
    });

    // Extract hostname and site name for Graph API
    const hostMatch = config.siteUrl.match(/https?:\/\/([^\/]+)/);
    const siteUrlMatch = config.siteUrl.match(/\/sites\/([^\/]+)/);
    
    if (!hostMatch || !siteUrlMatch) {
      throw new Error('Invalid SharePoint site URL format. Expected format: https://tenant.sharepoint.com/sites/sitename');
    }
    
    const hostname = hostMatch[1];
    const siteName = siteUrlMatch[1];
    console.log('Extracted hostname:', hostname, 'siteName:', siteName);

    // Step 1: Get site information
    const siteInfoUrl = `https://graph.microsoft.com/v1.0/sites/${hostname}:/sites/${siteName}`;
    console.log('Site info URL:', siteInfoUrl);

    const siteResponse = await fetch(siteInfoUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Site response status:', siteResponse.status, siteResponse.statusText);

    if (!siteResponse.ok) {
      const errorText = await siteResponse.text();
      console.error('Site response error:', errorText);
      throw new Error(`Failed to get site information: ${siteResponse.status} - ${errorText}`);
    }

    const siteData = await siteResponse.json();
    console.log('Site data:', { id: siteData.id, name: siteData.name });
    const siteId = siteData.id;

    // Step 2: Get drives (document libraries)
    const driveUrl = `https://graph.microsoft.com/v1.0/sites/${siteId}/drives`;
    console.log('Drives URL:', driveUrl);
    
    const driveResponse = await fetch(driveUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!driveResponse.ok) {
      const driveError = await driveResponse.text();
      console.error('Drive response error:', driveError);
      throw new Error(`Failed to get drives: ${driveResponse.status} - ${driveError}`);
    }

    const driveData = await driveResponse.json();
    console.log('Available drives:', driveData.value?.map((d: any) => ({ name: d.name, id: d.id, driveType: d.driveType })));
    
    // Find the correct document library
    const targetLibrary = config.documentLibrary || 'Documents';
    console.log('Target library to find:', targetLibrary);
    
    let documentDrive = driveData.value?.find((drive: any) => {
      console.log(`Checking drive: ${drive.name} (type: ${drive.driveType}) against target: ${targetLibrary}`);
      return drive.name === targetLibrary;
    });

    // If exact name match fails, try case-insensitive match
    if (!documentDrive) {
      documentDrive = driveData.value?.find((drive: any) => 
        drive.name.toLowerCase() === targetLibrary.toLowerCase()
      );
      if (documentDrive) {
        console.log('Found library with case-insensitive match:', documentDrive.name);
      }
    }

    // If still no match and target is not 'Documents', try finding 'Documents' as fallback
    if (!documentDrive && targetLibrary !== 'Documents') {
      documentDrive = driveData.value?.find((drive: any) => 
        drive.name === 'Documents' || drive.name.toLowerCase() === 'documents'
      );
      if (documentDrive) {
        console.log('Falling back to Documents library:', documentDrive.name);
      }
    }

    // If still no exact match, use the first document library
    if (!documentDrive && driveData.value?.length > 0) {
      documentDrive = driveData.value.find((drive: any) => drive.driveType === 'documentLibrary') || driveData.value[0];
      console.log('Using first available document library drive:', documentDrive.name);
    }

    if (!documentDrive) {
      throw new Error(`No document library found. Target: ${targetLibrary}`);
    }

    console.log('Selected drive:', { name: documentDrive.name, id: documentDrive.id });

    // Step 3: Upload file to SharePoint
    const uploadUrl = `https://graph.microsoft.com/v1.0/drives/${documentDrive.id}/root:/${fileName}:/content`;
    console.log('Upload URL:', uploadUrl);
    
    const fileBuffer = await file.arrayBuffer();
    
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': file.type || 'application/octet-stream',
      },
      body: fileBuffer,
    });

    console.log('Upload response status:', uploadResponse.status, uploadResponse.statusText);

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('SharePoint upload failed:', errorText);
      throw new Error(`SharePoint upload failed: ${uploadResponse.status} - ${errorText}`);
    }

    const uploadData = await uploadResponse.json();
    console.log('Upload successful:', { 
      name: uploadData.name, 
      webUrl: uploadData.webUrl, 
      id: uploadData.id 
    });
    
    return {
      sharePointPath: uploadData.webUrl,
      sharePointId: uploadData.id,
      downloadUrl: uploadData['@microsoft.graph.downloadUrl'] || uploadData.webUrl
    };
  } catch (error) {
    console.error('SharePoint upload error:', error);
    throw error;
  }
}

// Helper function to log to Excel (if configured)
async function logToExcel(config: any, accessToken: string, documentData: any) {
  try {
    if (!config.isExcelLoggingEnabled || !config.excelSheetPath) {
      return;
    }

    // Extract hostname and site name
    const hostMatch = config.siteUrl.match(/https?:\/\/([^\/]+)/);
    const siteUrlMatch = config.siteUrl.match(/\/sites\/([^\/]+)/);
    
    if (!hostMatch || !siteUrlMatch) {
      throw new Error('Invalid SharePoint site URL format');
    }
    
    const hostname = hostMatch[1];
    const siteName = siteUrlMatch[1];

    // Get site information first using correct format
    const siteInfoUrl = `https://graph.microsoft.com/v1.0/sites/${hostname}:/sites/${siteName}`;
    
    const siteResponse = await fetch(siteInfoUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!siteResponse.ok) {
      throw new Error(`Failed to get site information: ${siteResponse.status}`);
    }

    const siteData = await siteResponse.json();
    const siteId = siteData.id;

    // Check if Excel file exists
    const excelFileUrl = `https://graph.microsoft.com/v1.0/sites/${siteId}/drive/root:${config.excelSheetPath}`;
    
    const fileResponse = await fetch(excelFileUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!fileResponse.ok) {
      console.log('Excel file not found, skipping Excel logging');
      return;
    }

    // Try to get existing tables
    const tablesUrl = `https://graph.microsoft.com/v1.0/sites/${siteId}/drive/root:${config.excelSheetPath}:/workbook/worksheets('Sheet1')/tables`;
    
    const tablesResponse = await fetch(tablesUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    let tableId = null;
    if (tablesResponse.ok) {
      const tablesData = await tablesResponse.json();
      if (tablesData.value && tablesData.value.length > 0) {
        tableId = tablesData.value[0].id;
      }
    }

    // If no table exists, create one
    if (!tableId) {
      const createTableUrl = `https://graph.microsoft.com/v1.0/sites/${siteId}/drive/root:${config.excelSheetPath}:/workbook/worksheets('Sheet1')/tables/add`;
      
      const createTableResponse = await fetch(createTableUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: 'A1:H1',
          hasHeaders: true,
          values: [['Document Name', 'File Name', 'File Type', 'File Size', 'Upload Date', 'Uploaded By', 'Project', 'SharePoint Path']]
        }),
      });

      if (createTableResponse.ok) {
        const tableData = await createTableResponse.json();
        tableId = tableData.id;
      }
    }

    // Add the document entry
    if (tableId) {
      const addRowUrl = `https://graph.microsoft.com/v1.0/sites/${siteId}/drive/root:${config.excelSheetPath}:/workbook/tables('${tableId}')/rows/add`;
      
      const rowData = [
        documentData.title,
        documentData.fileName,
        documentData.fileType,
        formatBytes(documentData.fileSize),
        new Date().toISOString().split('T')[0], // Date only
        documentData.uploadedBy,
        documentData.projectName,
        documentData.sharePointPath
      ];

      await fetch(addRowUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [rowData],
        }),
      });
    }
  } catch (error) {
    console.error('Excel logging error:', error);
    // Don't throw here - Excel logging is optional
  }
}

// Helper function to format file size
function formatBytes(bytes: number) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// POST - Upload a document with SharePoint integration
export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const projectId = formData.get('projectId') as string;
    const sharePointConfigId = formData.get('sharePointConfigId') as string; // New field for multiple configs
    const description = formData.get('description') as string;
    const tags = formData.get('tags') as string;
    const customFieldValues = formData.get('customFieldValues') as string;

    if (!file || !projectId) {
      return NextResponse.json({ error: 'File and project ID are required' }, { status: 400 });
    }

    console.log('Processing upload:', {
      fileName: file.name,
      fileSize: file.size,
      projectId: projectId
    });

    // Get user's organization to ensure access
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id, first_name, last_name')
      .eq('id', user.userId)
      .single();

    if (!userData?.organization_id) {
      return NextResponse.json({ error: 'User organization not found' }, { status: 404 });
    }

    // Verify project exists and user has access
    const { data: project } = await supabase
      .from('projects')
      .select('id, organization_id, name')
      .eq('id', projectId)
      .eq('organization_id', userData.organization_id)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 });
    }

    // Get project SharePoint configurations
    const { data: sharePointConfigs } = await supabase
      .from('project_sharepoint_configs')
      .select('*')
      .eq('project_id', projectId)
      .eq('is_enabled', true);

    if (!sharePointConfigs || sharePointConfigs.length === 0) {
      return NextResponse.json({ error: 'No enabled SharePoint configurations found for this project. Please configure SharePoint integration in project settings.' }, { status: 400 });
    }

    console.log(`Found ${sharePointConfigs.length} SharePoint configurations for project`);

    // Upload to ALL SharePoint configurations
    const uploadResults = [];
    const uploadErrors = [];

    for (const config of sharePointConfigs) {
      try {
        console.log(`Uploading to SharePoint config: ${config.name} (${config.site_url})`);

        // Get SharePoint access token for this config
        const accessToken = await getSharePointAccessToken({
          tenantId: config.tenant_id,
          clientId: config.client_id,
          clientSecret: config.client_secret,
          siteUrl: config.site_url,
          documentLibrary: config.document_library || 'Documents'
        });

        // Generate unique filename to avoid conflicts
        const timestamp = Date.now();
        let fileName = `${timestamp}_${file.name}`;
        
        // Add folder path if specified
        if (config.folder_path) {
          const folderPath = config.folder_path.startsWith('/') 
            ? config.folder_path.substring(1) 
            : config.folder_path;
          fileName = `${folderPath}/${fileName}`;
        }

        // Upload to SharePoint
        const sharePointResult = await uploadToSharePoint(
          file,
          {
            tenantId: config.tenant_id,
            clientId: config.client_id,
            clientSecret: config.client_secret,
            siteUrl: config.site_url,
            documentLibrary: config.document_library || 'Documents'
          },
          accessToken,
          fileName
        );

        uploadResults.push({
          configId: config.id,
          configName: config.name,
          sharePointPath: sharePointResult.sharePointPath,
          sharePointId: sharePointResult.sharePointId,
          downloadUrl: sharePointResult.downloadUrl,
          siteUrl: config.site_url,
          documentLibrary: config.document_library
        });

        console.log(`Upload successful to ${config.name}: ${sharePointResult.sharePointPath}`);

        // Log to Excel if enabled for this config
        if (config.is_excel_logging_enabled && config.excel_sheet_path) {
          await logToExcel(
            {
              tenantId: config.tenant_id,
              clientId: config.client_id,
              clientSecret: config.client_secret,
              siteUrl: config.site_url,
              isExcelLoggingEnabled: config.is_excel_logging_enabled,
              excelSheetPath: config.excel_sheet_path
            },
            accessToken,
            {
              title: file.name.replace(/\.[^/.]+$/, ""),
              fileName: file.name,
              fileType: file.name.split('.').pop()?.toLowerCase() || 'unknown',
              fileSize: file.size,
              uploadedBy: `${userData.first_name} ${userData.last_name}`,
              projectName: project.name,
              sharePointPath: sharePointResult.sharePointPath,
              configName: config.name
            }
          );
        }
      } catch (error) {
        console.error(`Failed to upload to ${config.name}:`, error);
        uploadErrors.push({
          configName: config.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    if (uploadResults.length === 0) {
      return NextResponse.json({ 
        error: 'Failed to upload to any SharePoint configuration', 
        details: uploadErrors
      }, { status: 500 });
    }

    // Use the first successful upload as the primary record
    const primaryUpload = uploadResults[0];

    // Create the document record in database with primary SharePoint info
    const { data: document, error } = await supabase
      .from('documents')
      .insert({
        project_id: projectId,
        title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension for title
        file_name: file.name,
        file_type: file.name.split('.').pop()?.toLowerCase() || 'unknown',
        file_size: file.size,
        sharepoint_path: primaryUpload.sharePointPath,
        sharepoint_id: primaryUpload.sharePointId,
        project_sharepoint_config_id: primaryUpload.configId, // Store primary config used
        download_url: primaryUpload.downloadUrl,
        description: description || '',
        tags: tags ? JSON.parse(tags) : [],
        custom_field_values: customFieldValues ? JSON.parse(customFieldValues) : {},
        uploaded_by: user.userId,
        // Store all upload locations in metadata
        sharepoint_uploads: uploadResults
      })
      .select(`
        *,
        uploaded_by_user:users!documents_uploaded_by_fkey(id, first_name, last_name, email),
        sharepoint_config:project_sharepoint_configs!documents_project_sharepoint_config_id_fkey(id, name, site_url, document_library, folder_path)
      `)
      .single();

    if (error) {
      console.error('Error creating document:', error);
      return NextResponse.json({ error: 'Failed to create document record' }, { status: 500 });
    }

    // Transform document to match frontend interface
    const transformedDocument = {
      id: document.id,
      name: document.title,
      fileName: document.file_name,
      fileType: document.file_type || 'unknown',
      fileSize: document.file_size || 0,
      version: '1.0',
      status: 'draft' as const,
      uploadedBy: document.uploaded_by_user ? `${document.uploaded_by_user.first_name} ${document.uploaded_by_user.last_name}` : 'Unknown',
      uploadedAt: document.uploaded_at,
      lastModified: document.updated_at,
      lastModifiedBy: document.uploaded_by_user ? `${document.uploaded_by_user.first_name} ${document.uploaded_by_user.last_name}` : 'Unknown',
      sharePointPath: document.sharepoint_path || '',
      description: document.description || '',
      tags: document.tags || [],
      projectId: document.project_id,
      customFieldValues: document.custom_field_values || {},
      revisionHistory: []
    };

    return NextResponse.json({
      success: true,
      document: transformedDocument,
      uploadResults: uploadResults,
      uploadErrors: uploadErrors,
      summary: {
        totalConfigurations: sharePointConfigs.length,
        successfulUploads: uploadResults.length,
        failedUploads: uploadErrors.length
      },
      message: uploadErrors.length > 0 
        ? `Document uploaded to ${uploadResults.length}/${sharePointConfigs.length} SharePoint configurations. ${uploadErrors.length} uploads failed.`
        : `Document uploaded successfully to all ${uploadResults.length} SharePoint configurations!`
    }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/documents/upload:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

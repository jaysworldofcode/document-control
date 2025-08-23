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

    // Try a different approach - use the full site URL directly
    // Extract the full site URL and use it with Graph API
    const siteUrl = config.siteUrl;
    
    // Method 1: Try to use the site URL directly with Graph API
    // The format should be: https://graph.microsoft.com/v1.0/sites/{hostname},{spsite-id},{spweb-id}
    // But we need to get the site first by URL
    
    // Get site by URL
    const encodedSiteUrl = encodeURIComponent(siteUrl);
    const siteByUrlEndpoint = `https://graph.microsoft.com/v1.0/sites?search=${encodedSiteUrl}`;
    console.log('Site search URL:', siteByUrlEndpoint);

    const siteSearchResponse = await fetch(siteByUrlEndpoint, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    
    console.log('Site search response status:', siteSearchResponse.status, siteSearchResponse.statusText);

    if (!siteSearchResponse.ok) {
      const errorText = await siteSearchResponse.text();
      console.error('Site search error:', errorText);
      
      // Fallback: Try the hostname approach
      const hostMatch = config.siteUrl.match(/https?:\/\/([^\/]+)/);
      const siteUrlMatch = config.siteUrl.match(/\/sites\/([^\/]+)/);
      
      if (!hostMatch || !siteUrlMatch) {
        throw new Error('Invalid SharePoint site URL format');
      }
      
      const hostname = hostMatch[1];
      const siteName = siteUrlMatch[1];
      console.log('Trying fallback with hostname:', hostname, 'siteName:', siteName);
      
      const fallbackSiteUrl = `https://graph.microsoft.com/v1.0/sites/${hostname}:/sites/${siteName}`;
      console.log('Fallback site URL:', fallbackSiteUrl);
      
      const fallbackResponse = await fetch(fallbackSiteUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      
      if (!fallbackResponse.ok) {
        const fallbackError = await fallbackResponse.text();
        throw new Error(`Failed to get site information: ${fallbackResponse.status} - ${fallbackError}`);
      }
      
      const siteData = await fallbackResponse.json();
      console.log('Site data from fallback:', siteData);
      const siteId = siteData.id;
    } else {
      const searchResults = await siteSearchResponse.json();
      console.log('Site search results:', searchResults);
      
      if (!searchResults.value || searchResults.value.length === 0) {
        throw new Error('No matching SharePoint site found');
      }
      
      const siteData = searchResults.value[0];
      console.log('Selected site data:', siteData);
      const siteId = siteData.id;
    }

    // Get the document library drive
    const driveUrl = `https://graph.microsoft.com/v1.0/sites/${siteId}/drives`;
    console.log('Drives URL:', driveUrl);
    
    const driveResponse = await fetch(driveUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!driveResponse.ok) {
      const driveError = await driveResponse.text();
      console.error('Drive response error:', driveError);
      throw new Error(`Failed to get drives: ${driveResponse.status} - ${driveError}`);
    }

    const driveData = await driveResponse.json();
    console.log('Drive data:', driveData);
    
    const documentDrive = driveData.value.find((drive: any) => 
      drive.name === config.documentLibrary || drive.name === 'Documents'
    );

    if (!documentDrive) {
      console.error('Available drives:', driveData.value.map((d: any) => d.name));
      throw new Error(`Document library '${config.documentLibrary}' not found. Available: ${driveData.value.map((d: any) => d.name).join(', ')}`);
    }

    console.log('Selected drive:', documentDrive);
    }

    const driveData = await driveResponse.json();
    const documentDrive = driveData.value.find((drive: any) => 
      drive.name === config.documentLibrary || drive.name === 'Documents'
    );

    if (!documentDrive) {
      throw new Error(`Document library '${config.documentLibrary}' not found`);
    }

    // Upload file to SharePoint document library
    const uploadUrl = `https://graph.microsoft.com/v1.0/drives/${documentDrive.id}/root:/${fileName}:/content`;
    
    const fileBuffer = await file.arrayBuffer();
    
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': file.type || 'application/octet-stream',
      },
      body: fileBuffer,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('SharePoint upload failed:', errorText);
      throw new Error(`SharePoint upload failed: ${uploadResponse.status} - ${errorText}`);
    }

    const uploadData = await uploadResponse.json();
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

    // Extract site name from site URL
    const siteUrlMatch = config.siteUrl.match(/\/sites\/([^\/]+)/);
    if (!siteUrlMatch) {
      throw new Error('Invalid SharePoint site URL format');
    }
    const siteName = siteUrlMatch[1];

    // Extract hostname from site URL
    const hostMatch = config.siteUrl.match(/https?:\/\/([^\/]+)/);
    if (!hostMatch) {
      throw new Error('Invalid SharePoint site URL - cannot extract hostname');
    }
    const hostname = hostMatch[1];

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
    const description = formData.get('description') as string;
    const tags = formData.get('tags') as string;
    const customFieldValues = formData.get('customFieldValues') as string;

    if (!file || !projectId) {
      return NextResponse.json({ error: 'File and project ID are required' }, { status: 400 });
    }

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

    // Get SharePoint configuration for the organization
    const { data: sharePointConfig } = await supabase
      .from('sharepoint_configs')
      .select('*')
      .eq('organization_id', userData.organization_id)
      .eq('is_enabled', true)
      .single();

    if (!sharePointConfig) {
      return NextResponse.json({ error: 'SharePoint integration not configured' }, { status: 400 });
    }

    let sharePointPath = '';
    let sharePointId = '';
    let downloadUrl = '';

    try {
      // Get SharePoint access token
      const accessToken = await getSharePointAccessToken({
        tenantId: sharePointConfig.tenant_id,
        clientId: sharePointConfig.client_id,
        clientSecret: sharePointConfig.client_secret,
        siteUrl: sharePointConfig.site_url,
        documentLibrary: sharePointConfig.document_library || 'Documents'
      });

      console.log('Access Token: ', accessToken.substring(0, 100) + '...');

      // Generate unique filename to avoid conflicts
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      console.log('Generated filename:', fileName);

      // Upload to SharePoint
      const sharePointResult = await uploadToSharePoint(
        file,
        {
          tenantId: sharePointConfig.tenant_id,
          clientId: sharePointConfig.client_id,
          clientSecret: sharePointConfig.client_secret,
          siteUrl: sharePointConfig.site_url,
          documentLibrary: sharePointConfig.document_library || 'Documents'
        },
        accessToken,
        fileName
      );

      sharePointPath = sharePointResult.sharePointPath;
      sharePointId = sharePointResult.sharePointId;
      downloadUrl = sharePointResult.downloadUrl;

      // Log to Excel if enabled
      if (sharePointConfig.is_excel_logging_enabled) {
        await logToExcel(
          {
            tenantId: sharePointConfig.tenant_id,
            clientId: sharePointConfig.client_id,
            clientSecret: sharePointConfig.client_secret,
            siteUrl: sharePointConfig.site_url,
            isExcelLoggingEnabled: sharePointConfig.is_excel_logging_enabled,
            excelSheetPath: sharePointConfig.excel_sheet_path
          },
          accessToken,
          {
            title: file.name.replace(/\.[^/.]+$/, ""),
            fileName: file.name,
            fileType: file.name.split('.').pop()?.toLowerCase() || 'unknown',
            fileSize: file.size,
            uploadedBy: `${userData.first_name} ${userData.last_name}`,
            projectName: project.name,
            sharePointPath
          }
        );
      }
    } catch (sharePointError) {
      console.error('SharePoint operation failed:', sharePointError);
      return NextResponse.json({ 
        error: 'Failed to upload to SharePoint', 
        details: sharePointError instanceof Error ? sharePointError.message : 'Unknown error'
      }, { status: 500 });
    }

    // Create the document record in database
    const { data: document, error } = await supabase
      .from('documents')
      .insert({
        project_id: projectId,
        title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension for title
        file_name: file.name,
        file_type: file.name.split('.').pop()?.toLowerCase() || 'unknown',
        file_size: file.size,
        sharepoint_path: sharePointPath,
        sharepoint_id: sharePointId,
        download_url: downloadUrl,
        description: description || '',
        tags: tags ? JSON.parse(tags) : [],
        custom_field_values: customFieldValues ? JSON.parse(customFieldValues) : {},
        uploaded_by: user.userId
      })
      .select(`
        *,
        uploaded_by_user:users!documents_uploaded_by_fkey(id, first_name, last_name, email)
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
      message: 'Document uploaded successfully to SharePoint'
    }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/documents/upload:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

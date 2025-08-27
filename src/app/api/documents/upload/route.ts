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
      console.warn('Using emergency fallback auth mode - FOR DEVELOPMENT ONLY');
      return 'emergency-dev-only-token';
    }
    
    throw error;
  }
}

// Helper function to upload file to SharePoint
async function uploadToSharePoint(file: File, config: {
  siteUrl: string;
  documentLibrary?: string;
  tenantId?: string;
  clientId?: string;
  clientSecret?: string;
  versionControlEnabled?: boolean;
}, accessToken: string, fileName: string) {
  try {
    console.log('SharePoint Config:', {
      siteUrl: config.siteUrl,
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
      downloadUrl: uploadData['@microsoft.graph.downloadUrl'] || uploadData.webUrl,
      driveId: documentDrive.id,
      driveName: documentDrive.name
    };
  } catch (error) {
    console.error('SharePoint upload error:', error);
    throw error;
  }
}

// Helper function to handle SharePoint URLs for Excel logging
async function handleSharePointUrl(config: any, accessToken: string, documentData: any) {
  try {
    console.log('Processing SharePoint URL:', config.excelSheetPath);
    
    // Extract sourcedoc ID from SharePoint URL
    const sourcedocMatch = config.excelSheetPath.match(/sourcedoc=([^&]+)/);
    if (!sourcedocMatch) {
      console.error('Could not extract sourcedoc from SharePoint URL');
      return;
    }
    
    let sourcedocId = decodeURIComponent(sourcedocMatch[1]);
    // Remove the %7B and %7D (URL encoded { and }) if present
    sourcedocId = sourcedocId.replace(/^%7B|%7D$/g, '').replace(/^{|}$/g, '');
    
    console.log('Extracted sourcedoc ID:', sourcedocId);
    
    // Use Microsoft Graph to get the file by sourcedoc ID
    // First, get the site information
    const hostMatch = config.siteUrl.match(/https?:\/\/([^\/]+)/);
    const siteUrlMatch = config.siteUrl.match(/\/sites\/([^\/]+)/);
    
    if (!hostMatch || !siteUrlMatch) {
      throw new Error('Invalid SharePoint site URL format');
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
      throw new Error(`Failed to get site information: ${siteResponse.status}`);
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
      throw new Error(`Failed to get drives: ${drivesResponse.status}`);
    }

    const drivesData = await drivesResponse.json();
    
    // Try to find the file in each drive
    let fileFound = false;
    let targetDriveId = null;
    
    for (const drive of drivesData.value) {
      try {
        const fileUrl = `https://graph.microsoft.com/v1.0/drives/${drive.id}/items/${sourcedocId}`;
        const fileResponse = await fetch(fileUrl, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });
        
        if (fileResponse.ok) {
          console.log(`Found Excel file in drive: ${drive.name} (${drive.id})`);
          targetDriveId = drive.id;
          fileFound = true;
          break;
        }
      } catch (error) {
        // Continue to next drive
      }
    }
    
    if (!fileFound) {
      console.log('Excel file not found in any drive');
      return;
    }
    
    console.log('Excel file found, proceeding with logging...');
    
    // Now proceed with table operations using the file ID
    await addRowToExcelFile(accessToken, targetDriveId, sourcedocId, documentData);
    
  } catch (error) {
    console.error('Error handling SharePoint URL:', error);
    // Don't throw here - Excel logging is optional
  }
}

// Helper function to add row to Excel file using file ID
async function addRowToExcelFile(accessToken: string, driveId: string, fileId: string, documentData: any) {
  try {
    // Prepare custom field data
    const customFields = documentData.projectCustomFields || [];
    const customFieldValues = documentData.customFieldValues || {};
    
    console.log('Debug - Custom fields from project:', JSON.stringify(customFields, null, 2));
    console.log('Debug - Custom field values from form:', customFieldValues);
    console.log('Debug - Available form field keys:', Object.keys(customFieldValues));
    
    // Create row data based on custom field values only
    const rowData = customFields.map((field: any, index: number) => {
      let value = customFieldValues[field.name];
      console.log(`Debug - Processing field "${field.name}" (type: ${field.type}), value:`, value);
      
      // If field name doesn't match, try to find value by index or alternative matching
      if (value === undefined || value === null) {
        const formFieldKeys = Object.keys(customFieldValues);
        console.log(`Debug - Field "${field.name}" not found, trying index ${index} from available keys:`, formFieldKeys);
        
        if (formFieldKeys.length > index) {
          value = customFieldValues[formFieldKeys[index]];
          console.log(`Debug - Using value from index ${index} (key: ${formFieldKeys[index]}):`, value);
        }
      }
      
      if (value === undefined || value === null) {
        console.log(`Debug - Field "${field.name}" has no value, returning empty string`);
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
    
    console.log('Custom field row data:', rowData);
    
    if (rowData.length === 0) {
      console.log('No custom fields defined, skipping Excel logging');
      return;
    }

    // Find the next empty row and add data directly to worksheet
    const worksheetUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${fileId}/workbook/worksheets('Sheet1')/usedRange`;
    
    console.log('Getting used range from:', worksheetUrl);
    
    const usedRangeResponse = await fetch(worksheetUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    let nextRow = 1; // Default to first row if no used range
    
    if (usedRangeResponse.ok) {
      const usedRangeData = await usedRangeResponse.json();
      console.log('Used range data:', JSON.stringify(usedRangeData, null, 2));
      
      if (usedRangeData.rowCount && usedRangeData.rowCount > 0) {
        // The rowIndex is 0-based, so we need to add 1 to get the actual row number
        // Then add the rowCount to get the next available row
        const actualStartRow = usedRangeData.rowIndex + 1; // Convert from 0-based to 1-based
        const usedRowCount = usedRangeData.rowCount;
        
        nextRow = actualStartRow + usedRowCount;
        console.log(`Used range: ${usedRangeData.address}, rowIndex: ${usedRangeData.rowIndex}, rowCount: ${usedRowCount}, actual start row: ${actualStartRow}, next row: ${nextRow}`);
      }
    } else {
      console.log('No used range found, starting at row 1');
    }
    
    console.log('Next available row:', nextRow);
    
    // Calculate the range for the new row
    const startColumn = 'A';
    const endColumn = String.fromCharCode(64 + rowData.length); // A=65, so 64+1=A, 64+2=B, etc.
    const range = `${startColumn}${nextRow}:${endColumn}${nextRow}`;
    
    console.log('Target range:', range);
    
    // Add data directly to the worksheet range
    const updateRangeUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${fileId}/workbook/worksheets('Sheet1')/range(address='${range}')`;
    
    console.log('Updating range at:', updateRangeUrl);
    console.log('Sending data to Excel:', JSON.stringify({ values: [rowData] }, null, 2));
    
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
    
    console.log('Update range response status:', updateResponse.status);
    
    if (updateResponse.ok) {
      const responseData = await updateResponse.json();
      console.log('Excel update response data:', JSON.stringify(responseData, null, 2));
      console.log('Successfully added row to Excel worksheet');
    } else {
      const errorText = await updateResponse.text();
      console.log('Update range error:', errorText);
    }
    
  } catch (error) {
    console.error('Error adding row to Excel file:', error);
  }
}

// Helper function to log to Excel (if configured)
async function logToExcel(config: any, accessToken: string, documentData: any, driveId?: string) {
  try {
    console.log('logToExcel called with config:', {
      isExcelLoggingEnabled: config.isExcelLoggingEnabled,
      excelSheetPath: config.excelSheetPath,
      siteUrl: config.siteUrl,
      driveId: driveId || 'site default'
    });

    if (!config.isExcelLoggingEnabled || !config.excelSheetPath) {
      console.log('Excel logging disabled or no sheet path provided');
      return;
    }

    // Prepare custom field data
    const customFields = documentData.projectCustomFields || [];
    const customFieldValues = documentData.customFieldValues || {};
    
    console.log('Debug - Custom fields from project:', JSON.stringify(customFields, null, 2));
    console.log('Debug - Custom field values from form:', customFieldValues);
    console.log('Debug - Available form field keys:', Object.keys(customFieldValues));
    
    // Create row data based on custom field values
    const rowData = customFields.map((field: any, index: number) => {
      let value = customFieldValues[field.name];
      console.log(`Debug - Processing field "${field.name}" (type: ${field.type}), value:`, value);
      
      // If field name doesn't match, try to find value by index or alternative matching
      if (value === undefined || value === null) {
        const formFieldKeys = Object.keys(customFieldValues);
        console.log(`Debug - Field "${field.name}" not found, trying index ${index} from available keys:`, formFieldKeys);
        
        if (formFieldKeys.length > index) {
          value = customFieldValues[formFieldKeys[index]];
          console.log(`Debug - Using value from index ${index} (key: ${formFieldKeys[index]}):`, value);
        }
      }
      
      if (value === undefined || value === null) {
        console.log(`Debug - Field "${field.name}" has no value, returning empty string`);
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
    
    console.log('Custom field row data:', rowData);
    
    if (rowData.length === 0) {
      console.log('No custom fields defined, skipping Excel logging');
      return;
    }

    // Check if excelSheetPath is a SharePoint URL or a file path
    const isSharePointUrl = config.excelSheetPath.startsWith('https://') && 
                           config.excelSheetPath.includes('sharepoint.com');
    
    console.log('Excel path type:', isSharePointUrl ? 'SharePoint URL' : 'File path');

    if (isSharePointUrl) {
      // Handle SharePoint URL
      return await handleSharePointUrl(config, accessToken, documentData);
    }

    // Handle file path (existing logic)
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

    // Adjust Excel file path for specific drives
    let adjustedExcelPath = config.excelSheetPath;
    if (driveId) {
      // When using a specific drive, remove the library name prefix if it exists
      // e.g., "/Engineering/Book.xlsx" becomes "/Book.xlsx" when using Engineering drive
      const pathSegments = config.excelSheetPath.split('/').filter((s: string) => s);
      if (pathSegments.length > 1) {
        // Check if first segment might be a library name, if so remove it
        adjustedExcelPath = '/' + pathSegments.slice(1).join('/');
        console.log(`Adjusted Excel path from ${config.excelSheetPath} to ${adjustedExcelPath} for specific drive`);
      }
    }

    // Check if Excel file exists - use specific drive if provided, otherwise use site default drive
    const excelFileUrl = driveId 
      ? `https://graph.microsoft.com/v1.0/drives/${driveId}/root:${adjustedExcelPath}`
      : `https://graph.microsoft.com/v1.0/sites/${siteId}/drive/root:${config.excelSheetPath}`;
    
    console.log('Excel file URL:', excelFileUrl);
    
    const fileResponse = await fetch(excelFileUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!fileResponse.ok) {
      console.log('Excel file not found, skipping Excel logging');
      return;
    }

    const fileData = await fileResponse.json();
    const fileId = fileData.id;
    const fileDriveId = driveId || fileData.parentReference.driveId;

    console.log('Found Excel file with ID:', fileId, 'in drive:', fileDriveId);

    await addRowToExcelFile(accessToken, fileDriveId, fileId, documentData);
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
      .select('id, organization_id, name, custom_fields')
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
    
    // Get the organization's main SharePoint configuration for auth credentials
    const { data: orgConfig, error: orgConfigError } = await supabase
      .from('sharepoint_configs')
      .select('*')
      .eq('organization_id', project.organization_id)
      .single();
      
    if (orgConfigError || !orgConfig) {
      console.error('Error fetching organization SharePoint config:', orgConfigError);
      return NextResponse.json({ error: 'SharePoint configuration not found for this organization' }, { status: 404 });
    }
    
    console.log('Using organization SharePoint auth config with tenant:', orgConfig.tenant_id);

    // Upload to ALL SharePoint configurations
    const uploadResults = [];
    const uploadErrors = [];

    for (const config of sharePointConfigs) {
      try {
        console.log(`Uploading to SharePoint config: ${config.name} (${config.site_url})`);

        // Create combined config with correct structure
        const combinedConfig = {
          // Auth details from organization config
          tenantId: orgConfig.tenant_id,
          clientId: orgConfig.client_id,
          clientSecret: orgConfig.client_secret,
          
          // Site details from project config
          siteUrl: config.site_url,
          documentLibrary: config.document_library || orgConfig.document_library || 'Documents',
          
          // Other settings
          versionControlEnabled: orgConfig.version_control_enabled
        };

        // Get SharePoint access token using org credentials with project site details
        const accessToken = await getSharePointAccessToken(combinedConfig);

        // Use original filename without timestamp prefix
        let fileName = file.name;
        
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
          combinedConfig,
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
              configName: config.name,
              customFieldValues: customFieldValues ? JSON.parse(customFieldValues) : {},
              projectCustomFields: project.custom_fields || []
            },
            sharePointResult.driveId  // Pass the drive ID
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

    // Extract the file extension for cleaner display
    const fileExtension = file.name.split('.').pop()?.toUpperCase() || 'UNKNOWN';
    
    // Create the document record in database with primary SharePoint info
    const { data: document, error } = await supabase
      .from('documents')
      .insert({
        project_id: projectId,
        title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension for title
        file_name: file.name,
        file_type: fileExtension, // Store just the extension in uppercase
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
    
    // Create initial version 1.0 record
    const { error: versionError } = await supabase
      .from('document_versions')
      .insert({
        document_id: document.id,
        version_number: '1.0',
        file_name: document.file_name,
        file_size: document.file_size,
        file_type: document.file_type,
        sharepoint_path: document.sharepoint_path,
        sharepoint_id: document.sharepoint_id,
        download_url: document.download_url,
        uploaded_by: document.uploaded_by,
        is_current_version: true,
        changes_summary: 'Initial document version'
      });
    
    if (versionError) {
      console.error('Error creating initial version record:', versionError);
      // Continue anyway, document was created successfully
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

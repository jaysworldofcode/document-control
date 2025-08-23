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

// Helper function to upload new version to SharePoint
async function uploadVersionToSharePoint(file: File, config: any, accessToken: string, fileName: string, versionNumber: string) {
  try {
    console.log('🚀 Uploading version', versionNumber, 'to SharePoint...');

    // Extract hostname and site name for Graph API
    const hostMatch = config.siteUrl.match(/https?:\/\/([^\/]+)/);
    const siteUrlMatch = config.siteUrl.match(/\/sites\/([^\/]+)/);
    
    if (!hostMatch || !siteUrlMatch) {
      throw new Error('Invalid SharePoint site URL format. Expected format: https://tenant.sharepoint.com/sites/sitename');
    }
    
    const hostname = hostMatch[1];
    const siteName = siteUrlMatch[1];

    // Get site information
    const siteInfoUrl = `https://graph.microsoft.com/v1.0/sites/${hostname}:/sites/${siteName}`;
    const siteResponse = await fetch(siteInfoUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!siteResponse.ok) {
      const errorText = await siteResponse.text();
      throw new Error(`Failed to get site information: ${siteResponse.status} - ${errorText}`);
    }

    const siteData = await siteResponse.json();
    const siteId = siteData.id;

    // Get drives (document libraries)
    const driveUrl = `https://graph.microsoft.com/v1.0/sites/${siteId}/drives`;
    const driveResponse = await fetch(driveUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!driveResponse.ok) {
      const driveError = await driveResponse.text();
      throw new Error(`Failed to get drives: ${driveResponse.status} - ${driveError}`);
    }

    const driveData = await driveResponse.json();
    
    // Find the correct document library
    const targetLibrary = config.documentLibrary || 'Documents';
    let documentDrive = driveData.value?.find((drive: any) => 
      drive.name === targetLibrary || 
      drive.name === 'Documents' ||
      drive.driveType === 'documentLibrary'
    );

    if (!documentDrive && driveData.value?.length > 0) {
      documentDrive = driveData.value[0];
    }

    if (!documentDrive) {
      throw new Error(`No document library found. Target: ${targetLibrary}`);
    }

    // Create versioned filename (e.g., document_v2.0_timestamp.pdf)
    const fileExt = fileName.substring(fileName.lastIndexOf('.'));
    const baseFileName = fileName.substring(0, fileName.lastIndexOf('.'));
    const timestamp = Date.now();
    const versionedFileName = `${baseFileName}_v${versionNumber}_${timestamp}${fileExt}`;

    // Upload file to SharePoint
    const uploadUrl = `https://graph.microsoft.com/v1.0/drives/${documentDrive.id}/root:/${versionedFileName}:/content`;
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
      throw new Error(`SharePoint upload failed: ${uploadResponse.status} - ${errorText}`);
    }

    const uploadData = await uploadResponse.json();
    console.log('✅ Version upload successful:', uploadData.name);
    
    return {
      sharePointPath: uploadData.webUrl,
      sharePointId: uploadData.id,
      downloadUrl: uploadData['@microsoft.graph.downloadUrl'] || uploadData.webUrl,
      fileName: versionedFileName
    };
  } catch (error) {
    console.error('SharePoint version upload error:', error);
    throw error;
  }
}

// Helper function to calculate next version number
function calculateNextVersion(currentVersion: string, incrementType: 'minor' | 'major' = 'minor'): string {
  const versionParts = currentVersion.split('.').map(part => parseInt(part) || 0);
  
  if (incrementType === 'major') {
    versionParts[0] = (versionParts[0] || 0) + 1;
    versionParts[1] = 0; // Reset minor version
  } else {
    versionParts[1] = (versionParts[1] || 0) + 1;
  }
  
  // Ensure we have at least major.minor format
  while (versionParts.length < 2) {
    versionParts.push(0);
  }
  
  return versionParts.slice(0, 2).join('.');
}

// POST - Upload a new version of an existing document
export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const documentId = formData.get('documentId') as string;
    const versionType = formData.get('versionType') as 'minor' | 'major' || 'minor';
    const changesSummary = formData.get('changesSummary') as string || '';
    const customVersion = formData.get('customVersion') as string;

    if (!file || !documentId) {
      return NextResponse.json({ error: 'File and document ID are required' }, { status: 400 });
    }

    console.log('🔄 Processing version upload for document:', documentId);

    // Get user's organization to ensure access
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id, first_name, last_name')
      .eq('id', user.userId)
      .single();

    if (!userData?.organization_id) {
      return NextResponse.json({ error: 'User organization not found' }, { status: 404 });
    }

    // Verify document exists and user has access
    const { data: document } = await supabase
      .from('documents')
      .select(`
        *,
        projects!inner(id, organization_id, name)
      `)
      .eq('id', documentId)
      .eq('projects.organization_id', userData.organization_id)
      .single();

    if (!document) {
      return NextResponse.json({ error: 'Document not found or access denied' }, { status: 404 });
    }

    // Get the current version from documents table or latest version
    const { data: latestVersion } = await supabase
      .from('document_versions')
      .select('version_number')
      .eq('document_id', documentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Calculate next version number
    const currentVersion = latestVersion?.version_number || document.version || '1.0';
    const nextVersion = customVersion || calculateNextVersion(currentVersion, versionType);

    console.log('📊 Version info:', { currentVersion, nextVersion, versionType });

    // Check if version already exists
    const { data: existingVersion } = await supabase
      .from('document_versions')
      .select('id')
      .eq('document_id', documentId)
      .eq('version_number', nextVersion)
      .single();

    if (existingVersion) {
      return NextResponse.json({ error: `Version ${nextVersion} already exists` }, { status: 409 });
    }

    // Get SharePoint configuration
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
    let versionedFileName = '';

    try {
      // Get SharePoint access token
      const accessToken = await getSharePointAccessToken({
        tenantId: sharePointConfig.tenant_id,
        clientId: sharePointConfig.client_id,
        clientSecret: sharePointConfig.client_secret,
        siteUrl: sharePointConfig.site_url,
        documentLibrary: sharePointConfig.document_library || 'Documents'
      });

      // Upload new version to SharePoint
      const sharePointResult = await uploadVersionToSharePoint(
        file,
        {
          tenantId: sharePointConfig.tenant_id,
          clientId: sharePointConfig.client_id,
          clientSecret: sharePointConfig.client_secret,
          siteUrl: sharePointConfig.site_url,
          documentLibrary: sharePointConfig.document_library || 'Documents'
        },
        accessToken,
        file.name,
        nextVersion
      );

      sharePointPath = sharePointResult.sharePointPath;
      sharePointId = sharePointResult.sharePointId;
      downloadUrl = sharePointResult.downloadUrl;
      versionedFileName = sharePointResult.fileName;

      console.log('✅ SharePoint version upload successful');

    } catch (sharePointError) {
      console.error('SharePoint version upload failed:', sharePointError);
      return NextResponse.json({ 
        error: 'Failed to upload version to SharePoint', 
        details: sharePointError instanceof Error ? sharePointError.message : 'Unknown error'
      }, { status: 500 });
    }

    // Create version record in database
    const { data: versionRecord, error: versionError } = await supabase
      .from('document_versions')
      .insert({
        document_id: documentId,
        version_number: nextVersion,
        file_name: versionedFileName,
        file_size: file.size,
        file_type: file.name.split('.').pop()?.toLowerCase() || 'unknown',
        sharepoint_path: sharePointPath,
        sharepoint_id: sharePointId,
        download_url: downloadUrl,
        description: `Version ${nextVersion}`,
        changes_summary: changesSummary,
        uploaded_by: user.userId,
        is_current_version: true // This will be the new current version
      })
      .select(`
        *,
        uploaded_by_user:users!document_versions_uploaded_by_fkey(id, first_name, last_name, email)
      `)
      .single();

    if (versionError) {
      console.error('Error creating version record:', versionError);
      return NextResponse.json({ error: 'Failed to create version record' }, { status: 500 });
    }

    // Update the main document record with new version info
    const { error: updateError } = await supabase
      .from('documents')
      .update({
        version: nextVersion,
        file_name: file.name, // Keep original filename in main document
        file_size: file.size,
        file_type: file.name.split('.').pop()?.toLowerCase() || 'unknown',
        sharepoint_path: sharePointPath,
        sharepoint_id: sharePointId,
        download_url: downloadUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId);

    if (updateError) {
      console.error('Error updating document:', updateError);
      // Don't fail here - version was created successfully
    }

    // Transform version record to match frontend interface
    const transformedVersion = {
      id: versionRecord.id,
      version: versionRecord.version_number,
      uploadedBy: versionRecord.uploaded_by_user ? 
        `${versionRecord.uploaded_by_user.first_name} ${versionRecord.uploaded_by_user.last_name}` : 'Unknown',
      uploadedAt: versionRecord.created_at,
      changes: versionRecord.changes_summary || `Version ${nextVersion} uploaded`,
      filePath: versionRecord.sharepoint_path,
      fileName: versionRecord.file_name,
      fileSize: versionRecord.file_size,
      downloadUrl: versionRecord.download_url,
      isCurrent: versionRecord.is_current_version
    };

    return NextResponse.json({
      success: true,
      version: transformedVersion,
      message: `Version ${nextVersion} uploaded successfully`
    }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/documents/version:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

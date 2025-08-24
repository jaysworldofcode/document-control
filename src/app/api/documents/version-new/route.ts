/**
 * Document version upload endpoint with SharePoint integration
 * 
 * This endpoint handles uploading new versions of documents to SharePoint.
 * It includes fallback mechanisms for SharePoint access issues:
 * 
 * 1. Conditional Access Policies: When SharePoint authentication is blocked by
 *    Microsoft Entra ID (Azure AD) conditional access policies, this endpoint will:
 *    - Attempt to use a development token if available
 *    - Fall back to Supabase storage if SharePoint is not accessible
 * 
 * 2. Configuration Options (in .env.local):
 *    - SHAREPOINT_EMERGENCY_FALLBACK=true - Enables local storage fallback for dev
 *    - SHAREPOINT_DEV_TOKEN - A valid SharePoint token for development
 *    - SHAREPOINT_FALLBACK_TOKEN - Alternate token for fallback authentication
 * 
 * For production use, your organization must configure proper conditional
 * access policies or approve this application in Entra ID.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

// Helper function to get MS Graph API token
async function getSharePointAccessToken(config: {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  siteUrl: string;
  libraryName?: string;
  versionControlEnabled?: boolean;
}): Promise<{ accessToken: string, usingDefaultToken: boolean }> {
  try {
    console.log('🔐 Getting access token for SharePoint...');
    
    // Check if we have an alternative token source for development/testing
    if (process.env.SHAREPOINT_DEV_TOKEN) {
      console.log('Using development token from environment variables');
      return { 
        accessToken: process.env.SHAREPOINT_DEV_TOKEN,
        usingDefaultToken: true
      };
    }
    
    // Try tenant-specific endpoint first (more reliable for conditional access policies)
    const tenantId = config.tenantId || 'common';
    const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    
    console.log(`Requesting token from ${tokenUrl}`);
    
    const formData = new URLSearchParams();
    formData.append('grant_type', 'client_credentials');
    formData.append('client_id', config.clientId);
    formData.append('client_secret', config.clientSecret);
    formData.append('scope', 'https://graph.microsoft.com/.default');
    
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
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
          return { 
            accessToken: process.env.SHAREPOINT_FALLBACK_TOKEN,
            usingDefaultToken: true
          };
        }
        
        throw new Error(`Access blocked by conditional access policies. This application requires administrator configuration to comply with your organization's security policies.`);
      }
      
      throw new Error(`Failed to get access token: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return { 
      accessToken: data.access_token,
      usingDefaultToken: false
    };
  } catch (error) {
    console.error('Error getting SharePoint access token:', error);
    
    // Final fallback for development/testing only
    if (process.env.SHAREPOINT_EMERGENCY_FALLBACK === 'true' && process.env.NODE_ENV !== 'production') {
      console.warn('Using emergency fallback auth mode - FOR DEVELOPMENT ONLY');
      return { 
        accessToken: 'emergency-dev-only-token',
        usingDefaultToken: true
      };
    }
    
    throw error;
  }
}

// Helper function to upload new version to SharePoint
async function uploadVersionToSharePoint(file: File, config: {
  siteUrl: string;
  libraryName?: string;
  tenantId?: string;
  clientId?: string;
  clientSecret?: string;
  versionControlEnabled?: boolean;
}, accessToken: string, document: any) {
  try {
    console.log('🚀 Uploading new version to SharePoint...');
    console.log('Using SharePoint site URL:', config.siteUrl);
    
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
    console.log('Getting site info from:', siteInfoUrl);
    
    const siteResponse = await fetch(siteInfoUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!siteResponse.ok) {
      const errorText = await siteResponse.text();
      throw new Error(`Failed to get site info: ${siteResponse.status} ${errorText}`);
    }

    const siteData = await siteResponse.json();
    const siteId = siteData.id;
    console.log('Site ID:', siteId);

    // Find the document library
    const targetLibrary = config.libraryName || 'Documents';
    console.log('Target library:', targetLibrary);
    
    const drivesUrl = `https://graph.microsoft.com/v1.0/sites/${siteId}/drives`;
    console.log('Getting drives from:', drivesUrl);
    
    const drivesResponse = await fetch(drivesUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!drivesResponse.ok) {
      const errorText = await drivesResponse.text();
      throw new Error(`Failed to get drives: ${drivesResponse.status} ${errorText}`);
    }

    const driveData = await drivesResponse.json();
    console.log(`Found ${driveData.value?.length || 0} drives`);

    // Find the document library by name
    let documentDrive = driveData.value?.find((drive: any) => drive.name === targetLibrary);

    // If specified library not found, look for Documents or document library
    if (!documentDrive) {
      documentDrive = driveData.value?.find((drive: any) => 
        drive.name === 'Documents' || 
        drive.name.toLowerCase() === 'documents' ||
        drive.driveType === 'documentLibrary'
      );
    }

    // Fallback to first drive if still not found
    if (!documentDrive && driveData.value?.length > 0) {
      documentDrive = driveData.value[0];
    }

    if (!documentDrive) {
      throw new Error(`No document library found. Target: ${targetLibrary}`);
    }

    console.log('Selected drive:', { name: documentDrive.name, id: documentDrive.id });

    // Use the original filename from the document
    const fileName = document.file_name;
    console.log('Using original filename:', fileName);
    
    // Check if we can find the file by path first
    let existingFileId = '';
    if (!document.sharepoint_id) {
      try {
        // Try to get the file by path to see if it exists
        const checkFileUrl = `https://graph.microsoft.com/v1.0/drives/${documentDrive.id}/root:/${fileName}`;
        console.log('Checking if file exists by path:', checkFileUrl);
        
        const checkResponse = await fetch(checkFileUrl, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          }
        });
        
        if (checkResponse.ok) {
          const fileData = await checkResponse.json();
          console.log('Found existing file by path:', fileData.name);
          existingFileId = fileData.id;
        } else {
          console.log('File does not exist yet or could not be found by path');
        }
      } catch (checkError) {
        console.error('Error checking file existence:', checkError);
      }
    }
    
    // First, check if we can get the file by SharePoint ID (if available)
    if (document.sharepoint_id || existingFileId) {
      try {
        const fileId = document.sharepoint_id || existingFileId;
        console.log('Attempting to update file using SharePoint ID:', fileId);
        
        // Verify the file exists using the item ID
        const itemUrl = `https://graph.microsoft.com/v1.0/drives/${documentDrive.id}/items/${fileId}`;
        console.log('Checking file by ID:', itemUrl);
        
        const itemResponse = await fetch(itemUrl, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          }
        });
        
        if (itemResponse.ok) {
          const itemData = await itemResponse.json();
          console.log('Found file by ID:', itemData.name);
          
          // Use the PUT endpoint without the If-Match header for SharePoint versioning
          // Add @microsoft.graph.conflictBehavior=replace to ensure versioning
          const uploadUrl = `https://graph.microsoft.com/v1.0/drives/${documentDrive.id}/items/${itemData.id}/content?@microsoft.graph.conflictBehavior=replace`;
          console.log('Updating existing file at URL:', uploadUrl);
          
          const fileBuffer = await file.arrayBuffer();
          
          const uploadResponse = await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': file.type || 'application/octet-stream',
              'Prefer': 'respond-async'
              // Removed If-Match header which was causing ETag errors
            },
            body: fileBuffer,
          });
          
          console.log('SharePoint item ID upload response status:', uploadResponse.status);
          
          if (uploadResponse.ok) {
            const uploadData = await uploadResponse.json();
            console.log('✅ Version upload successful using item ID:', uploadData.name);
            console.log('Response data (ID method):', JSON.stringify({
              id: uploadData.id,
              name: uploadData.name,
              webUrl: uploadData.webUrl,
              eTag: uploadData.eTag,
              hasVersion: !!uploadData.versions
            }, null, 2));
            
            return {
              sharePointPath: uploadData.webUrl,
              sharePointId: uploadData.id,
              downloadUrl: uploadData['@microsoft.graph.downloadUrl'] || uploadData.webUrl,
              fileName: uploadData.name
            };
          } else {
            const errorText = await uploadResponse.text();
            console.error('Error updating file by ID:', errorText);
            throw new Error(`SharePoint update failed: ${uploadResponse.status} - ${errorText}`);
          }
        } else {
          console.log('Could not find file by ID, falling back to path-based upload');
        }
      } catch (idError) {
        console.error('Error updating by ID, falling back to path:', idError);
      }
    }
    
    // Fallback: Upload by path if ID approach fails
    // Upload the file with the same name to update it
    const uploadUrl = `https://graph.microsoft.com/v1.0/drives/${documentDrive.id}/root:/${fileName}:/content?@microsoft.graph.conflictBehavior=replace`;
    console.log('Uploading to URL by path:', uploadUrl);
    
    const fileBuffer = await file.arrayBuffer();
    
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': file.type || 'application/octet-stream',
        'Prefer': 'respond-async'
        // Removed If-Match header which was causing ETag errors
      },
      body: fileBuffer,
    });

    console.log('SharePoint upload response status:', uploadResponse.status);
    
    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('SharePoint upload failed response:', errorText);
      throw new Error(`SharePoint upload failed: ${uploadResponse.status} - ${errorText}`);
    }

    const uploadData = await uploadResponse.json();
    console.log('✅ Version upload successful:', uploadData.name);
    console.log('Response data:', JSON.stringify({
      id: uploadData.id,
      name: uploadData.name,
      webUrl: uploadData.webUrl,
      eTag: uploadData.eTag,
      hasVersion: !!uploadData.versions
    }, null, 2));
    
    return {
      sharePointPath: uploadData.webUrl,
      sharePointId: uploadData.id,
      downloadUrl: uploadData['@microsoft.graph.downloadUrl'] || uploadData.webUrl,
      fileName: uploadData.name,
      storageProvider: 'sharepoint'
    };
  } catch (error) {
    console.error('SharePoint version upload error:', error);
    throw error;
  }
}

// Helper function to calculate next version number
function calculateNextVersion(currentVersion: string, incrementType: 'minor' | 'major' = 'minor'): string {
  const parts = currentVersion.split('.');
  let major = parseInt(parts[0], 10) || 1;
  let minor = parseInt(parts[1], 10) || 0;
  
  if (incrementType === 'major') {
    major += 1;
    minor = 0;
  } else {
    minor += 1;
  }
  
  return `${major}.${minor}`;
}

export async function POST(request: NextRequest) {
  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });

  try {
    const formData = await request.formData();
    
    // Log all form data entries
    console.log('Received form data entries:');
    for (const [key, value] of formData.entries()) {
      const displayValue = value instanceof File 
        ? `File: ${value.name} (${value.size} bytes)` 
        : value;
      console.log(`- ${key}: ${displayValue}`);
    }
    
    const file = formData.get('file') as File;
    const documentId = formData.get('documentId') as string;
    const userId = formData.get('userId') as string;
    
    console.log('Document ID from form data:', documentId, 'Type:', typeof documentId);
    console.log('User ID from form data:', userId);
    
    const changesSummary = formData.get('changesSummary') as string;
    const versionType = formData.get('versionType') as string || 'minor';
    
    if (!file || !documentId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!userId) {
      console.error('No user ID provided in form data');
      return NextResponse.json({ error: 'User ID not found' }, { status: 400 });
    }

    // Get user info
    console.log('Looking up user with ID:', userId);
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, first_name, last_name')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user data:', userError);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    console.log('User found:', userData.id, `${userData.first_name} ${userData.last_name}`);

    // Get document info
    console.log('Looking up document with ID:', documentId);
    
    // First, list document table structure
    const { data: sampleDoc } = await supabase
      .from('documents')
      .select('*')
      .limit(1);
      
    if (sampleDoc && sampleDoc.length > 0) {
      console.log('Document table structure has these columns:', Object.keys(sampleDoc[0]));
    }
    
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();
      
    if (docError) {
      console.error('Error finding document:', docError);
      
      // Try listing some documents for debugging
      const { data: docs } = await supabase
        .from('documents')
        .select('id, title, file_name')
        .limit(5);
        
      if (docs && docs.length > 0) {
        console.log('Some available documents:');
        docs.forEach(d => console.log(`- ${d.id}: ${d.title || d.file_name}`));
      } else {
        console.log('No documents found in database');
      }
      
      return NextResponse.json({ 
        error: 'Document not found', 
        details: 'Could not find document with ID: ' + documentId
      }, { status: 404 });
    }

    if (!document) {
      console.error('Document not found with ID:', documentId);
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
    
    console.log('Document found:', document.id, document.title || document.file_name);

    // Get the project's SharePoint configuration
    console.log('Getting SharePoint config for project:', document.project_id);
    const { data: projectConfig, error: configError } = await supabase
      .from('project_sharepoint_configs')
      .select('*')
      .eq('project_id', document.project_id)
      .single();

    if (configError) {
      console.error('Error fetching project SharePoint config:', configError);
      return NextResponse.json({ error: 'SharePoint configuration not found for this project' }, { status: 404 });
    }
    
    // Get the organization's main SharePoint configuration for auth credentials
    console.log('Getting organization SharePoint auth config for project:', document.project_id);
    const { data: projectData } = await supabase
      .from('projects')
      .select('organization_id')
      .eq('id', document.project_id)
      .single();
      
    if (!projectData?.organization_id) {
      console.error('Project has no organization ID:', document.project_id);
      return NextResponse.json({ error: 'Organization not found for this project' }, { status: 404 });
    }
    
    const { data: orgConfig, error: orgConfigError } = await supabase
      .from('sharepoint_configs')
      .select('*')
      .eq('organization_id', projectData.organization_id)
      .single();
      
    if (orgConfigError || !orgConfig) {
      console.error('Error fetching organization SharePoint config:', orgConfigError);
      return NextResponse.json({ error: 'SharePoint configuration not found for this organization' }, { status: 404 });
    }
    
    // Combine configs - use auth details from org config, site details from project config
    const combinedConfig = {
      // Auth details from organization config
      tenantId: orgConfig.tenant_id,
      clientId: orgConfig.client_id,
      clientSecret: orgConfig.client_secret,
      
      // Site details from project config
      siteUrl: projectConfig.site_url,
      libraryName: projectConfig.document_library || orgConfig.document_library || 'Documents',
      
      // Other settings
      versionControlEnabled: orgConfig.version_control_enabled
    };
    
    console.log('Using combined SharePoint config with tenant:', combinedConfig.tenantId);

    // Get access token for SharePoint
    const authResult = await getSharePointAccessToken(combinedConfig);
    
    // Determine if we should use storage fallback
    let shouldUseSupabaseStorage = false;
    let sharePointResult;
    
    try {
      // Upload the document to SharePoint
      sharePointResult = await uploadVersionToSharePoint(file, combinedConfig, authResult.accessToken, document);
    } catch (uploadError: any) {
      console.error('SharePoint upload error:', uploadError);
      
      // If we're using a default token or have a connectivity issue, fall back to Supabase storage
      if (authResult.usingDefaultToken || uploadError.message.includes('Failed to fetch') || uploadError.message.includes('network')) {
        console.log('Falling back to Supabase Storage for this upload');
        shouldUseSupabaseStorage = true;
      } else {
        // Re-throw the error if it's not a fallback scenario
        throw uploadError;
      }
    }
    
    // If SharePoint failed, upload to Supabase Storage as fallback
    if (shouldUseSupabaseStorage) {
      console.log('📦 Using Supabase Storage as fallback...');
      
      const filePath = `documents/${document.project_id}/${document.id}/${Date.now()}_${file.name}`;
      const { data: storageData, error: storageError } = await supabase.storage
        .from('document-versions')
        .upload(filePath, file);
        
      if (storageError) {
        console.error('Error uploading to Supabase storage:', storageError);
        throw new Error(`Failed to upload document to storage: ${storageError.message}`);
      }
      
      // Get the public URL
      const { data: urlData } = await supabase.storage
        .from('document-versions')
        .getPublicUrl(filePath);
        
      sharePointResult = {
        sharePointId: null,
        sharePointPath: filePath,
        downloadUrl: urlData.publicUrl,
        fileName: file.name,
        storageProvider: 'supabase'
      };
      
      console.log('File uploaded to Supabase storage:', sharePointResult.downloadUrl);
    }
    
    // Calculate the next version number
    // Need to get the current version from document_versions, not from the document itself
    let currentVersion = '1.0';
    
    // Get the latest version from document_versions table
    const { data: latestVersionData } = await supabase
      .from('document_versions')
      .select('version_number')
      .eq('document_id', document.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
      
    if (latestVersionData && latestVersionData.version_number) {
      currentVersion = latestVersionData.version_number;
    }
    
    const nextVersion = formData.get('customVersion') as string || 
                        calculateNextVersion(currentVersion, versionType as 'minor' | 'major');
    
    console.log('Updating document with new version:', nextVersion);
    
    // Ensure sharePointResult exists with default values if needed
    if (!sharePointResult) {
      console.warn('No SharePoint result available, using defaults');
      sharePointResult = {
        sharePointId: document.sharepoint_id || null,
        sharePointPath: document.sharepoint_path || null,
        downloadUrl: document.download_url || null,
        fileName: file.name,
        storageProvider: 'failed'
      };
    }
    
    // Update the document in the database with the new SharePoint information
    const { data: updatedDoc, error: updateError } = await supabase
      .from('documents')
      .update({
        sharepoint_id: sharePointResult.sharePointId,
        sharepoint_path: sharePointResult.sharePointPath,
        download_url: sharePointResult.downloadUrl,
        updated_at: new Date().toISOString(),
        // updated_by: userId
      })
      .eq('id', document.id)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating document:', updateError);
      return NextResponse.json({ error: 'Failed to update document record' }, { status: 500 });
    }
    
    // First, set all existing versions for this document to not current
    await supabase
      .from('document_versions')
      .update({ is_current_version: false })
      .eq('document_id', document.id);
    
    // Extract file extension from filename
    const fileName = sharePointResult.fileName || file.name;
    const fileExtension = fileName.split('.').pop()?.toUpperCase() || 'UNKNOWN';
    
    // Add a version record
    const { data: versionRecord, error: versionError } = await supabase
      .from('document_versions')
      .insert({
        document_id: document.id,
        version_number: nextVersion,
        uploaded_by: userId,
        // Let the database set created_at with DEFAULT NOW()
        changes_summary: changesSummary || 'New version uploaded',
        sharepoint_path: sharePointResult.sharePointPath,
        sharepoint_id: sharePointResult.sharePointId,
        download_url: sharePointResult.downloadUrl,
        file_name: fileName,
        file_size: file.size,
        file_type: fileExtension, // Just use the file extension, not the full MIME type
        is_current_version: true
      })
      .select()
      .single();
    
    if (versionError) {
      console.error('Error creating version record:', versionError);
      // Don't return error here, the document was still updated
    }
    
    // Log document activity
    try {
      await supabase
        .from('document_activity_logs')
        .insert({
          document_id: document.id,
          user_id: userId,
          activity_type: 'version_uploaded',
          details: JSON.stringify({
            version: nextVersion,
            fileName: sharePointResult.fileName || file.name,
            changes_summary: changesSummary || 'New version uploaded',
            storage: sharePointResult.storageProvider || 'sharepoint'
          }),
          ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown'
        });
    } catch (logError) {
      console.error('Error logging document activity:', logError);
      // Don't fail the request due to logging error
    }

    return NextResponse.json({
      success: true,
      document: updatedDoc,
      version: {
        version: versionRecord?.version_number || nextVersion,
        uploadedAt: new Date().toISOString(),
        size: file.size,
        fileName: file.name
      },
      sharePointInfo: sharePointResult
    });
  } catch (error: any) {
    console.error('Error in version upload route:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to upload new version',
      stack: error.stack
    }, { status: 500 });
  }
}

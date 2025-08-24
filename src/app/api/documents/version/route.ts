import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

// Helper function to get MS Graph API token
async function getSharePointAccessToken(config: any): Promise<string> {
  try {
    console.log('🔐 Getting access token for SharePoint...');
    const tokenUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
    
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
      throw new Error(`Failed to get access token: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Error getting SharePoint access token:', error);
    throw error;
  }
}

// Helper function to upload new version to SharePoint
async function uploadVersionToSharePoint(file: File, config: any, accessToken: string, document: any) {
  try {
    console.log('🚀 Uploading new version to SharePoint...');
    
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
      fileName: uploadData.name
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
  // Initialize Supabase client with auth context
  const cookieStore = cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
    },
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
    
    // Try multiple potential document ID field names
    let documentId = formData.get('documentId') as string;
    if (!documentId) {
      documentId = formData.get('document_id') as string;
    }
    if (!documentId) {
      documentId = formData.get('id') as string;
    }
    
    console.log('Document ID from form data:', documentId);
    
    const userId = formData.get('userId') as string;
    console.log('User ID from form data:', userId);
    const changes = formData.get('changesSummary') as string || formData.get('changes') as string;
    const cookieJar = await cookieStore;
    const token = cookieJar.get('access-token')?.value || '';
    console.log('Cookie access-token present:', !!cookieJar.get('access-token'));
    console.log('Token length:', token?.length || 0);
    const versionType = (formData.get('versionType') as string) || 'minor';
    
    if (!file || !documentId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify token or use userId from form data
    let tokenData: any = { id: null };
    
    if (token) {
      try {
        const secretKey = process.env.JWT_SECRET_KEY || 'your-secret-key';
        tokenData = jwt.verify(token, secretKey);
        console.log('JWT verification successful, user ID from token:', tokenData.id);
      } catch (error) {
        console.error('JWT verification failed:', error);
        // Don't return error here, we'll fall back to userId from form data
      }
    } else {
      console.log('No token provided, using userId from form data');
    }

    const userId2 = tokenData.id || userId;

    if (!userId2) {
      console.error('No user ID found from token or form data');
      return NextResponse.json({ error: 'User ID not found. Please provide a valid user ID or token' }, { status: 400 });
    }

    // Get user info
    console.log('Looking up user with ID:', userId2);
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, first_name, last_name, role_id')
      .eq('id', userId2)
      .single();

    if (userError) {
      console.error('Error fetching user data:', userError);
    }

    if (!userData) {
      console.error('User not found with ID:', userId2);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    console.log('User found:', userData.id, `${userData.first_name} ${userData.last_name}`);

    // Get document info - first try with direct id match
    console.log('Looking up document with ID:', documentId);
    
    // First try to find the document directly by ID
    let { data: document, error: docError } = await supabase
      .from('documents')
      .select(`
        id, 
        document_number, 
        title, 
        file_name, 
        file_size, 
        file_type, 
        revision, 
        sharepoint_id, 
        sharepoint_path, 
        download_url,
        project_id,
        created_by
      `)
      .eq('id', documentId)
      .single();
      
    // If not found and ID looks like a UUID, try with direct query
    if (!document && documentId && documentId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      console.log('First lookup failed. Trying RPC call with document_id =', documentId);
      
      // Use RPC to get document with exact ID match
      const { data: rpcDoc, error: rpcError } = await supabase
        .rpc('get_document_by_id', { document_id: documentId });
        
      if (!rpcError && rpcDoc) {
        document = rpcDoc;
        console.log('Document found via RPC call');
      } else if (rpcError) {
        console.error('RPC lookup error:', rpcError);
      }
    }

    // Last resort: Try a more flexible search
    if (!document) {
      console.log('Document not found with exact ID. Trying flexible search for similar IDs');
      const { data: docs, error: searchError } = await supabase
        .from('documents')
        .select(`
          id, 
          document_number, 
          title, 
          file_name, 
          file_size, 
          file_type, 
          revision, 
          sharepoint_id, 
          sharepoint_path, 
          download_url,
          project_id,
          created_by
        `)
        .or(`document_number.eq.${documentId},title.ilike.%${documentId}%`)
        .limit(1);
        
      if (!searchError && docs && docs.length > 0) {
        document = docs[0];
        console.log('Document found via flexible search:', document.id);
      }
    }

    if (docError) {
      console.error('Error fetching document:', docError);
    }

    if (!document) {
      console.error('Document not found with ID:', documentId);
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
    
    console.log('Document found:', document.id, document.title);

    // Get the latest version for this document
    const { data: latestVersion } = await supabase
      .from('document_versions')
      .select('id, version, created_at, file_name, file_size, file_type, sharepoint_id, sharepoint_path, download_url')
      .eq('document_id', documentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Calculate next version number
    const currentVersion = latestVersion?.version || '1.0';
    const nextVersion = calculateNextVersion(currentVersion, versionType as 'minor' | 'major');
    console.log(`Calculating next version: Current=${currentVersion}, Next=${nextVersion}, Type=${versionType}`);

    // Check for existing version with same number (edge case)
    const { data: existingVersion } = await supabase
      .from('document_versions')
      .select('id')
      .eq('document_id', documentId)
      .eq('version', nextVersion)
      .limit(1)
      .single();

    if (existingVersion) {
      return NextResponse.json({ 
        error: `Version ${nextVersion} already exists. Please use a different version number.` 
      }, { status: 409 });
    }

    // Get SharePoint config from project
    const { data: sharePointConfig } = await supabase
      .from('project_sharepoint_configs')
      .select(`
        id,
        project_id,
        site_url as siteUrl,
        library_name as libraryName,
        client_id as clientId,
        client_secret as clientSecret
      `)
      .eq('project_id', document.project_id)
      .single();

    if (!sharePointConfig) {
      return NextResponse.json({ error: 'SharePoint configuration not found for this project' }, { status: 404 });
    }

    // Get SharePoint access token
    const accessToken = await getSharePointAccessToken(sharePointConfig);
    
    // Upload to SharePoint
    const sharePointResponse = await uploadVersionToSharePoint(file, sharePointConfig, accessToken, document);
    
    if (!sharePointResponse) {
      return NextResponse.json({ error: 'Failed to upload to SharePoint' }, { status: 500 });
    }

    console.log('SharePoint upload successful, recording version in database...');

    // Record activity log
    await supabase
      .from('document_activity_logs')
      .insert({
        document_id: documentId,
        activity_type: 'VERSION_UPLOAD',
        user_id: userId2,
        details: {
          version: nextVersion,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          changes: changes || `Version ${nextVersion} uploaded`
        }
      });

    // Add the version record
    const { data: versionRecord, error: versionError } = await supabase
      .from('document_versions')
      .insert({
        document_id: documentId,
        version: nextVersion,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        created_by: userId2,
        sharepoint_id: sharePointResponse.sharePointId,
        sharepoint_path: sharePointResponse.sharePointPath,
        download_url: sharePointResponse.downloadUrl,
        changes_summary: changes || `Version ${nextVersion} uploaded`,
        is_current_version: true
      })
      .select()
      .single();

    if (versionError) {
      console.error('Error creating version record:', versionError);
      return NextResponse.json({ error: 'Failed to create version record' }, { status: 500 });
    }

    // Update existing versions to not be current
    const { error: updateError } = await supabase
      .from('document_versions')
      .update({ is_current_version: false })
      .eq('document_id', documentId)
      .neq('id', versionRecord.id);

    if (updateError) {
      console.error('Error updating existing versions:', updateError);
      // Continue anyway as this is not critical
    }

    // Transform the record for response
    const transformedVersion = {
      id: versionRecord.id,
      documentId: versionRecord.document_id,
      version: versionRecord.version,
      uploadedBy: `${userData.first_name} ${userData.last_name}`,
      uploadedById: userId2,
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

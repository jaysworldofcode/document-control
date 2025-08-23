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

// GET - Fetch version history for a document
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const documentId = params.id;

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    // Get user's organization to ensure access
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
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

    // Fetch all versions for this document
    const { data: versions, error } = await supabase
      .from('document_versions')
      .select(`
        *,
        uploaded_by_user:users!document_versions_uploaded_by_fkey(id, first_name, last_name, email)
      `)
      .eq('document_id', documentId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching versions:', error);
      return NextResponse.json({ error: 'Failed to fetch version history' }, { status: 500 });
    }

    // Transform versions to match frontend interface
    const transformedVersions = versions?.map(version => ({
      id: version.id,
      version: version.version_number,
      uploadedBy: version.uploaded_by_user ? 
        `${version.uploaded_by_user.first_name} ${version.uploaded_by_user.last_name}` : 'Unknown',
      uploadedAt: version.created_at,
      changes: version.changes_summary || `Version ${version.version_number}`,
      filePath: version.sharepoint_path || '',
      fileName: version.file_name,
      fileSize: version.file_size,
      fileType: version.file_type,
      downloadUrl: version.download_url,
      isCurrent: version.is_current_version,
      description: version.description
    })) || [];

    // Include current document info as the latest version if no versions exist
    if (transformedVersions.length === 0) {
      // Get uploaded by user info for main document
      const { data: uploaderData } = await supabase
        .from('users')
        .select('first_name, last_name')
        .eq('id', document.uploaded_by)
        .single();

      const currentVersion = {
        id: `current-${document.version || '1.0'}`,
        version: document.version || '1.0',
        uploadedBy: uploaderData ? 
          `${uploaderData.first_name} ${uploaderData.last_name}` : 'Unknown',
        uploadedAt: document.uploaded_at || document.created_at,
        changes: 'Initial version',
        filePath: document.sharepoint_path || '',
        fileName: document.file_name,
        fileSize: document.file_size,
        fileType: document.file_type,
        downloadUrl: document.download_url,
        isCurrent: true,
        description: document.description || `Current version ${document.version || '1.0'}`
      };

      transformedVersions.push(currentVersion);
    }

    return NextResponse.json({
      documentId,
      documentName: document.title,
      versions: transformedVersions,
      totalVersions: transformedVersions.length
    });

  } catch (error) {
    console.error('Error in GET /api/documents/[id]/versions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

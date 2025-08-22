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

// GET - Fetch documents for a project
export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
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

    // Verify project exists and user has access
    const { data: project } = await supabase
      .from('projects')
      .select('id, organization_id')
      .eq('id', projectId)
      .eq('organization_id', userData.organization_id)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 });
    }

    // Fetch documents for the project
    const { data: documents, error } = await supabase
      .from('documents')
      .select(`
        *,
        uploaded_by_user:users!documents_uploaded_by_fkey(id, first_name, last_name, email)
      `)
      .eq('project_id', projectId)
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('Error fetching documents:', error);
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
    }

    // Transform documents to match frontend interface
    const transformedDocuments = documents?.map(doc => ({
      id: doc.id,
      name: doc.title,
      fileName: doc.file_name,
      fileType: doc.file_type || 'unknown',
      fileSize: doc.file_size || 0,
      version: '1.0', // Default version since we don't have versioning yet
      status: 'draft' as const, // Default status since we don't have status field yet
      uploadedBy: doc.uploaded_by_user ? `${doc.uploaded_by_user.first_name} ${doc.uploaded_by_user.last_name}` : 'Unknown',
      uploadedAt: doc.uploaded_at,
      lastModified: doc.updated_at,
      lastModifiedBy: doc.uploaded_by_user ? `${doc.uploaded_by_user.first_name} ${doc.uploaded_by_user.last_name}` : 'Unknown',
      sharePointPath: doc.sharepoint_path || '',
      description: '',
      tags: [],
      projectId: doc.project_id,
      customFieldValues: doc.custom_field_values || {},
      revisionHistory: []
    })) || [];

    return NextResponse.json(transformedDocuments);
  } catch (error) {
    console.error('Error in GET /api/documents:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Upload a new document
export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      projectId,
      title,
      fileName,
      fileType,
      fileSize,
      sharePointPath,
      customFieldValues = {}
    } = body;

    if (!projectId || !title || !fileName) {
      return NextResponse.json({ error: 'Project ID, title, and file name are required' }, { status: 400 });
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

    // Verify project exists and user has access
    const { data: project } = await supabase
      .from('projects')
      .select('id, organization_id')
      .eq('id', projectId)
      .eq('organization_id', userData.organization_id)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 });
    }

    // Create the document
    const { data: document, error } = await supabase
      .from('documents')
      .insert({
        project_id: projectId,
        title,
        file_name: fileName,
        file_type: fileType,
        file_size: fileSize,
        sharepoint_path: sharePointPath,
        custom_field_values: customFieldValues,
        uploaded_by: user.userId
      })
      .select(`
        *,
        uploaded_by_user:users!documents_uploaded_by_fkey(id, first_name, last_name, email)
      `)
      .single();

    if (error) {
      console.error('Error creating document:', error);
      return NextResponse.json({ error: 'Failed to create document' }, { status: 500 });
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
      description: '',
      tags: [],
      projectId: document.project_id,
      customFieldValues: document.custom_field_values || {},
      revisionHistory: []
    };

    return NextResponse.json(transformedDocument, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/documents:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

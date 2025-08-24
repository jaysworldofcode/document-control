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

// Helper function to transform custom field values using field definitions
async function transformCustomFieldValues(projectId: string, customFieldValues: Record<string, any>) {
  const { data: project } = await supabase
    .from('projects')
    .select('custom_fields')
    .eq('id', projectId)
    .single();

  if (!project?.custom_fields) {
    return customFieldValues;
  }

  const fieldDefinitions = project.custom_fields;
  const transformedValues: Record<string, any> = {};

  const fieldMap = fieldDefinitions.reduce((acc: Record<string, string>, field: any) => {
    acc[field.id] = field.name;
    return acc;
  }, {});

  Object.entries(customFieldValues).forEach(([fieldId, value]) => {
    const fieldName = fieldMap[fieldId];
    if (fieldName) {
      transformedValues[fieldName] = value;
    } else {
      transformedValues[fieldId] = value;
    }
  });

  return transformedValues;
}

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    // Pagination params
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    
    // Filter params
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const projectId = searchParams.get('projectId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const sortBy = searchParams.get('sortBy') || 'uploaded_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Get user's organization
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.userId)
      .single();

    if (!userData?.organization_id) {
      return NextResponse.json({ error: 'User organization not found' }, { status: 404 });
    }

    // First get the project IDs for the user's organization
    const { data: projectIds } = await supabase
      .from('projects')
      .select('id')
      .eq('organization_id', userData.organization_id);

    if (!projectIds) {
      return NextResponse.json({ error: 'No projects found' }, { status: 404 });
    }

    // Build the query
    let query = supabase
      .from('documents')
      .select('*, uploaded_by_user:users!documents_uploaded_by_fkey(id, first_name, last_name, email), project:projects(id, name, custom_fields)');

    // Apply filters
    if (search) {
      query = query.or(`title.ilike.%${search}%,file_name.ilike.%${search}%`);
    }
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (projectId && projectId !== 'all') {
      query = query.eq('project_id', projectId);
    }
    if (startDate) {
      query = query.gte('uploaded_at', startDate);
    }
    if (endDate) {
      query = query.lte('uploaded_at', endDate);
    }

    // Filter to show only current user's documents
    query = query.eq('uploaded_by', user.userId);

    // Only show documents from user's organization's projects
    query = query.in('project_id', projectIds.map(p => p.id));

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data: documents, error } = await query;

    if (error) {
      console.error('Error fetching documents:', error);
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
    }

    // Get total count for current user's documents
    const countResult = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('uploaded_by', user.userId)
      .in('project_id', projectIds.map(p => p.id));

    const totalCount = countResult.count || 0;



    // Transform documents
    const transformedDocuments = await Promise.all((documents || []).map(async doc => {
      const transformedCustomFields = await transformCustomFieldValues(
        doc.project_id,
        doc.custom_field_values || {}
      );

      const uploadedByName = doc.uploaded_by_user 
        ? `${doc.uploaded_by_user.first_name} ${doc.uploaded_by_user.last_name}`
        : 'Unknown';

      return {
        id: doc.id,
        name: doc.title,
        fileName: doc.file_name,
        fileType: doc.file_type || 'unknown',
        fileSize: doc.file_size || 0,
        version: doc.version || '1.0',
        status: doc.status || 'draft',
        uploadedBy: uploadedByName,
        uploadedAt: doc.uploaded_at,
        lastModified: doc.updated_at,
        lastModifiedBy: uploadedByName,
        sharePointPath: doc.sharepoint_path || '',
        description: doc.description || '',
        tags: doc.tags || [],
        projectId: doc.project_id,
        projectName: doc.project?.name || '',
        customFieldValues: transformedCustomFields,
        revisionHistory: []
      };
    }));

    return NextResponse.json({
      documents: transformedDocuments,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize)
      }
    });

  } catch (error) {
    console.error('Error in GET /api/documents/list:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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

// GET - Fetch a single project by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projectId = params.id;

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Get user's organization to filter projects
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.userId)
      .single();

    if (!userData?.organization_id) {
      return NextResponse.json({ error: 'User organization not found' }, { status: 404 });
    }

    // Fetch the specific project with all related data
    const { data: project, error } = await supabase
      .from('projects')
      .select(`
        *,
        project_managers(
          id,
          can_approve_documents,
          is_primary_manager,
          added_at,
          user:users!project_managers_user_id_fkey(id, first_name, last_name, email, role)
        ),
        project_team(
          id,
          role,
          added_at,
          user:users!project_team_user_id_fkey(id, first_name, last_name, email, role)
        ),
        documents(count)
      `)
      .eq('id', projectId)
      .eq('organization_id', userData.organization_id)
      .eq('is_archived', false)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }
      console.error('Error fetching project:', error);
      return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 });
    }

    // Transform the data to match the frontend interface
    const transformedProject = {
      id: project.id,
      name: project.name,
      description: project.description || '',
      status: project.status,
      priority: project.priority,
      startDate: project.start_date,
      endDate: project.end_date,
      progress: project.progress || 0,
      documentsCount: project.documents?.[0]?.count || 0,
      budget: project.budget || '',
      client: project.client || '',
      clientId: project.client_id,
      managers: project.project_managers?.map((pm: any) => ({
        id: pm.user.id,
        name: `${pm.user.first_name} ${pm.user.last_name}`,
        email: pm.user.email,
        role: pm.user.role,
        canApproveDocuments: pm.can_approve_documents,
        isPrimaryManager: pm.is_primary_manager,
        addedAt: pm.added_at,
        addedBy: ''
      })) || [],
      team: project.project_team?.map((tm: any) => ({
        id: tm.user.id,
        name: `${tm.user.first_name} ${tm.user.last_name}`,
        email: tm.user.email,
        role: tm.role || 'team member',
        addedAt: tm.added_at
      })) || [],
      sharePointConfig: {
        folderPath: project.sharepoint_folder_path || '',
        folderId: project.sharepoint_folder_id,
        excelSheetPath: project.sharepoint_excel_path,
        excelSheetId: project.sharepoint_excel_id,
        isExcelLoggingEnabled: project.excel_logging_enabled || false
      },
      customFields: project.custom_fields || [],
      createdAt: project.created_at,
      updatedAt: project.updated_at,
      createdBy: project.created_by,
      tags: project.tags || [],
      category: project.category,
      isArchived: project.is_archived
    };

    return NextResponse.json(transformedProject);
  } catch (error) {
    console.error('Error in GET /api/projects/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

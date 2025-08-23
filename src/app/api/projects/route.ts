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

// GET - Fetch all projects
export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    // Fetch projects with managers and team counts
    const { data: projects, error } = await supabase
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
        project_team(count),
        documents(count)
      `)
      .eq('organization_id', userData.organization_id)
      .eq('is_archived', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
      return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
    }

    // Transform the data to match the frontend interface
    const transformedProjects = projects?.map(project => ({
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
      team: [], // We'll populate this with the count for now
      sharePointConfig: {
        siteUrl: project.sharepoint_site_url || '',
        documentLibrary: project.sharepoint_document_library || 'Documents',
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
    })) || [];

    // Add team count to each project
    for (const project of transformedProjects) {
      const { count } = await supabase
        .from('project_team')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', project.id);
      
      project.team = Array(count || 0).fill(null).map((_, index) => ({
        id: `member-${index}`,
        name: 'Team Member',
        email: '',
        role: 'team member'
      }));
    }

    return NextResponse.json(transformedProjects);
  } catch (error) {
    console.error('Error in GET /api/projects:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new project
export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      status = 'planning',
      priority = 'medium',
      startDate,
      endDate,
      budget,
      client,
      clientId,
      managerIds = [],
      teamIds = [],
      sharePointSiteUrl,
      sharePointDocumentLibrary = 'Documents',
      sharePointExcelPath,
      sharePointExcelId,
      enableExcelLogging = false,
      customFields = [],
      tags = [],
      category
    } = body;

    // Validate required fields
    if (!name || !startDate) {
      return NextResponse.json({ error: 'Name and start date are required' }, { status: 400 });
    }

    // Get user's organization
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.userId)
      .single();

    if (!userData?.organization_id) {
      return NextResponse.json({ error: 'User organization not found' }, { status: 404 });
    }

    // Create the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        name,
        description,
        status,
        priority,
        start_date: startDate === '' ? null : startDate,
        end_date: endDate === '' ? null : endDate,
        budget,
        client,
        client_id: clientId,
        organization_id: userData.organization_id,
        sharepoint_site_url: sharePointSiteUrl,
        sharepoint_document_library: sharePointDocumentLibrary,
        sharepoint_excel_path: sharePointExcelPath,
        sharepoint_excel_id: sharePointExcelId,
        excel_logging_enabled: enableExcelLogging,
        custom_fields: customFields,
        tags,
        category,
        created_by: user.userId
      })
      .select()
      .single();

    if (projectError) {
      console.error('Error creating project:', projectError);
      return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
    }

    // Add managers to the project
    if (managerIds.length > 0) {
      const managerInserts = managerIds.map((managerId: string, index: number) => ({
        project_id: project.id,
        user_id: managerId,
        is_primary_manager: index === 0, // First manager is primary
        can_approve_documents: true,
        added_by: user.userId
      }));

      const { error: managersError } = await supabase
        .from('project_managers')
        .insert(managerInserts);

      if (managersError) {
        console.error('Error adding project managers:', managersError);
      }
    }

    // Add team members to the project
    if (teamIds.length > 0) {
      const teamInserts = teamIds.map((teamId: string) => ({
        project_id: project.id,
        user_id: teamId,
        role: 'team member',
        added_by: user.userId
      }));

      const { error: teamError } = await supabase
        .from('project_team')
        .insert(teamInserts);

      if (teamError) {
        console.error('Error adding project team:', teamError);
      }
    }

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/projects:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update a project
export async function PUT(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      name,
      description,
      status,
      priority,
      startDate,
      endDate,
      budget,
      client,
      clientId,
      managerIds,
      teamIds,
      sharePointExcelPath,
      sharePointExcelId,
      enableExcelLogging,
      customFields,
      tags,
      category
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Check if project exists and user has access
    const { data: existingProject } = await supabase
      .from('projects')
      .select('id, organization_id')
      .eq('id', id)
      .single();

    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get user's organization to verify access
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.userId)
      .single();

    if (existingProject.organization_id !== userData?.organization_id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Update project
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (startDate !== undefined) updateData.start_date = startDate === '' ? null : startDate;
    if (endDate !== undefined) updateData.end_date = endDate === '' ? null : endDate;
    if (budget !== undefined) updateData.budget = budget;
    if (client !== undefined) updateData.client = client;
    if (clientId !== undefined) updateData.client_id = clientId;
    if (sharePointExcelPath !== undefined) updateData.sharepoint_excel_path = sharePointExcelPath;
    if (sharePointExcelId !== undefined) updateData.sharepoint_excel_id = sharePointExcelId;
    if (enableExcelLogging !== undefined) updateData.excel_logging_enabled = enableExcelLogging;
    if (customFields !== undefined) updateData.custom_fields = customFields;
    if (tags !== undefined) updateData.tags = tags;
    if (category !== undefined) updateData.category = category;

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (projectError) {
      console.error('Error updating project:', projectError);
      return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
    }

    // Update managers if provided
    if (managerIds !== undefined) {
      // Remove existing managers
      await supabase
        .from('project_managers')
        .delete()
        .eq('project_id', id);

      // Add new managers
      if (managerIds.length > 0) {
        const managerInserts = managerIds.map((managerId: string, index: number) => ({
          project_id: id,
          user_id: managerId,
          is_primary_manager: index === 0,
          can_approve_documents: true,
          added_by: user.userId
        }));

        await supabase
          .from('project_managers')
          .insert(managerInserts);
      }
    }

    // Update team if provided
    if (teamIds !== undefined) {
      // Remove existing team members
      await supabase
        .from('project_team')
        .delete()
        .eq('project_id', id);

      // Add new team members
      if (teamIds.length > 0) {
        const teamInserts = teamIds.map((teamId: string) => ({
          project_id: id,
          user_id: teamId,
          role: 'team member',
          added_by: user.userId
        }));

        await supabase
          .from('project_team')
          .insert(teamInserts);
      }
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error in PUT /api/projects:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Archive a project (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Check if project exists and user has access
    const { data: existingProject } = await supabase
      .from('projects')
      .select('id, organization_id')
      .eq('id', id)
      .single();

    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get user's organization to verify access
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.userId)
      .single();

    if (existingProject.organization_id !== userData?.organization_id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Archive the project (soft delete)
    const { error } = await supabase
      .from('projects')
      .update({ is_archived: true })
      .eq('id', id);

    if (error) {
      console.error('Error archiving project:', error);
      return NextResponse.json({ error: 'Failed to archive project' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Project archived successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/projects:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

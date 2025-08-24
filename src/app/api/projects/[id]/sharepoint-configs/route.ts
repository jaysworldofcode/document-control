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

// Helper function to test SharePoint connection
async function testSharePointConnection(projectId: string, config: any) {
  try {
    // Get the organization ID for this project
    const { data: project } = await supabase
      .from('projects')
      .select('organization_id')
      .eq('id', projectId)
      .single();
      
    if (!project) {
      return { success: false, message: 'Project not found' };
    }
    
    // Get organization's SharePoint config for auth details
    const { data: orgConfig } = await supabase
      .from('sharepoint_configs')
      .select('tenant_id, client_id, client_secret')
      .eq('organization_id', project.organization_id)
      .single();
      
    if (!orgConfig) {
      return { 
        success: false, 
        message: 'Organization SharePoint configuration not found. Please set up SharePoint integration at the organization level first.' 
      };
    }
    
    // Test with organization credentials and project site URL
    const tokenUrl = `https://login.microsoftonline.com/${orgConfig.tenant_id}/oauth2/v2.0/token`;
    
    const params = new URLSearchParams({
      client_id: orgConfig.client_id,
      client_secret: orgConfig.client_secret,
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

    const tokenData = await response.json();
    const accessToken = tokenData.access_token;

    // Test site access
    const hostMatch = config.site_url.match(/https?:\/\/([^\/]+)/);
    const siteUrlMatch = config.site_url.match(/\/sites\/([^\/]+)/);
    
    if (!hostMatch || !siteUrlMatch) {
      throw new Error('Invalid SharePoint site URL format');
    }
    
    const hostname = hostMatch[1];
    const siteName = siteUrlMatch[1];

    const siteInfoUrl = `https://graph.microsoft.com/v1.0/sites/${hostname}:/sites/${siteName}`;
    
    const siteResponse = await fetch(siteInfoUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!siteResponse.ok) {
      throw new Error(`Failed to access SharePoint site: ${siteResponse.status}`);
    }

    return { success: true, message: 'Connection successful' };
  } catch (error) {
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// GET - Get all SharePoint configurations for a project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const projectId = resolvedParams.id;

    // Get user's organization
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.userId)
      .single();

    if (!userData?.organization_id) {
      return NextResponse.json({ error: 'User organization not found' }, { status: 404 });
    }

    // Verify project access
    const { data: project } = await supabase
      .from('projects')
      .select('id, organization_id')
      .eq('id', projectId)
      .eq('organization_id', userData.organization_id)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 });
    }

    // Get project SharePoint configurations
    const { data: configs, error } = await supabase
      .from('project_sharepoint_configs')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching SharePoint configs:', error);
      return NextResponse.json({ error: 'Failed to fetch configurations' }, { status: 500 });
    }

    return NextResponse.json(configs || []);
  } catch (error) {
    console.error('Error in GET /api/projects/[id]/sharepoint-configs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new SharePoint configuration for a project
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const projectId = resolvedParams.id;
    const body = await request.json();
    const {
      name,
      description,
      site_url,
      document_library,
      folder_path,
      is_excel_logging_enabled,
      excel_sheet_path,
      is_enabled
    } = body;

    // Validate required fields
    if (!name || !site_url) {
      return NextResponse.json({ 
        error: 'Name and site URL are required' 
      }, { status: 400 });
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

    // Verify project access
    const { data: project } = await supabase
      .from('projects')
      .select('id, organization_id')
      .eq('id', projectId)
      .eq('organization_id', userData.organization_id)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 });
    }
    
    // Check if organization has SharePoint config
    const { data: orgConfig } = await supabase
      .from('sharepoint_configs')
      .select('*')
      .eq('organization_id', userData.organization_id)
      .single();
      
    if (!orgConfig) {
      return NextResponse.json({ 
        error: 'Organization SharePoint configuration not found', 
        message: 'Please set up SharePoint integration at the organization level first.' 
      }, { status: 400 });
    }

    // Test connection before saving
    const testResult = await testSharePointConnection(
      projectId,
      { site_url }
    );

    if (!testResult.success) {
      return NextResponse.json({ 
        error: 'SharePoint connection test failed',
        details: testResult.message
      }, { status: 400 });
    }

    // Create the configuration - without auth details
    const { data: config, error } = await supabase
      .from('project_sharepoint_configs')
      .insert({
        project_id: projectId,
        name,
        description: description || '',
        site_url,
        document_library: document_library || 'Documents',
        folder_path: folder_path || '',
        is_excel_logging_enabled: is_excel_logging_enabled || false,
        excel_sheet_path: excel_sheet_path || '',
        is_enabled: is_enabled !== false, // Default to true
        created_by: user.userId
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating SharePoint config:', error);
      return NextResponse.json({ error: 'Failed to create configuration' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      config,
      message: 'SharePoint configuration created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/projects/[id]/sharepoint-configs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

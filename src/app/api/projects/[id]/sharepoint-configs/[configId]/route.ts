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
async function testSharePointConnection(config: any) {
  try {
    const tokenUrl = `https://login.microsoftonline.com/${config.tenant_id}/oauth2/v2.0/token`;
    
    const params = new URLSearchParams({
      client_id: config.client_id,
      client_secret: config.client_secret,
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

    const siteData = await siteResponse.json();

    // Test document library access
    const siteId = siteData.id;
    const driveUrl = `https://graph.microsoft.com/v1.0/sites/${siteId}/drives`;
    
    const driveResponse = await fetch(driveUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!driveResponse.ok) {
      throw new Error(`Failed to access document libraries: ${driveResponse.status}`);
    }

    const driveData = await driveResponse.json();
    const availableLibraries = driveData.value?.map((d: any) => d.name) || [];

    return { 
      success: true, 
      message: 'Connection successful',
      siteName: siteData.name,
      availableLibraries
    };
  } catch (error) {
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// GET - Get a specific SharePoint configuration
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; configId: string } }
) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId, configId } = params;

    // Get user's organization
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.userId)
      .single();

    if (!userData?.organization_id) {
      return NextResponse.json({ error: 'User organization not found' }, { status: 404 });
    }

    // Verify project access and get config
    const { data: config, error } = await supabase
      .from('project_sharepoint_configs')
      .select(`
        *,
        project:projects!inner(id, organization_id)
      `)
      .eq('id', configId)
      .eq('project_id', projectId)
      .eq('project.organization_id', userData.organization_id)
      .single();

    if (error || !config) {
      return NextResponse.json({ error: 'Configuration not found or access denied' }, { status: 404 });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error in GET /api/projects/[id]/sharepoint-configs/[configId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update a SharePoint configuration
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; configId: string } }
) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId, configId } = params;
    const body = await request.json();
    const {
      name,
      description,
      tenant_id,
      client_id,
      client_secret,
      site_url,
      document_library,
      folder_path,
      is_excel_logging_enabled,
      excel_sheet_path,
      is_enabled
    } = body;

    // Validate required fields
    if (!name || !tenant_id || !client_id || !client_secret || !site_url) {
      return NextResponse.json({ 
        error: 'Name, tenant ID, client ID, client secret, and site URL are required' 
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

    // Verify project access and config exists
    const { data: existingConfig } = await supabase
      .from('project_sharepoint_configs')
      .select(`
        *,
        project:projects!inner(id, organization_id)
      `)
      .eq('id', configId)
      .eq('project_id', projectId)
      .eq('project.organization_id', userData.organization_id)
      .single();

    if (!existingConfig) {
      return NextResponse.json({ error: 'Configuration not found or access denied' }, { status: 404 });
    }

    // Test connection before updating
    const testResult = await testSharePointConnection({
      tenant_id,
      client_id,
      client_secret,
      site_url
    });

    if (!testResult.success) {
      return NextResponse.json({ 
        error: 'SharePoint connection test failed',
        details: testResult.message
      }, { status: 400 });
    }

    // Update the configuration
    const { data: config, error } = await supabase
      .from('project_sharepoint_configs')
      .update({
        name,
        description: description || '',
        tenant_id,
        client_id,
        client_secret,
        site_url,
        document_library: document_library || 'Documents',
        folder_path: folder_path || '',
        is_excel_logging_enabled: is_excel_logging_enabled || false,
        excel_sheet_path: excel_sheet_path || '',
        is_enabled: is_enabled !== false,
        updated_at: new Date().toISOString()
      })
      .eq('id', configId)
      .select()
      .single();

    if (error) {
      console.error('Error updating SharePoint config:', error);
      return NextResponse.json({ error: 'Failed to update configuration' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      config,
      message: 'SharePoint configuration updated successfully'
    });

  } catch (error) {
    console.error('Error in PUT /api/projects/[id]/sharepoint-configs/[configId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete a SharePoint configuration
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; configId: string } }
) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId, configId } = params;

    // Get user's organization
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.userId)
      .single();

    if (!userData?.organization_id) {
      return NextResponse.json({ error: 'User organization not found' }, { status: 404 });
    }

    // Verify project access and config exists
    const { data: existingConfig } = await supabase
      .from('project_sharepoint_configs')
      .select(`
        *,
        project:projects!inner(id, organization_id)
      `)
      .eq('id', configId)
      .eq('project_id', projectId)
      .eq('project.organization_id', userData.organization_id)
      .single();

    if (!existingConfig) {
      return NextResponse.json({ error: 'Configuration not found or access denied' }, { status: 404 });
    }

    // Delete the configuration
    const { error } = await supabase
      .from('project_sharepoint_configs')
      .delete()
      .eq('id', configId);

    if (error) {
      console.error('Error deleting SharePoint config:', error);
      return NextResponse.json({ error: 'Failed to delete configuration' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'SharePoint configuration deleted successfully'
    });

  } catch (error) {
    console.error('Error in DELETE /api/projects/[id]/sharepoint-configs/[configId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Test SharePoint connection
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; configId: string } }
) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId, configId } = params;

    // Check if this is a test of existing config or new config data
    const body = await request.json();
    
    let configToTest;
    if (body.tenant_id) {
      // Testing new configuration data
      configToTest = body;
    } else {
      // Testing existing configuration
      const { data: userData } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.userId)
        .single();

      if (!userData?.organization_id) {
        return NextResponse.json({ error: 'User organization not found' }, { status: 404 });
      }

      const { data: config } = await supabase
        .from('project_sharepoint_configs')
        .select(`
          *,
          project:projects!inner(id, organization_id)
        `)
        .eq('id', configId)
        .eq('project_id', projectId)
        .eq('project.organization_id', userData.organization_id)
        .single();

      if (!config) {
        return NextResponse.json({ error: 'Configuration not found' }, { status: 404 });
      }

      configToTest = config;
    }

    // Test the connection
    const testResult = await testSharePointConnection(configToTest);

    return NextResponse.json(testResult);

  } catch (error) {
    console.error('Error in POST /api/projects/[id]/sharepoint-configs/[configId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

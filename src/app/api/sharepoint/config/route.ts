import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface JWTPayload {
  userId: string;
  email: string;
  organizationId: string;
}

interface SharePointConfig {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  siteUrl: string;
  documentLibrary: string;
  isEnabled: boolean;
}

async function getUserFromToken(request: NextRequest): Promise<JWTPayload | null> {
  try {
    // Try cookie first
    const tokenFromCookie = request.cookies.get('auth-token')?.value;
    
    if (tokenFromCookie) {
      return jwt.verify(tokenFromCookie, process.env.JWT_SECRET!) as JWTPayload;
    }

    // Fallback to Authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      return jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    }

    return null;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

// GET /api/sharepoint/config - Get SharePoint configuration
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get SharePoint configuration for the organization
    const { data: config, error } = await supabase
      .from('sharepoint_configs')
      .select('*')
      .eq('organization_id', user.organizationId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching SharePoint config:', error);
      return NextResponse.json({ error: 'Failed to fetch configuration' }, { status: 500 });
    }

    if (!config) {
      // No configuration found, return default empty config
      return NextResponse.json({
        tenantId: '',
        clientId: '',
        clientSecret: '',
        siteUrl: '',
        documentLibrary: '',
        isEnabled: false,
      });
    }

    // Don't return the actual client secret for security
    return NextResponse.json({
      tenantId: config.tenant_id || '',
      clientId: config.client_id || '',
      clientSecret: config.client_secret ? '••••••••••••' : '',
      siteUrl: config.site_url || '',
      documentLibrary: config.document_library || '',
      isEnabled: config.is_enabled || false,
    });

  } catch (error) {
    console.error('Error in SharePoint config GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/sharepoint/config - Save SharePoint configuration
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const config: SharePointConfig = await request.json();
    
    // Validate required fields
    const requiredFields = ['tenantId', 'clientId', 'clientSecret', 'siteUrl', 'documentLibrary'];
    const missingFields = requiredFields.filter(field => !config[field as keyof SharePointConfig]);
    
    if (missingFields.length > 0) {
      return NextResponse.json({
        error: 'Missing required fields',
        details: `Please provide: ${missingFields.join(', ')}`,
      }, { status: 400 });
    }

    // Validate URL format
    try {
      new URL(config.siteUrl);
    } catch {
      return NextResponse.json({
        error: 'Invalid SharePoint site URL',
        details: 'Please provide a valid URL (e.g., https://yourcompany.sharepoint.com/sites/sitename)',
      }, { status: 400 });
    }

    // Upsert SharePoint configuration
    const { data, error } = await supabase
      .from('sharepoint_configs')
      .upsert({
        organization_id: user.organizationId,
        tenant_id: config.tenantId,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        site_url: config.siteUrl,
        document_library: config.documentLibrary,
        is_enabled: config.isEnabled,
        updated_by: user.userId,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'organization_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving SharePoint config:', error);
      return NextResponse.json({ error: 'Failed to save configuration' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'SharePoint configuration saved successfully',
      config: {
        tenantId: data.tenant_id,
        clientId: data.client_id,
        clientSecret: '••••••••••••', // Don't return actual secret
        siteUrl: data.site_url,
        documentLibrary: data.document_library,
        isEnabled: data.is_enabled,
      },
    });

  } catch (error) {
    console.error('Error in SharePoint config POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/sharepoint/config - Delete SharePoint configuration
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete SharePoint configuration
    const { error } = await supabase
      .from('sharepoint_configs')
      .delete()
      .eq('organization_id', user.organizationId);

    if (error) {
      console.error('Error deleting SharePoint config:', error);
      return NextResponse.json({ error: 'Failed to delete configuration' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'SharePoint configuration deleted successfully',
    });

  } catch (error) {
    console.error('Error in SharePoint config DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

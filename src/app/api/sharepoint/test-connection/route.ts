import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

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

async function getAccessToken(config: SharePointConfig): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    const tokenUrl = `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/token`;
    
    const params = new URLSearchParams();
    params.append('client_id', config.clientId);
    params.append('client_secret', config.clientSecret);
    params.append('scope', 'https://graph.microsoft.com/.default');
    params.append('grant_type', 'client_credentials');

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: `Authentication failed: ${errorData.error_description || errorData.error || 'Unknown error'}`,
      };
    }

    const tokenData = await response.json();
    return {
      success: true,
      token: tokenData.access_token,
    };
  } catch (error) {
    return {
      success: false,
      error: `Token request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

async function testSharePointSiteAccess(token: string, siteUrl: string): Promise<{ success: boolean; error?: string; siteInfo?: any }> {
  try {
    // Extract site details from URL
    const url = new URL(siteUrl);
    const hostname = url.hostname;
    const sitePath = url.pathname;
    
    // Construct Graph API URL for the site
    const graphUrl = `https://graph.microsoft.com/v1.0/sites/${hostname}:${sitePath}`;
    
    const response = await fetch(graphUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: `Site access failed: ${errorData.error?.message || 'Unable to access SharePoint site'}`,
      };
    }

    const siteData = await response.json();
    return {
      success: true,
      siteInfo: {
        id: siteData.id,
        name: siteData.displayName,
        webUrl: siteData.webUrl,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Site access test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

async function testDocumentLibraryAccess(token: string, siteId: string, libraryName: string): Promise<{ success: boolean; error?: string; libraryInfo?: any }> {
  try {
    // Get lists/libraries for the site
    const listsUrl = `https://graph.microsoft.com/v1.0/sites/${siteId}/lists`;
    
    const response = await fetch(listsUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: `Library access failed: ${errorData.error?.message || 'Unable to access document libraries'}`,
      };
    }

    const listsData = await response.json();
    const library = listsData.value.find((list: any) => 
      list.displayName.toLowerCase() === libraryName.toLowerCase() ||
      list.name.toLowerCase() === libraryName.toLowerCase()
    );

    if (!library) {
      return {
        success: false,
        error: `Document library '${libraryName}' not found. Available libraries: ${listsData.value.filter((l: any) => l.list?.template === 'documentLibrary').map((l: any) => l.displayName).join(', ')}`,
      };
    }

    // Test if we can access the library items
    const itemsUrl = `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${library.id}/items?$top=1`;
    
    const itemsResponse = await fetch(itemsUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    if (!itemsResponse.ok) {
      const errorData = await itemsResponse.json();
      return {
        success: false,
        error: `Library read access failed: ${errorData.error?.message || 'Unable to read from document library'}`,
      };
    }

    return {
      success: true,
      libraryInfo: {
        id: library.id,
        name: library.displayName,
        itemCount: library.list?.itemCount || 0,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Library access test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
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

    // Step 1: Test authentication and get access token
    console.log('Testing SharePoint authentication...');
    const tokenResult = await getAccessToken(config);
    if (!tokenResult.success) {
      return NextResponse.json({
        error: 'Authentication failed',
        details: tokenResult.error,
      }, { status: 400 });
    }

    // Step 2: Test site access
    console.log('Testing SharePoint site access...');
    const siteResult = await testSharePointSiteAccess(tokenResult.token!, config.siteUrl);
    if (!siteResult.success) {
      return NextResponse.json({
        error: 'Site access failed',
        details: siteResult.error,
      }, { status: 400 });
    }

    // Step 3: Test document library access
    console.log('Testing document library access...');
    const libraryResult = await testDocumentLibraryAccess(
      tokenResult.token!, 
      siteResult.siteInfo!.id, 
      config.documentLibrary
    );
    if (!libraryResult.success) {
      return NextResponse.json({
        error: 'Document library access failed',
        details: libraryResult.error,
      }, { status: 400 });
    }

    // All tests passed
    return NextResponse.json({
      success: true,
      message: 'Connection test successful',
      details: `Successfully connected to SharePoint site '${siteResult.siteInfo!.name}' and verified access to document library '${libraryResult.libraryInfo!.name}' (${libraryResult.libraryInfo!.itemCount} items).`,
      testResults: {
        authentication: 'SUCCESS',
        siteAccess: 'SUCCESS',
        libraryAccess: 'SUCCESS',
        siteInfo: siteResult.siteInfo,
        libraryInfo: libraryResult.libraryInfo,
      },
    });

  } catch (error) {
    console.error('SharePoint connection test error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: 'An unexpected error occurred while testing the SharePoint connection.',
    }, { status: 500 });
  }
}

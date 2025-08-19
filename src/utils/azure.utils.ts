// Azure SharePoint Integration Utilities

import { AzureCredentials, SharePointConfig } from '@/types/organization.types';

export interface AzureConnectionTestResult {
  success: boolean;
  message: string;
  details?: {
    tokenObtained: boolean;
    siteAccessible: boolean;
    folderAccessible: boolean;
    permissions: string[];
  };
  error?: string;
}

/**
 * Test Azure AD connection with provided credentials
 */
export async function testAzureConnection(credentials: AzureCredentials): Promise<AzureConnectionTestResult> {
  try {
    // In a real implementation, this would:
    // 1. Try to obtain an access token using client credentials flow
    // 2. Test basic Graph API access
    // 3. Validate the tenant and client IDs
    
    // Mock implementation for demo
    const isValidFormat = validateAzureCredentials(credentials);
    
    if (!isValidFormat.valid) {
      return {
        success: false,
        message: 'Invalid credential format',
        error: isValidFormat.error
      };
    }

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock successful response
    return {
      success: true,
      message: 'Azure connection successful',
      details: {
        tokenObtained: true,
        siteAccessible: true,
        folderAccessible: true,
        permissions: ['Sites.ReadWrite.All', 'Files.ReadWrite.All', 'User.Read']
      }
    };

  } catch (error) {
    return {
      success: false,
      message: 'Connection failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Test SharePoint site access
 */
export async function testSharePointAccess(
  credentials: AzureCredentials, 
  config: SharePointConfig
): Promise<AzureConnectionTestResult> {
  try {
    // In a real implementation, this would:
    // 1. Get access token
    // 2. Try to access the SharePoint site
    // 3. Check folder permissions
    // 4. Validate drive access

    const isValidConfig = validateSharePointConfig(config);
    
    if (!isValidConfig.valid) {
      return {
        success: false,
        message: 'Invalid SharePoint configuration',
        error: isValidConfig.error
      };
    }

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    return {
      success: true,
      message: 'SharePoint access verified',
      details: {
        tokenObtained: true,
        siteAccessible: true,
        folderAccessible: true,
        permissions: ['read', 'write', 'create', 'delete']
      }
    };

  } catch (error) {
    return {
      success: false,
      message: 'SharePoint access failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Validate Azure credentials format
 */
export function validateAzureCredentials(credentials: AzureCredentials): { valid: boolean; error?: string } {
  const { tenantId, clientId, clientSecret } = credentials;

  // Check if all required fields are present
  if (!tenantId || !clientId || !clientSecret) {
    return { valid: false, error: 'All fields are required (Tenant ID, Client ID, Client Secret)' };
  }

  // Validate GUID format for tenant and client IDs
  const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  
  if (!guidRegex.test(tenantId)) {
    return { valid: false, error: 'Tenant ID must be a valid GUID format' };
  }

  if (!guidRegex.test(clientId)) {
    return { valid: false, error: 'Client ID must be a valid GUID format' };
  }

  // Basic client secret validation (should be a reasonable length)
  if (clientSecret.length < 10) {
    return { valid: false, error: 'Client secret appears to be too short' };
  }

  return { valid: true };
}

/**
 * Validate SharePoint configuration
 */
export function validateSharePointConfig(config: SharePointConfig): { valid: boolean; error?: string } {
  const { siteUrl, defaultFolderPath } = config;

  if (!siteUrl) {
    return { valid: false, error: 'SharePoint site URL is required' };
  }

  // Validate SharePoint URL format
  const sharePointUrlRegex = /^https:\/\/[a-zA-Z0-9-]+\.sharepoint\.com\/sites\/[a-zA-Z0-9-]+$/;
  
  if (!sharePointUrlRegex.test(siteUrl)) {
    return { valid: false, error: 'Invalid SharePoint site URL format. Should be: https://company.sharepoint.com/sites/sitename' };
  }

  if (!defaultFolderPath) {
    return { valid: false, error: 'Default folder path is required' };
  }

  // Validate folder path format
  if (!defaultFolderPath.startsWith('/')) {
    return { valid: false, error: 'Folder path must start with /' };
  }

  return { valid: true };
}

/**
 * Generate Azure app registration instructions
 */
export function getAzureSetupInstructions(): string[] {
  return [
    '1. Go to the Azure Portal (portal.azure.com)',
    '2. Navigate to "Azure Active Directory" > "App registrations"',
    '3. Click "New registration" and create a new app',
    '4. Note the "Application (client) ID" and "Directory (tenant) ID"',
    '5. Go to "Certificates & secrets" and create a new client secret',
    '6. Go to "API permissions" and add the following Microsoft Graph permissions:',
    '   - Sites.ReadWrite.All (Application permission)',
    '   - Files.ReadWrite.All (Application permission)',
    '   - User.Read (Delegated permission)',
    '7. Click "Grant admin consent" for your organization',
    '8. Copy the credentials to the form above'
  ];
}

/**
 * Generate required Azure permissions list
 */
export function getRequiredAzurePermissions(): Array<{ name: string; type: string; description: string }> {
  return [
    {
      name: 'Sites.ReadWrite.All',
      type: 'Application',
      description: 'Read and write items and lists in all site collections'
    },
    {
      name: 'Files.ReadWrite.All',
      type: 'Application', 
      description: 'Read and write files in all site collections'
    },
    {
      name: 'User.Read',
      type: 'Delegated',
      description: 'Sign in and read user profile'
    }
  ];
}

/**
 * Mask sensitive credential values for display
 */
export function maskCredentials(credentials: AzureCredentials): AzureCredentials {
  return {
    ...credentials,
    clientSecret: credentials.clientSecret ? '***hidden***' : '',
  };
}

/**
 * Check if credentials are configured (not empty/default)
 */
export function areCredentialsConfigured(credentials: AzureCredentials): boolean {
  return !!(
    credentials.tenantId && 
    credentials.clientId && 
    credentials.clientSecret &&
    credentials.clientSecret !== '***hidden***' &&
    credentials.tenantId !== 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
  );
}

import { Organization, OrganizationMember, OrganizationSettings, UserPermissions } from '@/types/organization.types';

// Mock organization data
export const MOCK_ORGANIZATION: Organization = {
  id: 'org_1',
  name: 'TechCorp Solutions',
  domain: 'techcorp.com',
  logo: '/api/placeholder/100/100',
  plan: 'pro',
  maxUsers: 50,
  currentUsers: 12,
  
  azureCredentials: {
    tenantId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    clientId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    clientSecret: '***hidden***',
    scope: 'https://graph.microsoft.com/.default'
  },
  
  sharePointConfig: {
    siteUrl: 'https://techcorp.sharepoint.com/sites/documentcontrol',
    driveId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    defaultFolderPath: '/Documents/Projects'
  },
  
  isAzureIntegrationEnabled: true,
  
  createdAt: '2023-01-15T00:00:00Z',
  updatedAt: '2024-08-19T10:30:00Z',
  ownerId: 'user_1',
  adminIds: ['user_1', 'user_2']
};

// Mock organization members
export const MOCK_ORGANIZATION_MEMBERS: OrganizationMember[] = [
  {
    id: 'user_1',
    name: 'John Doe',
    email: 'john.doe@techcorp.com',
    role: 'owner',
    joinedAt: '2023-01-15T00:00:00Z',
    isActive: true,
    permissions: ['all']
  },
  {
    id: 'user_2',
    name: 'Jane Smith',
    email: 'jane.smith@techcorp.com',
    role: 'admin',
    joinedAt: '2023-02-01T00:00:00Z',
    isActive: true,
    permissions: ['manage_users', 'configure_integrations', 'view_settings']
  },
  {
    id: 'user_3',
    name: 'Mike Johnson',
    email: 'mike.johnson@techcorp.com',
    role: 'member',
    joinedAt: '2023-03-15T00:00:00Z',
    isActive: true,
    permissions: ['view_documents', 'upload_documents']
  }
];

// Mock organization settings
export const MOCK_ORGANIZATION_SETTINGS: OrganizationSettings = {
  general: {
    name: 'TechCorp Solutions',
    domain: 'techcorp.com',
    logo: '/api/placeholder/100/100'
  },
  azure: {
    tenantId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    clientId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    clientSecret: '***hidden***',
    sharePointSiteUrl: 'https://techcorp.sharepoint.com/sites/documentcontrol',
    defaultFolderPath: '/Documents/Projects'
  },
  security: {
    enforcePasswordPolicy: true,
    requireTwoFactor: false,
    sessionTimeout: 480, // 8 hours
    allowExternalSharing: false
  },
  integrations: {
    isAzureEnabled: true,
    isSharePointEnabled: true,
    lastSyncAt: '2024-08-19T09:00:00Z'
  }
};

// Current user permissions (based on role)
export const getCurrentUserPermissions = (userRole: 'owner' | 'admin' | 'member'): UserPermissions => {
  switch (userRole) {
    case 'owner':
      return {
        canEditOrganization: true,
        canManageMembers: true,
        canConfigureIntegrations: true,
        canViewSettings: true,
        canManageBilling: true
      };
    case 'admin':
      return {
        canEditOrganization: false,
        canManageMembers: true,
        canConfigureIntegrations: true,
        canViewSettings: true,
        canManageBilling: false
      };
    case 'member':
    default:
      return {
        canEditOrganization: false,
        canManageMembers: false,
        canConfigureIntegrations: false,
        canViewSettings: false,
        canManageBilling: false
      };
  }
};

// Mock current user role (in real app, this would come from authentication)
export const CURRENT_USER_ROLE: 'owner' | 'admin' | 'member' = 'owner'; // Change this to test different permissions

export const CURRENT_USER_PERMISSIONS = getCurrentUserPermissions(CURRENT_USER_ROLE);

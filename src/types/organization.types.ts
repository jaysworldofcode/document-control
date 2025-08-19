// Organization and Azure Integration Types

export interface AzureCredentials {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  scope?: string;
}

export interface SharePointConfig {
  siteUrl: string;
  driveId?: string;
  defaultFolderPath: string;
}

export interface Organization {
  id: string;
  name: string;
  domain: string;
  logo?: string;
  plan: 'free' | 'pro' | 'enterprise';
  maxUsers: number;
  currentUsers: number;
  
  // Azure/SharePoint Integration
  azureCredentials?: AzureCredentials;
  sharePointConfig?: SharePointConfig;
  isAzureIntegrationEnabled: boolean;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  adminIds: string[];
}

export interface OrganizationMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
  isActive: boolean;
  permissions: string[];
}

export interface OrganizationSettings {
  general: {
    name: string;
    domain: string;
    logo?: string;
  };
  azure: {
    tenantId: string;
    clientId: string;
    clientSecret: string;
    sharePointSiteUrl: string;
    defaultFolderPath: string;
  };
  security: {
    enforcePasswordPolicy: boolean;
    requireTwoFactor: boolean;
    sessionTimeout: number; // in minutes
    allowExternalSharing: boolean;
  };
  integrations: {
    isAzureEnabled: boolean;
    isSharePointEnabled: boolean;
    lastSyncAt?: string;
  };
}

// Form data types
export interface OrganizationFormData {
  name: string;
  domain: string;
  logo?: string;
}

export interface AzureFormData {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  sharePointSiteUrl: string;
  defaultFolderPath: string;
}

// API response types
export interface OrganizationResponse {
  organization: Organization;
  members: OrganizationMember[];
  settings: OrganizationSettings;
}

// Permission checking
export type UserRole = 'owner' | 'admin' | 'member';

export interface UserPermissions {
  canEditOrganization: boolean;
  canManageMembers: boolean;
  canConfigureIntegrations: boolean;
  canViewSettings: boolean;
  canManageBilling: boolean;
}

// Constants
export const AZURE_SCOPES = {
  SHAREPOINT: 'https://graph.microsoft.com/Sites.ReadWrite.All',
  FILES: 'https://graph.microsoft.com/Files.ReadWrite.All',
  DEFAULT: 'https://graph.microsoft.com/.default'
} as const;

export const ORGANIZATION_PLANS = {
  free: { name: 'Free', maxUsers: 5, features: ['Basic SharePoint', 'Document Management'] },
  pro: { name: 'Pro', maxUsers: 50, features: ['Advanced SharePoint', 'Custom Fields', 'Analytics'] },
  enterprise: { name: 'Enterprise', maxUsers: -1, features: ['All Features', 'SSO', 'API Access', 'Priority Support'] }
} as const;

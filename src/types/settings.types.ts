// Settings Types
export interface SystemSetting {
  id: string
  key: string
  value: any
  description?: string
  is_public: boolean
  created_at: string
  updated_at: string
}

export interface NotificationPreference {
  id: string
  user_id: string
  type: NotificationTypeConfig
  email_enabled: boolean
  push_enabled: boolean
  in_app_enabled: boolean
  frequency: NotificationFrequency
  created_at: string
  updated_at: string
}

export type NotificationTypeConfig = 
  | 'document_uploaded'
  | 'document_approved'
  | 'document_rejected'
  | 'document_commented'
  | 'document_shared'
  | 'project_invitation'
  | 'chat_message'
  | 'system_announcement'
  | 'reminder'

export type NotificationFrequency = 'immediate' | 'hourly' | 'daily' | 'weekly' | 'never'

export interface UserProfile {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  role: 'admin' | 'manager' | 'user'
  department?: string
  phone?: string
  created_at: string
  updated_at: string
}

export type NotificationSettings = {
  [K in NotificationTypeConfig]: {
    email_enabled: boolean
    push_enabled: boolean
    in_app_enabled: boolean
    frequency: NotificationFrequency
  }
}

export interface UserSettings {
  profile: UserProfile
  notifications: NotificationSettings
}

export interface OrganizationSettings {
  name: string
  domain: string
  logo?: string
  azure: {
    tenant_id?: string
    client_id?: string
    client_secret?: string
    sharepoint_site_url?: string
    default_folder_path?: string
  }
  integrations: {
    azure_enabled: boolean
    sharepoint_enabled: boolean
    last_sync_at?: string
  }
}

export interface SystemSettings {
  app_name: string
  app_version: string
  max_file_size_mb: number
  allowed_file_types: string[]
  session_timeout_hours: number
  email_notifications_enabled: boolean
  maintenance_mode: boolean
}

// Settings Form Types
export interface ProfileUpdateForm {
  full_name: string
  phone: string
  department: string
}

export interface PasswordChangeForm {
  current_password: string
  new_password: string
  confirm_password: string
}

export interface NotificationPreferenceForm {
  type: NotificationTypeConfig
  email_enabled: boolean
  push_enabled: boolean
  in_app_enabled: boolean
  frequency: NotificationFrequency
}

export interface OrganizationUpdateForm {
  name: string
  domain: string
  logo?: string
}

export interface AzureConfigForm {
  tenant_id: string
  client_id: string
  client_secret: string
  sharepoint_site_url: string
  default_folder_path: string
}

// API Response Types
export interface SettingsResponse<T = any> {
  data?: T
  error?: string
  message?: string
}

export interface NotificationPreferencesResponse {
  preferences: NotificationPreference[]
  total: number
}

export interface SystemSettingsResponse {
  settings: SystemSetting[]
  total: number
}

// Utility Types
export type SettingsKey = 
  | 'app_name'
  | 'app_version' 
  | 'max_file_size_mb'
  | 'allowed_file_types'
  | 'session_timeout_hours'
  | 'email_notifications_enabled'
  | 'maintenance_mode'
  | 'org_name'
  | 'org_domain'
  | 'org_logo'
  | 'azure_tenant_id'
  | 'azure_client_id'
  | 'azure_client_secret'
  | 'azure_sharepoint_url'
  | 'azure_default_folder'

export interface SettingsUpdatePayload {
  key: SettingsKey
  value: any
  description?: string
}

export interface BulkNotificationUpdate {
  user_id: string
  updates: Array<{
    type: NotificationTypeConfig
    email_enabled?: boolean
    push_enabled?: boolean
    in_app_enabled?: boolean
    frequency?: NotificationFrequency
  }>
}

// Constants
export const NOTIFICATION_TYPES: Record<NotificationTypeConfig, { label: string; description: string }> = {
  document_uploaded: {
    label: 'Document Uploaded',
    description: 'When new documents are uploaded to your projects'
  },
  document_approved: {
    label: 'Document Approved',
    description: 'When your documents are approved'
  },
  document_rejected: {
    label: 'Document Rejected',
    description: 'When your documents are rejected with feedback'
  },
  document_commented: {
    label: 'Document Comments',
    description: 'When someone comments on your documents'
  },
  document_shared: {
    label: 'Document Shared',
    description: 'When documents are shared with you'
  },
  project_invitation: {
    label: 'Project Invitations',
    description: 'When you are invited to join projects'
  },
  chat_message: {
    label: 'Chat Messages',
    description: 'When you receive project chat messages'
  },
  system_announcement: {
    label: 'System Announcements',
    description: 'Important system updates and announcements'
  },
  reminder: {
    label: 'Reminders',
    description: 'Document deadlines and other reminders'
  }
}

export const NOTIFICATION_FREQUENCIES: Record<NotificationFrequency, string> = {
  immediate: 'Immediately',
  hourly: 'Hourly digest',
  daily: 'Daily digest',
  weekly: 'Weekly digest',
  never: 'Never'
}

export const DEFAULT_SYSTEM_SETTINGS: Record<SettingsKey, any> = {
  app_name: 'Document Control System',
  app_version: '1.0.0',
  max_file_size_mb: 100,
  allowed_file_types: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'jpg', 'jpeg', 'png', 'gif'],
  session_timeout_hours: 24,
  email_notifications_enabled: true,
  maintenance_mode: false,
  org_name: '',
  org_domain: '',
  org_logo: '',
  azure_tenant_id: '',
  azure_client_id: '',
  azure_client_secret: '',
  azure_sharepoint_url: '',
  azure_default_folder: '/Documents'
}

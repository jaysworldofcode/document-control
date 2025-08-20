import { createClient } from './supabase'
import { Database } from './supabase'

type SystemSetting = Database['public']['Tables']['system_settings']['Row']
type NotificationPreference = Database['public']['Tables']['notification_preferences']['Row']
type NotificationPreferenceInsert = Database['public']['Tables']['notification_preferences']['Insert']
type NotificationPreferenceUpdate = Database['public']['Tables']['notification_preferences']['Update']

const supabase = createClient()

// System Settings Functions
export async function getSystemSettings(keysFilter?: string[]) {
  let query = supabase
    .from('system_settings')
    .select('*')

  if (keysFilter && keysFilter.length > 0) {
    query = query.in('key', keysFilter)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching system settings:', error)
    throw error
  }

  return data || []
}

export async function getSystemSetting(key: string): Promise<SystemSetting | null> {
  const { data, error } = await supabase
    .from('system_settings')
    .select('*')
    .eq('key', key)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null
    }
    console.error('Error fetching system setting:', error)
    throw error
  }

  return data
}

export async function updateSystemSetting(key: string, value: any, description?: string) {
  const { data, error } = await supabase
    .from('system_settings')
    .upsert({
      key,
      value,
      description,
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) {
    console.error('Error updating system setting:', error)
    throw error
  }

  return data
}

export async function deleteSystemSetting(key: string) {
  const { error } = await supabase
    .from('system_settings')
    .delete()
    .eq('key', key)

  if (error) {
    console.error('Error deleting system setting:', error)
    throw error
  }

  return true
}

// Notification Preferences Functions
export async function getUserNotificationPreferences(userId: string) {
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)

  if (error) {
    console.error('Error fetching notification preferences:', error)
    throw error
  }

  return data || []
}

export async function getNotificationPreference(userId: string, type: string): Promise<NotificationPreference | null> {
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .eq('type', type)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null
    }
    console.error('Error fetching notification preference:', error)
    throw error
  }

  return data
}

export async function updateNotificationPreference(
  userId: string, 
  type: string, 
  preferences: Partial<NotificationPreferenceUpdate>
) {
  const { data, error } = await supabase
    .from('notification_preferences')
    .upsert({
      user_id: userId,
      type,
      ...preferences,
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) {
    console.error('Error updating notification preference:', error)
    throw error
  }

  return data
}

export async function createDefaultNotificationPreferences(userId: string) {
  const defaultTypes = [
    'document_uploaded',
    'document_approved', 
    'document_rejected',
    'document_commented',
    'document_shared',
    'project_invitation',
    'chat_message',
    'system_announcement',
    'reminder'
  ]

  const preferences: NotificationPreferenceInsert[] = defaultTypes.map(type => ({
    user_id: userId,
    type,
    email_enabled: true,
    push_enabled: true,
    in_app_enabled: true,
    frequency: 'immediate' as const
  }))

  const { data, error } = await supabase
    .from('notification_preferences')
    .upsert(preferences, { 
      onConflict: 'user_id,type',
      ignoreDuplicates: true 
    })
    .select()

  if (error) {
    console.error('Error creating default notification preferences:', error)
    throw error
  }

  return data
}

export async function bulkUpdateNotificationPreferences(
  userId: string,
  updates: Array<{
    type: string
    email_enabled?: boolean
    push_enabled?: boolean
    in_app_enabled?: boolean
    frequency?: 'immediate' | 'hourly' | 'daily' | 'weekly' | 'never'
  }>
) {
  const updatePromises = updates.map(update => 
    updateNotificationPreference(userId, update.type, update)
  )

  try {
    const results = await Promise.all(updatePromises)
    return results
  } catch (error) {
    console.error('Error bulk updating notification preferences:', error)
    throw error
  }
}

// User Profile Settings Functions
export async function updateUserProfile(userId: string, updates: {
  full_name?: string
  phone?: string
  department?: string
  avatar_url?: string
}) {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error updating user profile:', error)
    throw error
  }

  return data
}

export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching user profile:', error)
    throw error
  }

  return data
}

// Password Change Function (this would typically be handled by Supabase Auth)
export async function changePassword(newPassword: string) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword
  })

  if (error) {
    console.error('Error changing password:', error)
    throw error
  }

  return data
}

// Organization Settings Functions (if needed)
export async function getOrganizationSettings() {
  // This could be implemented to fetch organization-specific settings
  // from a separate table or from system_settings with org-specific keys
  const orgKeys = [
    'org_name',
    'org_domain', 
    'org_logo',
    'azure_tenant_id',
    'azure_client_id',
    'azure_client_secret',
    'azure_sharepoint_url',
    'azure_default_folder'
  ]

  return getSystemSettings(orgKeys)
}

export async function updateOrganizationSetting(key: string, value: any) {
  return updateSystemSetting(`org_${key}`, value)
}

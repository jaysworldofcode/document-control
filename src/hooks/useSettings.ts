import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import {
  getUserProfile,
  updateUserProfile,
  getUserNotificationPreferences,
  updateNotificationPreference,
  bulkUpdateNotificationPreferences,
  createDefaultNotificationPreferences,
  getSystemSettings,
  updateSystemSetting,
  changePassword
} from '@/lib/settings'
import {
  UserProfile,
  NotificationPreference,
  SystemSetting,
  ProfileUpdateForm,
  NotificationPreferenceForm,
  NotificationTypeConfig,
  NotificationFrequency,
  NOTIFICATION_TYPES
} from '@/types/settings.types'

export function useUserSettings() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreference[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  // Get current user
  useEffect(() => {
    const supabase = createClient()
    
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Load user profile and notification preferences
  const loadUserSettings = useCallback(async () => {
    if (!user?.id) return

    try {
      setIsLoading(true)
      setError(null)

      const [profileData, preferencesData] = await Promise.all([
        getUserProfile(user.id),
        getUserNotificationPreferences(user.id)
      ])

      setProfile(profileData)
      
      // If no preferences exist, create defaults
      if (preferencesData.length === 0) {
        const defaultPrefs = await createDefaultNotificationPreferences(user.id)
        setNotificationPreferences(defaultPrefs || [])
      } else {
        setNotificationPreferences(preferencesData)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings')
      console.error('Error loading user settings:', err)
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  // Update user profile
  const updateProfile = useCallback(async (updates: Partial<ProfileUpdateForm>) => {
    if (!user?.id) throw new Error('User not authenticated')

    try {
      setIsUpdating(true)
      setError(null)

      const updatedProfile = await updateUserProfile(user.id, updates)
      setProfile(updatedProfile)
      
      return { success: true, data: updatedProfile }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to update profile'
      setError(error)
      return { success: false, error }
    } finally {
      setIsUpdating(false)
    }
  }, [user?.id])

  // Update single notification preference
  const updateNotificationSetting = useCallback(async (
    type: NotificationTypeConfig,
    settings: {
      email_enabled?: boolean
      push_enabled?: boolean
      in_app_enabled?: boolean
      frequency?: NotificationFrequency
    }
  ) => {
    if (!user?.id) throw new Error('User not authenticated')

    try {
      setIsUpdating(true)
      setError(null)

      const updatedPreference = await updateNotificationPreference(user.id, type, settings)
      
      setNotificationPreferences(prev => 
        prev.map(pref => 
          pref.type === type ? { ...pref, ...updatedPreference } : pref
        )
      )

      return { success: true, data: updatedPreference }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to update notification setting'
      setError(error)
      return { success: false, error }
    } finally {
      setIsUpdating(false)
    }
  }, [user?.id])

  // Bulk update notification preferences
  const updateAllNotificationSettings = useCallback(async (
    updates: Array<{
      type: NotificationTypeConfig
      email_enabled?: boolean
      push_enabled?: boolean
      in_app_enabled?: boolean
      frequency?: NotificationFrequency
    }>
  ) => {
    if (!user?.id) throw new Error('User not authenticated')

    try {
      setIsUpdating(true)
      setError(null)

      const updatedPreferences = await bulkUpdateNotificationPreferences(user.id, updates)
      
      // Update local state
      setNotificationPreferences(prev => {
        const newPrefs = [...prev]
        updatedPreferences.forEach(updated => {
          const index = newPrefs.findIndex(pref => pref.type === updated.type)
          if (index >= 0) {
            newPrefs[index] = updated
          }
        })
        return newPrefs
      })

      return { success: true, data: updatedPreferences }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to update notification settings'
      setError(error)
      return { success: false, error }
    } finally {
      setIsUpdating(false)
    }
  }, [user?.id])

  // Change password
  const updatePassword = useCallback(async (newPassword: string) => {
    try {
      setIsUpdating(true)
      setError(null)

      const result = await changePassword(newPassword)
      return { success: true, data: result }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to change password'
      setError(error)
      return { success: false, error }
    } finally {
      setIsUpdating(false)
    }
  }, [])

  // Get notification preference by type
  const getNotificationPreference = useCallback((type: NotificationTypeConfig) => {
    return notificationPreferences.find(pref => pref.type === type)
  }, [notificationPreferences])

  // Check if all notifications are enabled/disabled
  const getAllNotificationsEnabled = useCallback(() => {
    if (notificationPreferences.length === 0) return false
    return notificationPreferences.every(pref => 
      pref.email_enabled || pref.push_enabled || pref.in_app_enabled
    )
  }, [notificationPreferences])

  // Toggle all notifications
  const toggleAllNotifications = useCallback(async (enabled: boolean) => {
    const updates = Object.keys(NOTIFICATION_TYPES).map(type => ({
      type: type as NotificationTypeConfig,
      email_enabled: enabled,
      push_enabled: enabled,
      in_app_enabled: enabled
    }))

    return updateAllNotificationSettings(updates)
  }, [updateAllNotificationSettings])

  // Load settings on mount and when user changes
  useEffect(() => {
    loadUserSettings()
  }, [loadUserSettings])

  return {
    // State
    profile,
    notificationPreferences,
    isLoading,
    isUpdating,
    error,

    // Actions
    updateProfile,
    updateNotificationSetting,
    updateAllNotificationSettings,
    updatePassword,
    refreshSettings: loadUserSettings,

    // Helpers
    getNotificationPreference,
    getAllNotificationsEnabled,
    toggleAllNotifications
  }
}

export function useSystemSettings() {
  const [settings, setSettings] = useState<SystemSetting[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  // Load system settings
  const loadSystemSettings = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const data = await getSystemSettings()
      setSettings(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load system settings')
      console.error('Error loading system settings:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Update system setting
  const updateSetting = useCallback(async (key: string, value: any, description?: string) => {
    try {
      setIsUpdating(true)
      setError(null)

      const updatedSetting = await updateSystemSetting(key, value, description)
      
      setSettings(prev => {
        const index = prev.findIndex(setting => setting.key === key)
        if (index >= 0) {
          const newSettings = [...prev]
          newSettings[index] = updatedSetting
          return newSettings
        } else {
          return [...prev, updatedSetting]
        }
      })

      return { success: true, data: updatedSetting }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to update setting'
      setError(error)
      return { success: false, error }
    } finally {
      setIsUpdating(false)
    }
  }, [])

  // Get setting by key
  const getSetting = useCallback((key: string) => {
    return settings.find(setting => setting.key === key)
  }, [settings])

  // Get setting value by key
  const getSettingValue = useCallback((key: string, defaultValue?: any) => {
    const setting = getSetting(key)
    return setting ? setting.value : defaultValue
  }, [getSetting])

  // Load settings on mount
  useEffect(() => {
    loadSystemSettings()
  }, [loadSystemSettings])

  return {
    // State
    settings,
    isLoading,
    isUpdating,
    error,

    // Actions
    updateSetting,
    refreshSettings: loadSystemSettings,

    // Helpers
    getSetting,
    getSettingValue
  }
}

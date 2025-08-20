import { createBrowserClient, createServerClient } from '@supabase/ssr'

// Database types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: 'admin' | 'manager' | 'user'
          department: string | null
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'admin' | 'manager' | 'user'
          department?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'admin' | 'manager' | 'user'
          department?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          name: string
          description: string | null
          status: 'active' | 'archived' | 'completed'
          priority: 'low' | 'medium' | 'high' | 'critical'
          client: string | null
          start_date: string | null
          end_date: string | null
          progress: number
          sharepoint_config: any
          custom_fields: any
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          status?: 'active' | 'archived' | 'completed'
          priority?: 'low' | 'medium' | 'high' | 'critical'
          client?: string | null
          start_date?: string | null
          end_date?: string | null
          progress?: number
          sharepoint_config?: any
          custom_fields?: any
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          status?: 'active' | 'archived' | 'completed'
          priority?: 'low' | 'medium' | 'high' | 'critical'
          client?: string | null
          start_date?: string | null
          end_date?: string | null
          progress?: number
          sharepoint_config?: any
          custom_fields?: any
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      project_members: {
        Row: {
          id: string
          project_id: string
          user_id: string
          role: 'manager' | 'member' | 'viewer'
          can_approve_documents: boolean
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          role?: 'manager' | 'member' | 'viewer'
          can_approve_documents?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          role?: 'manager' | 'member' | 'viewer'
          can_approve_documents?: boolean
          created_at?: string
        }
      }
      documents: {
        Row: {
          id: string
          project_id: string
          name: string
          file_name: string
          file_type: string
          file_size: number
          file_path: string
          version: string
          status: 'draft' | 'pending_review' | 'under_review' | 'approved' | 'rejected' | 'archived' | 'checked_out' | 'final'
          description: string | null
          tags: string[]
          custom_field_values: any
          sharepoint_path: string | null
          uploaded_by: string
          uploaded_at: string
          last_modified: string
          last_modified_by: string
          checkout_info: any | null
          approval_workflow: any | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          name: string
          file_name: string
          file_type: string
          file_size: number
          file_path: string
          version?: string
          status?: 'draft' | 'pending_review' | 'under_review' | 'approved' | 'rejected' | 'archived' | 'checked_out' | 'final'
          description?: string | null
          tags?: string[]
          custom_field_values?: any
          sharepoint_path?: string | null
          uploaded_by: string
          uploaded_at?: string
          last_modified?: string
          last_modified_by: string
          checkout_info?: any | null
          approval_workflow?: any | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          name?: string
          file_name?: string
          file_type?: string
          file_size?: number
          file_path?: string
          version?: string
          status?: 'draft' | 'pending_review' | 'under_review' | 'approved' | 'rejected' | 'archived' | 'checked_out' | 'final'
          description?: string | null
          tags?: string[]
          custom_field_values?: any
          sharepoint_path?: string | null
          uploaded_by?: string
          uploaded_at?: string
          last_modified?: string
          last_modified_by?: string
          checkout_info?: any | null
          approval_workflow?: any | null
          created_at?: string
          updated_at?: string
        }
      }
      chat_messages: {
        Row: {
          id: string
          project_id: string
          user_id: string
          content: string
          message_type: 'text' | 'file' | 'system'
          reply_to: string | null
          attachments: any[]
          reactions: any[]
          is_edited: boolean
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          content: string
          message_type?: 'text' | 'file' | 'system'
          reply_to?: string | null
          attachments?: any[]
          reactions?: any[]
          is_edited?: boolean
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          content?: string
          message_type?: 'text' | 'file' | 'system'
          reply_to?: string | null
          attachments?: any[]
          reactions?: any[]
          is_edited?: boolean
          created_at?: string
          updated_at?: string | null
        }
      }
      document_comments: {
        Row: {
          id: string
          document_id: string
          user_id: string
          content: string
          reply_to: string | null
          attachments: any[]
          reactions: any[]
          is_edited: boolean
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          document_id: string
          user_id: string
          content: string
          reply_to?: string | null
          attachments?: any[]
          reactions?: any[]
          is_edited?: boolean
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          document_id?: string
          user_id?: string
          content?: string
          reply_to?: string | null
          attachments?: any[]
          reactions?: any[]
          is_edited?: boolean
          created_at?: string
          updated_at?: string | null
        }
      }
      system_settings: {
        Row: {
          id: string
          key: string
          value: any
          description: string | null
          is_public: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          value: any
          description?: string | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          key?: string
          value?: any
          description?: string | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      notification_preferences: {
        Row: {
          id: string
          user_id: string
          type: string
          email_enabled: boolean
          push_enabled: boolean
          in_app_enabled: boolean
          frequency: 'immediate' | 'hourly' | 'daily' | 'weekly' | 'never'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          email_enabled?: boolean
          push_enabled?: boolean
          in_app_enabled?: boolean
          frequency?: 'immediate' | 'hourly' | 'daily' | 'weekly' | 'never'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          email_enabled?: boolean
          push_enabled?: boolean
          in_app_enabled?: boolean
          frequency?: 'immediate' | 'hourly' | 'daily' | 'weekly' | 'never'
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string
          data: any
          related_document_id: string | null
          related_project_id: string | null
          related_user_id: string | null
          is_read: boolean
          is_email_sent: boolean
          priority: 'low' | 'normal' | 'high' | 'urgent'
          expires_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          message: string
          data?: any
          related_document_id?: string | null
          related_project_id?: string | null
          related_user_id?: string | null
          is_read?: boolean
          is_email_sent?: boolean
          priority?: 'low' | 'normal' | 'high' | 'urgent'
          expires_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          message?: string
          data?: any
          related_document_id?: string | null
          related_project_id?: string | null
          related_user_id?: string | null
          is_read?: boolean
          is_email_sent?: boolean
          priority?: 'low' | 'normal' | 'high' | 'urgent'
          expires_at?: string | null
          created_at?: string
        }
      }
      permissions: {
        Row: {
          id: string
          name: string
          description: string | null
          resource: string
          action: 'create' | 'read' | 'update' | 'delete' | 'manage'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          resource: string
          action: 'create' | 'read' | 'update' | 'delete' | 'manage'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          resource?: string
          action?: 'create' | 'read' | 'update' | 'delete' | 'manage'
          created_at?: string
          updated_at?: string
        }
      }
      departments: {
        Row: {
          id: string
          name: string
          description: string | null
          head_of_department: string | null
          parent_department_id: string | null
          location: string | null
          budget: number | null
          is_active: boolean
          created_at: string
          updated_at: string
          created_by: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          head_of_department?: string | null
          parent_department_id?: string | null
          location?: string | null
          budget?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
          created_by: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          head_of_department?: string | null
          parent_department_id?: string | null
          location?: string | null
          budget?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string
        }
      }
      roles: {
        Row: {
          id: string
          name: string
          description: string | null
          level: 'admin' | 'manager' | 'user'
          department_id: string | null
          is_active: boolean
          created_at: string
          updated_at: string
          created_by: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          level: 'admin' | 'manager' | 'user'
          department_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
          created_by: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          level?: 'admin' | 'manager' | 'user'
          department_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string
        }
      }
      role_permissions: {
        Row: {
          id: string
          role_id: string
          permission_id: string
          created_at: string
        }
        Insert: {
          id?: string
          role_id: string
          permission_id: string
          created_at?: string
        }
        Update: {
          id?: string
          role_id?: string
          permission_id?: string
          created_at?: string
        }
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          role_id: string
          assigned_by: string
          assigned_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role_id: string
          assigned_by: string
          assigned_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role_id?: string
          assigned_by?: string
          assigned_at?: string
        }
      }
      user_departments: {
        Row: {
          id: string
          user_id: string
          department_id: string
          is_primary: boolean
          assigned_by: string
          assigned_at: string
        }
        Insert: {
          id?: string
          user_id: string
          department_id: string
          is_primary?: boolean
          assigned_by: string
          assigned_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          department_id?: string
          is_primary?: boolean
          assigned_by?: string
          assigned_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Browser client for client-side operations
export const createClient = () => {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Server client for server-side operations
export const createServerSupabaseClient = async () => {
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()
  
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

// Legacy export for compatibility
export const supabase = createClient()

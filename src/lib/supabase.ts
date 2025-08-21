import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Client for browser usage (with anon key)
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey)

// Server client with service role key for admin operations
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export const supabaseAdmin: SupabaseClient | null = supabaseServiceRoleKey 
  ? createClient(supabaseUrl, supabaseServiceRoleKey)
  : null

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          password_hash: string
          first_name: string
          last_name: string
          organization_id: string | null
          role: 'owner' | 'admin' | 'member'
          email_verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          password_hash: string
          first_name: string
          last_name: string
          organization_id?: string | null
          role?: 'owner' | 'admin' | 'member'
          email_verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          password_hash?: string
          first_name?: string
          last_name?: string
          organization_id?: string | null
          role?: 'owner' | 'admin' | 'member'
          email_verified?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      organizations: {
        Row: {
          id: string
          name: string
          industry: string | null
          size: 'startup' | 'small' | 'medium' | 'large' | 'enterprise' | null
          owner_id: string | null
          settings: Record<string, any>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          industry?: string | null
          size?: 'startup' | 'small' | 'medium' | 'large' | 'enterprise' | null
          owner_id?: string | null
          settings?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          industry?: string | null
          size?: 'startup' | 'small' | 'medium' | 'large' | 'enterprise' | null
          owner_id?: string | null
          settings?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

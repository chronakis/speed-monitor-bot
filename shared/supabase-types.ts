// Auto-generated Supabase database types
// This file should be regenerated when database schema changes

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      user_config: {
        Row: {
          id: string
          user_id: string
          use_own_api_key: boolean
          default_units: 'metric' | 'imperial'
          default_map_location: string
          data_retention_days: number
          email_notifications: boolean
          here_api_key_encrypted: string | null
          api_key_status: 'none' | 'pending' | 'valid' | 'invalid' | 'expired'
          last_validated_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          use_own_api_key?: boolean
          default_units?: 'metric' | 'imperial'
          default_map_location?: string
          data_retention_days?: number
          email_notifications?: boolean
          here_api_key_encrypted?: string | null
          api_key_status?: 'none' | 'pending' | 'valid' | 'invalid' | 'expired'
          last_validated_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          use_own_api_key?: boolean
          default_units?: 'metric' | 'imperial'
          default_map_location?: string
          data_retention_days?: number
          email_notifications?: boolean
          here_api_key_encrypted?: string | null
          api_key_status?: 'none' | 'pending' | 'valid' | 'invalid' | 'expired'
          last_validated_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      api_usage: {
        Row: {
          id: string
          user_id: string
          api_endpoint: string
          here_endpoint: string
          key_type: 'builtin' | 'user'
          request_size_bytes: number
          response_size_bytes: number
          response_time_ms: number | null
          status_code: number | null
          called_at: string
          date_key: string
          error_message: string | null
        }
        Insert: {
          id?: string
          user_id: string
          api_endpoint: string
          here_endpoint: string
          key_type: 'builtin' | 'user'
          request_size_bytes?: number
          response_size_bytes?: number
          response_time_ms?: number | null
          status_code?: number | null
          called_at?: string
          date_key?: string
          error_message?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          api_endpoint?: string
          here_endpoint?: string
          key_type?: 'builtin' | 'user'
          request_size_bytes?: number
          response_size_bytes?: number
          response_time_ms?: number | null
          status_code?: number | null
          called_at?: string
          date_key?: string
          error_message?: string | null
        }
      }
      daily_usage_summary: {
        Row: {
          id: string
          user_id: string | null
          date_key: string
          key_type: 'builtin' | 'user'
          total_calls: number
          successful_calls: number
          failed_calls: number
          total_request_bytes: number
          total_response_bytes: number
          avg_response_time_ms: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          date_key: string
          key_type: 'builtin' | 'user'
          total_calls?: number
          successful_calls?: number
          failed_calls?: number
          total_request_bytes?: number
          total_response_bytes?: number
          avg_response_time_ms?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          date_key?: string
          key_type?: 'builtin' | 'user'
          total_calls?: number
          successful_calls?: number
          failed_calls?: number
          total_request_bytes?: number
          total_response_bytes?: number
          avg_response_time_ms?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      system_config: {
        Row: {
          id: string
          config_key: string
          config_value: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          config_key: string
          config_value: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          config_key?: string
          config_value?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      user_dashboard_stats: {
        Row: {
          user_id: string | null
          email: string | null
          use_own_api_key: boolean | null
          default_units: 'metric' | 'imperial' | null
          api_key_status: 'none' | 'pending' | 'valid' | 'invalid' | 'expired' | null
          total_api_calls: number | null
          calls_last_30_days: number | null
          calls_today: number | null
          last_api_call_date: string | null
        }
      }
      system_usage_stats: {
        Row: {
          date_key: string | null
          key_type: 'builtin' | 'user' | null
          total_calls: number | null
          successful_calls: number | null
          failed_calls: number | null
          active_users: number | null
          avg_response_time_ms: number | null
        }
      }
    }
    Functions: {
      aggregate_daily_usage: {
        Args: {
          target_date?: string
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for common operations
export type UserConfig = Database['public']['Tables']['user_config']['Row']
export type UserConfigInsert = Database['public']['Tables']['user_config']['Insert']
export type UserConfigUpdate = Database['public']['Tables']['user_config']['Update']

export type ApiUsage = Database['public']['Tables']['api_usage']['Row']
export type ApiUsageInsert = Database['public']['Tables']['api_usage']['Insert']

export type DailyUsageSummary = Database['public']['Tables']['daily_usage_summary']['Row']
export type SystemConfig = Database['public']['Tables']['system_config']['Row']

export type UserDashboardStats = Database['public']['Views']['user_dashboard_stats']['Row']
export type SystemUsageStats = Database['public']['Views']['system_usage_stats']['Row']

// Authentication types
export interface AuthUser {
  id: string
  email: string
  created_at: string
  email_confirmed_at?: string
  last_sign_in_at?: string
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

// HERE API related types
export interface HereFlowRequest {
  bbox: [number, number, number, number] // [west, south, east, north]
  units?: 'metric' | 'imperial'
  direction?: 'all' | 'inbound' | 'outbound'
}

export interface HereFlowResponse {
  flows: Array<{
    id: string
    speed: number
    confidence: number
    coordinates: [number, number][]
    // ... other HERE API fields
  }>
  request_id?: string
  usage?: {
    calls_remaining: number
    reset_time: string
  }
}

// Usage tracking types
export interface UsageStats {
  today: number
  yesterday: number
  this_month: number
  last_month: number
  total: number
}

export interface UserUsageInfo {
  key_type: 'builtin' | 'user'
  limits: {
    daily: number
    hourly: number
    remaining_today: number
    remaining_hour: number
  }
  usage: UsageStats
  last_call?: string
} 
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
      users: {
        Row: {
          id: string
          display_name: string | null
          email: string
          subscription_tier: 'free' | 'elite'
          is_admin: boolean
          created_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          email: string
          subscription_tier?: 'free' | 'elite'
          is_admin?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          display_name?: string | null
          email?: string
          subscription_tier?: 'free' | 'elite'
          is_admin?: boolean
          created_at?: string
        }
      }
      parses: {
        Row: {
          id: string
          user_id: string
          title: string | null
          raw_text: string | null
          contacts: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title?: string | null
          raw_text?: string | null
          contacts?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string | null
          raw_text?: string | null
          contacts?: Json | null
          created_at?: string
        }
      }
      templates: {
        Row: {
          id: string
          user_id: string
          name: string | null
          content: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name?: string | null
          content?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string | null
          content?: string | null
          created_at?: string
        }
      }
      contacts: {
        Row: {
          id: string
          user_id: string
          first_name: string | null
          last_name: string | null
          email: string
          company: string | null
          position: string | null
          is_valid: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          first_name?: string | null
          last_name?: string | null
          email: string
          company?: string | null
          position?: string | null
          is_valid?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          first_name?: string | null
          last_name?: string | null
          email?: string
          company?: string | null
          position?: string | null
          is_valid?: boolean | null
          created_at?: string
        }
      }
      contact_lists: {
        Row: {
          id: string
          user_id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          created_at?: string
        }
      }
      contact_list_items: {
        Row: {
          id: string
          contact_list_id: string
          contact_id: string
        }
        Insert: {
          id?: string
          contact_list_id: string
          contact_id: string
        }
        Update: {
          id?: string
          contact_list_id?: string
          contact_id?: string
        }
      }
      campaigns: {
        Row: {
          id: string
          user_id: string
          name: string
          subject: string | null
          body: string | null
          status: 'draft' | 'scheduled' | 'sending' | 'paused' | 'completed' | 'failed'
          sent_count: number
          failed_count: number
          contact_list_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          subject?: string | null
          body?: string | null
          status?: 'draft' | 'scheduled' | 'sending' | 'paused' | 'completed' | 'failed'
          sent_count?: number
          failed_count?: number
          contact_list_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          subject?: string | null
          body?: string | null
          status?: 'draft' | 'scheduled' | 'sending' | 'paused' | 'completed' | 'failed'
          sent_count?: number
          failed_count?: number
          contact_list_id?: string | null
          created_at?: string
        }
      }
      campaign_logs: {
        Row: {
          id: string
          campaign_id: string
          status: string | null
          message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          campaign_id: string
          status?: string | null
          message?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          campaign_id?: string
          status?: string | null
          message?: string | null
          created_at?: string
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

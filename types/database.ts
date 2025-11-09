/**
 * Database type definitions for Supabase
 * 
 * Generate these types automatically using:
 * supabase gen types typescript --local > types/database.ts
 * 
 * Or from remote project:
 * supabase gen types typescript --project-id <project-ref> > types/database.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          phone: string | null;
          full_name: string;
          avatar_url: string | null;
          timezone: string;
          notification_preferences: Json;
          role: 'admin' | 'manager' | 'cleaner' | 'guest';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          phone?: string | null;
          full_name: string;
          avatar_url?: string | null;
          timezone?: string;
          notification_preferences?: Json;
          role?: 'admin' | 'manager' | 'cleaner' | 'guest';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          phone?: string | null;
          full_name?: string;
          avatar_url?: string | null;
          timezone?: string;
          notification_preferences?: Json;
          role?: 'admin' | 'manager' | 'cleaner' | 'guest';
          created_at?: string;
          updated_at?: string;
        };
      };
      properties: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          address: string;
          city: string | null;
          state: string | null;
          zip_code: string | null;
          country: string;
          property_type: 'apartment' | 'house' | 'condo' | 'villa' | 'studio';
          bedrooms: number;
          bathrooms: number;
          square_feet: number | null;
          amenities: Json;
          cleaning_instructions: string | null;
          access_instructions: string | null;
          photo_urls: string[] | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          address: string;
          city?: string | null;
          state?: string | null;
          zip_code?: string | null;
          country?: string;
          property_type?: 'apartment' | 'house' | 'condo' | 'villa' | 'studio';
          bedrooms?: number;
          bathrooms?: number;
          square_feet?: number | null;
          amenities?: Json;
          cleaning_instructions?: string | null;
          access_instructions?: string | null;
          photo_urls?: string[] | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          address?: string;
          city?: string | null;
          state?: string | null;
          zip_code?: string | null;
          country?: string;
          property_type?: 'apartment' | 'house' | 'condo' | 'villa' | 'studio';
          bedrooms?: number;
          bathrooms?: number;
          square_feet?: number | null;
          amenities?: Json;
          cleaning_instructions?: string | null;
          access_instructions?: string | null;
          photo_urls?: string[] | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };
      // Additional tables will be added as they are implemented
      // bookings, tasks, task_templates, task_checklist_items, notifications, team_members, ical_feeds
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

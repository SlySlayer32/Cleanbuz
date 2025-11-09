/**
 * Supabase utility functions
 * Helper functions for common Supabase operations
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

/**
 * Get the current authenticated user
 */
export async function getCurrentUser(supabase: SupabaseClient<Database>) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error('Error getting user:', error);
    return null;
  }

  return user;
}

/**
 * Get user profile from profiles table
 */
export async function getUserProfile(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<Database['public']['Tables']['profiles']['Row'] | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  return data;
}

/**
 * Check if user has a specific role
 */
export async function hasRole(
  supabase: SupabaseClient<Database>,
  userId: string,
  role: 'admin' | 'manager' | 'cleaner' | 'guest'
): Promise<boolean> {
  const profile = await getUserProfile(supabase, userId);
  if (!profile) return false;
  return profile.role === role;
}

/**
 * Check if user is admin
 */
export async function isAdmin(
  supabase: SupabaseClient<Database>,
  userId: string
) {
  return hasRole(supabase, userId, 'admin');
}

/**
 * Handle Supabase errors and format them for display
 */
export function formatSupabaseError(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return (error as { message: string }).message;
  }
  return 'An unexpected error occurred';
}

/**
 * Check if environment variables are properly configured
 */
export function checkSupabaseConfig(): {
  isConfigured: boolean;
  missingVars: string[];
} {
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ];

  const missingVars = requiredVars.filter(
    (varName) => !process.env[varName] || process.env[varName] === 'your-project-ref.supabase.co' || process.env[varName]?.includes('your-')
  );

  return {
    isConfigured: missingVars.length === 0,
    missingVars,
  };
}

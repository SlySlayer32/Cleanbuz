/**
 * Supabase module exports
 * Central export point for all Supabase utilities
 */

export { createClient as createBrowserClient } from './client';
export { createClient as createServerClient } from './server';
export { updateSession } from './middleware';
export {
  getCurrentUser,
  getUserProfile,
  hasRole,
  isAdmin,
  formatSupabaseError,
  checkSupabaseConfig,
} from './utils';

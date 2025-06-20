import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables first
dotenv.config();

// TODO: Fix import path when types are properly set up
// import type { Database } from '../../../shared/supabase-types';
type Database = any; // Temporary type

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables. Please check SUPABASE_URL and SUPABASE_SERVICE_KEY');
}

// Service client with full admin access (for backend operations)
export const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Admin client for user management operations
export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Public client (for frontend-like operations with user context)
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
if (!supabaseAnonKey) {
  throw new Error('Missing SUPABASE_ANON_KEY environment variable');
}

export const supabasePublic = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Helper function to get user client with specific JWT
export const getUserClient = (jwt: string) => {
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    },
  });
}; 
import { createClient } from '@supabase/supabase-js';

// Get from Vite env vars at build time
const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const dummyUrl = 'https://unconfigured-placeholder.supabase.co';
const dummyKey = 'unconfigured-placeholder-anon-key';

let supabaseUrl = envUrl || dummyUrl;
let supabaseAnonKey = envKey || dummyKey;

// Check if valid URL (no fallbacks or placeholders)
export const isSupabaseConfigured = Boolean(
  envUrl && 
  envUrl.trim() !== '' &&
  envUrl !== dummyUrl && 
  !envUrl.includes('your_') && 
  !envUrl.includes('qs5r4evrhseujp5dxofq.supabase.co') &&
  envKey && 
  envKey.trim() !== '' &&
  envKey !== dummyKey && 
  !envKey.includes('your_')
);

console.log("=== SUPABASE INIT AUDIT ===");
console.log("VITE_SUPABASE_URL present:", Boolean(envUrl && envUrl.trim() !== ''));
console.log("URL:", isSupabaseConfigured ? supabaseUrl : 'INVALID/MISSING');
console.log("Is Configured:", isSupabaseConfigured);
console.log("===========================");

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: 'nexus-auth-token',
    },
    global: {
      headers: {
        'x-client-info': 'nexus-hub-audit'
      }
    }
  }
);


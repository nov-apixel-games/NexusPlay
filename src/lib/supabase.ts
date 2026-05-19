import { createClient } from '@supabase/supabase-js';

// Usar exclusivamente configuración VERCEL/NEXT o equivalentes mapeados
const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const fallbackUrl = 'https://qs5r4evrhseujp5dxofq.supabase.co';
const fallbackKey = 'sb_publishable_hiLuwfxZawX0zhzWwutviw_RXecYoNL';

const supabaseUrl = envUrl || fallbackUrl;
const supabaseAnonKey = envKey || fallbackKey;

// Logs para auditoría (temporal)
console.log("=== SUPABASE AUDIT LOG ===");
console.log("VITE_SUPABASE_URL from env:", envUrl ? "PRESENT (Starts with " + envUrl.slice(0, 15) + "...)" : "MISSING (Using fallback)");
console.log("VITE_SUPABASE_ANON_KEY from env:", envKey ? "PRESENT" : "MISSING (Using fallback)");
console.log("Final URL being used:", supabaseUrl);
console.log("==========================");

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    global: {
      headers: {
        'x-client-info': 'nexus-hub-audit'
      }
    }
  }
);

console.log("supabase initialized");


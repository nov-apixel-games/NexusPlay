import { createClient } from '@supabase/supabase-js';

// Usar exclusivamente configuración VERCEL/NEXT o equivalentes mapeados
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qs5r4evrhseujp5dxofq.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_hiLuwfxZawX0zhzWwutviw_RXecYoNL';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);

console.log("supabase initialized");


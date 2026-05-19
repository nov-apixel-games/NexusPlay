import { createClient } from '@supabase/supabase-js';

// Usar de manera segura todas las posibles fuentes de variables
const envUrl = 
  import.meta.env.VITE_SUPABASE_URL || 
  (typeof process !== 'undefined' ? (process.env as any)?.VITE_SUPABASE_URL : undefined) ||
  (typeof process !== 'undefined' ? (process.env as any)?.NEXT_PUBLIC_SUPABASE_URL : undefined);

const envKey = 
  import.meta.env.VITE_SUPABASE_ANON_KEY || 
  (typeof process !== 'undefined' ? (process.env as any)?.VITE_SUPABASE_ANON_KEY : undefined) ||
  (typeof process !== 'undefined' ? (process.env as any)?.NEXT_PUBLIC_SUPABASE_ANON_KEY : undefined);

const fallbackUrl = 'https://qs5r4evrhseujp5dxofq.supabase.co';
const fallbackKey = 'sb_publishable_hiLuwfxZawX0zhzWwutviw_RXecYoNL';

let supabaseUrl = envUrl || fallbackUrl;
let supabaseAnonKey = envKey || fallbackKey;

// Limpiar placeholders del tipo 'your_...'
if (supabaseUrl && supabaseUrl.includes('your_')) {
  supabaseUrl = fallbackUrl;
}
if (supabaseAnonKey && supabaseAnonKey.includes('your_')) {
  supabaseAnonKey = fallbackKey;
}

console.log("=== SUPABASE INIT AUDIT ===");
console.log("VITE_SUPABASE_URL:", envUrl ? "PRESENT" : "MISSING (using fallback/default)");
console.log("Final URL used for init:", supabaseUrl);
console.log("===========================");

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Definimos como let para poder re-inicializar dinámicamente si falta en el bundle del cliente
export let supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    global: {
      headers: {
        'x-client-info': 'nexus-hub-audit'
      }
    }
  }
);

// Función para inicializar dinámicamente con los valores reales del backend en producción
export async function initializeClientDynamic() {
  try {
    console.log("[Supabase dynamic] Intentando leer la configuración real del servidor...");
    const res = await fetch('/api/supabase-config');
    if (res.ok) {
      const data = await res.json();
      if (data.supabaseUrl && data.supabaseAnonKey) {
        // Ignorar placeholders
        const cleanUrl = data.supabaseUrl;
        const cleanKey = data.supabaseAnonKey;
        
        if (cleanUrl && !cleanUrl.includes('your_') && cleanKey && !cleanKey.includes('your_')) {
          if (cleanUrl !== supabaseUrl || cleanKey !== supabaseAnonKey) {
            console.log("[Supabase dynamic] Re-inicializando cliente de Supabase con los secretos de servidores:", cleanUrl);
            supabaseUrl = cleanUrl;
            supabaseAnonKey = cleanKey;
            
            supabase = createClient(
              supabaseUrl,
              supabaseAnonKey,
              {
                auth: {
                  persistSession: true,
                  autoRefreshToken: true,
                  detectSessionInUrl: true,
                },
                global: {
                  headers: {
                    'x-client-info': 'nexus-hub-audit-dynamic'
                  }
                }
              }
            );
          } else {
            console.log("[Supabase dynamic] La configuración actual ya coincide con la del servidor.");
          }
        }
      }
    } else {
      console.warn("[Supabase dynamic] El endpoint /api/supabase-config devolvió un error:", res.status);
    }
  } catch (err: any) {
    console.error("[Supabase dynamic] Error crítico al autodetectar configuración de producción:", err);
    console.error("Detalle del error:", JSON.stringify(err, Object.getOwnPropertyNames(err)));
  }
}

console.log("supabase initialized");


import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

let supabaseClient: any = null;

export function getSupabase() {
  if (!supabaseClient) {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
    let supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
    
    if (supabaseServiceKey.includes('your_')) {
      supabaseServiceKey = '';
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn("[Backend] Supabase no está configurado correctamente. Algunas funciones no estarán disponibles.");
      return null;
    }
    
    supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
  }
  return supabaseClient;
}

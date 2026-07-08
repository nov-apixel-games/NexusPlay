export const getSupabaseConfig = (req: any, res: any) => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
    console.log(`[Backend API] Serviendo supabaseUrl=${supabaseUrl ? supabaseUrl.slice(0, 30) + "..." : "VACIO"}`);
    res.json({
      supabaseUrl,
      supabaseAnonKey
    });
  } catch (error: any) {
    console.error("[Backend API Error] No se pudo leer configuración de Supabase", error);
    res.status(500).json({ error: error.message });
  }
};

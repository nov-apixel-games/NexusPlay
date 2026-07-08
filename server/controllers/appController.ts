import { getSupabase } from "../services/supabase";

export const uploadApp = async (req: any, res: any) => {
  try {
    const { 
      app_name, description, full_description, version, company_name, category, developer_id,
      icon_url, icon_public_id, screenshots, screenshots_public_ids,
      download_url, size, whats_new, min_android, tags
    } = req.body;
    
    if (!download_url) {
      return res.status(400).json({ error: "Falta la URL de descarga del APK" });
    }

    if (!icon_url) {
      return res.status(400).json({ error: "Falta el icono" });
    }

    console.log(`[Backend] Finalizando registro en Supabase para: ${app_name}`);
    
    const supabase = getSupabase();
    if (!supabase) {
      throw new Error("Supabase no está configurado.");
    }

    // BOLA/IDOR Mitigation: Ensure user is only posting apps for their own ID unless they are admin
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", req.user.id).single();
    const isAdmin = profile?.role === "admin";
    if (req.user.id !== developer_id && !isAdmin) {
      return res.status(403).json({ error: "No autorizado para publicar apps en nombre de otro desarrollador" });
    }

    let finalScreenshots = [];
    let finalScreenshotIds = [];
    try {
      finalScreenshots = typeof screenshots === 'string' ? JSON.parse(screenshots) : (screenshots || []);
    } catch (e) {
      console.warn("[Backend] Error parsing screenshots JSON:", e);
    }
    
    try {
      finalScreenshotIds = typeof screenshots_public_ids === 'string' ? JSON.parse(screenshots_public_ids) : (screenshots_public_ids || []);
    } catch (e) {
      console.warn("[Backend] Error parsing screenshots_public_ids JSON:", e);
    }

    const { data: appData, error: dbError } = await supabase
      .from('apps')
      .insert([{
        app_name,
        company_name,
        description,
        developer_id,
        icon_url,
        icon_public_id,
        screenshots: finalScreenshots,
        screenshots_public_ids: finalScreenshotIds,
        download_url,
        size: size || "Desconocido",
        version,
        category,
        status: 'pending'
      }])
      .select()
      .single();

    if (dbError) throw dbError;

    console.log(`[Backend] Registro completado: ${app_name}`);
    res.json({ success: true, app: appData });

  } catch (error: any) {
    console.error("[Backend] Error en registro final:", error);
    res.status(500).json({ error: error.message });
  }
};

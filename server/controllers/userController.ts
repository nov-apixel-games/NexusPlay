import { getSupabase } from "../services/supabase";

export const deleteAccount = async (req: any, res: any) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "Falta userId" });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "No authorization header" });
  }
  const token = authHeader.split(" ")[1];
  
  const supBase = getSupabase();
  if (!supBase) {
    return res.status(500).json({ error: "Supabase no configurado en el servidor." });
  }

  try {
    const { data: { user }, error: userErr } = await supBase.auth.getUser(token);
    if (userErr || !user) {
      return res.status(401).json({ error: "Token inválido" });
    }

    const { data: profile } = await supBase.from("profiles").select("role").eq("id", user.id).single();
    const isAdmin = profile?.role === "admin";

    if (user.id !== userId && !isAdmin) {
      return res.status(403).json({ error: "No autorizado para eliminar esta cuenta" });
    }

    const { error: delAuthErr } = await supBase.auth.admin.deleteUser(userId);
    if (delAuthErr) {
       console.warn("[Backend] No se pudo borrar auth user:", delAuthErr.message);
       const { error: profileErr } = await supBase.from('profiles').delete().eq('id', userId);
       if (profileErr) throw new Error("Tampoco se pudo borrar el perfil: " + profileErr.message);
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

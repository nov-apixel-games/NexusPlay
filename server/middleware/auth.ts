import { getSupabase } from "../services/supabase";

export const requireAuth = async (req: any, res: any, next: any) => {
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
    
    req.user = user;
    next();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const requireAdmin = async (req: any, res: any, next: any) => {
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

    if (!isAdmin) {
      return res.status(403).json({ error: "Acceso denegado: Se requiere rol de administrador" });
    }
    
    req.adminUser = user;
    next();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

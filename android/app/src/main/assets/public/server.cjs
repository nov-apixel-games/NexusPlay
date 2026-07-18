var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// server.ts
var server_exports = {};
__export(server_exports, {
  app: () => app,
  default: () => server_default
});
module.exports = __toCommonJS(server_exports);
var import_express2 = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_dotenv4 = __toESM(require("dotenv"), 1);
var import_helmet = __toESM(require("helmet"), 1);
var import_cors = __toESM(require("cors"), 1);
var import_vite = require("vite");

// server/routes.ts
var import_express = require("express");

// server/services/supabase.ts
var import_supabase_js = require("@supabase/supabase-js");
var import_dotenv = __toESM(require("dotenv"), 1);
import_dotenv.default.config();
var supabaseClient = null;
function getSupabase() {
  if (!supabaseClient) {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
    let supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
    if (supabaseServiceKey.includes("your_")) {
      supabaseServiceKey = "";
    }
    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn("[Backend] Supabase no est\xE1 configurado correctamente. Algunas funciones no estar\xE1n disponibles.");
      return null;
    }
    supabaseClient = (0, import_supabase_js.createClient)(supabaseUrl, supabaseServiceKey);
  }
  return supabaseClient;
}

// server/middleware/auth.ts
var requireAuth = async (req, res, next) => {
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
      return res.status(401).json({ error: "Token inv\xE1lido" });
    }
    req.user = user;
    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
var requireAdmin = async (req, res, next) => {
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
      return res.status(401).json({ error: "Token inv\xE1lido" });
    }
    const { data: profile } = await supBase.from("profiles").select("role").eq("id", user.id).single();
    const isAdmin = profile?.role === "admin";
    if (!isAdmin) {
      return res.status(403).json({ error: "Acceso denegado: Se requiere rol de administrador" });
    }
    req.adminUser = user;
    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// server/middleware/rateLimiter.ts
var import_express_rate_limit = __toESM(require("express-rate-limit"), 1);
var apiLimiter = (0, import_express_rate_limit.default)({
  windowMs: 15 * 60 * 1e3,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false
});
var nexusAiLimiter = (0, import_express_rate_limit.default)({
  windowMs: 1 * 60 * 1e3,
  max: 10,
  message: { success: false, error: "L\xEDmite de solicitudes alcanzado. Por favor, intenta de nuevo m\xE1s tarde." }
});

// server/services/cloudinary.ts
var import_cloudinary = require("cloudinary");
var import_dotenv2 = __toESM(require("dotenv"), 1);
import_dotenv2.default.config();
var cloudNameEnv = (process.env.VITE_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME || "").trim();
var apiKeyEnv = (process.env.CLOUDINARY_API_KEY || "").trim();
var apiSecretEnv = (process.env.CLOUDINARY_API_SECRET || "").trim();
if (cloudNameEnv.includes("your_")) cloudNameEnv = "";
if (apiKeyEnv.includes("your_")) apiKeyEnv = "";
if (apiSecretEnv.includes("your_")) apiSecretEnv = "";
if (!cloudNameEnv || !apiKeyEnv || !apiSecretEnv) {
  console.error("CRITICAL ERROR: Cloudinary credentials are not properly configured in environment variables. Refusing to start.");
  process.exit(1);
}
var CLOUD_NAME = cloudNameEnv;
var CLOUDINARY_API_KEY = apiKeyEnv;
var CLOUDINARY_API_SECRET = apiSecretEnv;
import_cloudinary.v2.config({
  cloud_name: CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET
});

// server/controllers/cloudinaryController.ts
var getCloudinarySignature = (req, res) => {
  try {
    if (!CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
      console.error("[Backend] Cloudinary no est\xE1 configurado (faltan variables de entorno)");
      return res.status(500).json({ error: "Cloudinary no est\xE1 configurado en el servidor" });
    }
    const timestamp = Math.round((/* @__PURE__ */ new Date()).getTime() / 1e3);
    const folder = req.query.folder || "NexusStore/general";
    console.log(`[Cloudinary Signature] Generating for folder: "${folder}", timestamp: ${timestamp}`);
    const signature = import_cloudinary.v2.utils.api_sign_request(
      { timestamp, folder },
      CLOUDINARY_API_SECRET
    );
    console.log(`[Cloudinary Signature] Generated: ${signature}`);
    res.json({
      signature,
      timestamp,
      cloud_name: CLOUD_NAME,
      api_key: CLOUDINARY_API_KEY,
      folder
    });
  } catch (error) {
    console.error("[Cloudinary Signature Error]", error);
    res.status(500).json({ error: error.message });
  }
};
var deleteImage = async (req, res) => {
  const { public_id } = req.body;
  if (!public_id) {
    return res.status(400).json({ error: "No public_id provided" });
  }
  try {
    console.log(`[Backend] Deleting image: ${public_id}`);
    const result = await import_cloudinary.v2.uploader.destroy(public_id);
    if (result.result === "ok" || result.result === "not found") {
      res.json({ success: true, result: result.result });
    } else {
      res.status(500).json({ success: false, result: result.result });
    }
  } catch (error) {
    console.error("[Backend] Cloudinary Delete Error:", error);
    res.status(500).json({ error: error.message || "Failed to delete from Cloudinary" });
  }
};
var deleteFolder = async (req, res) => {
  const { folder } = req.body;
  if (!folder) {
    return res.status(400).json({ error: "No folder provided" });
  }
  try {
    console.log(`[Backend] Deleting all resources in folder: ${folder}`);
    await import_cloudinary.v2.api.delete_resources_by_prefix(folder);
    try {
      await import_cloudinary.v2.api.delete_folder(folder + "/icono");
      await import_cloudinary.v2.api.delete_folder(folder + "/screenshots");
      await import_cloudinary.v2.api.delete_folder(folder);
    } catch (e) {
    }
    res.json({ success: true });
  } catch (error) {
    console.error("[Backend] Cloudinary Folder Delete Error:", error);
    res.status(500).json({ error: error.message || "Failed to delete folder from Cloudinary" });
  }
};

// server/controllers/supabaseController.ts
var getSupabaseConfig = (req, res) => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
    console.log(`[Backend API] Serviendo supabaseUrl=${supabaseUrl ? supabaseUrl.slice(0, 30) + "..." : "VACIO"}`);
    res.json({
      supabaseUrl,
      supabaseAnonKey
    });
  } catch (error) {
    console.error("[Backend API Error] No se pudo leer configuraci\xF3n de Supabase", error);
    res.status(500).json({ error: error.message });
  }
};

// server/controllers/appController.ts
var uploadApp = async (req, res) => {
  try {
    const {
      app_name,
      description,
      full_description,
      version,
      company_name,
      category,
      developer_id,
      icon_url,
      icon_public_id,
      screenshots,
      screenshots_public_ids,
      download_url,
      size,
      whats_new,
      min_android,
      tags
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
      throw new Error("Supabase no est\xE1 configurado.");
    }
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", req.user.id).single();
    const isAdmin = profile?.role === "admin";
    if (req.user.id !== developer_id && !isAdmin) {
      return res.status(403).json({ error: "No autorizado para publicar apps en nombre de otro desarrollador" });
    }
    let finalScreenshots = [];
    let finalScreenshotIds = [];
    try {
      finalScreenshots = typeof screenshots === "string" ? JSON.parse(screenshots) : screenshots || [];
    } catch (e) {
      console.warn("[Backend] Error parsing screenshots JSON:", e);
    }
    try {
      finalScreenshotIds = typeof screenshots_public_ids === "string" ? JSON.parse(screenshots_public_ids) : screenshots_public_ids || [];
    } catch (e) {
      console.warn("[Backend] Error parsing screenshots_public_ids JSON:", e);
    }
    const { data: appData, error: dbError } = await supabase.from("apps").insert([{
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
      status: "pending"
    }]).select().single();
    if (dbError) throw dbError;
    console.log(`[Backend] Registro completado: ${app_name}`);
    res.json({ success: true, app: appData });
  } catch (error) {
    console.error("[Backend] Error en registro final:", error);
    res.status(500).json({ error: error.message });
  }
};

// server/services/gemini.ts
var import_genai = require("@google/genai");
var import_dotenv3 = __toESM(require("dotenv"), 1);
import_dotenv3.default.config();
var ai = new import_genai.GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// server/controllers/aiController.ts
var nexusAiChat = async (req, res) => {
  try {
    const { prompt, history, catalogue, language } = req.body;
    const langInstructions = language === "en" ? "RESPOND ALWAYS IN ENGLISH." : language === "pt" ? "RESPOND ALWAYS IN PORTUGUESE." : "RESPONDE SIEMPRE EN ESPA\xD1OL.";
    const systemInstruction = `Eres Nexus AI, el asistente experto de la tienda de aplicaciones "NexusPlay".

REGLAS ESTRICTAS:
1. ${langInstructions}
2. Responde SIEMPRE con un tono natural, directo y servicial usando Markdown.
3. Si el usuario hace preguntas generales (ej: "c\xF3mo optimizar Android", "c\xF3mo liberar espacio"), responde \xDANICAMENTE la consulta de manera clara y profesional. NO recomiendes aplicaciones si no las piden expresamente o si no son clave para resolver el problema.
4. NO generes tablas mal formateadas o contenido roto. Usa vi\xF1etas o texto estructurado.
5. NUNCA recomiendes aplicaciones que no est\xE9n en tu cat\xE1logo. No inventes aplicaciones.
6. NO menciones juegos o apps (ej: "Minecraft") si no est\xE1n en el contexto o cat\xE1logo.

MANEJO DE APPS Y JSON FINAL:
Si decides que es necesario recomendar aplicaciones (porque el usuario lo pidi\xF3 o porque encajan perfectamente con el pedido), debes seleccionar sus IDs exactos del cat\xE1logo.
AL FINAL de tu respuesta, DEBES incluir EXCLUSIVAMENTE un bloque JSON protegido con \`\`\`json que contenga un arreglo de strings con los IDs. 

Ejemplo si no recomiendas nada (PREDETERMINADO PARA PREGUNTAS GENERALES):
\`\`\`json
[]
\`\`\`

Ejemplo si recomiendas aplicaciones del cat\xE1logo:
\`\`\`json
["id-app-1", "id-app-2"]
\`\`\`

Cat\xE1logo disponible:
${JSON.stringify(catalogue, null, 2)}`;
    const contents = (history || []).map((h) => ({
      role: h.role,
      // 'user' or 'model'
      parts: [{ text: h.text }]
    }));
    contents.push({ role: "user", parts: [{ text: prompt }] });
    let response;
    let retries = 3;
    while (retries > 0) {
      try {
        console.log(`[Nexus AI] Enviando mensaje a Gemini (prompt: ${prompt.substring(0, 50)}...)`);
        response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents,
          config: {
            systemInstruction,
            temperature: 0.7
          }
        });
        console.log(`[Nexus AI] Respuesta de Gemini OK`);
        break;
      } catch (err) {
        if (retries === 1 || err?.status !== "UNAVAILABLE" && err?.status !== "RESOURCE_EXHAUSTED" && err?.status !== 503 && err?.status !== 429) {
          throw err;
        }
        console.warn(`[Nexus AI] Gemini API fall\xF3 (${err?.status}). Reintentando (${3 - retries + 1}/3)... wait 1000ms`);
        await new Promise((resolve) => setTimeout(resolve, 1e3));
        retries--;
      }
    }
    res.json({ success: true, text: response?.text });
  } catch (error) {
    console.error("[Nexus AI Error]", error);
    const isProd = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
    res.status(500).json({
      success: false,
      error: "Error al procesar la recomendaci\xF3n de IA",
      details: isProd ? void 0 : {
        code: error?.status || error?.code || 500,
        status: error?.statusText || "ERROR"
      }
    });
  }
};
var nexus3dAi = async (req, res) => {
  try {
    const { prompt } = req.body;
    const systemInstruction = `Eres una IA experta en dise\xF1o de niveles 3D para una plataforma "Nexus Studio" (estilo voxel/Three.js).
Genera SIEMPRE un entorno COMPLETO y RICO con M\xDALTIPLES objetos (AL MENOS 10 A 30 OBJETOS) distribuidos en la escena. Nunca generes un solo objeto, debes construir la escena entera (ciudades completas con edificios y calles, bosques densos, etc).
Genera un array de objetos JSON para construir el escenario. Cada objeto debe tener:
- id (string \xFAnico)
- type ("wall", "prop", "nature", "enemy", "vehicle")
- shape ("cube", "sphere", "cylinder") si es wall
- prop_type ("ruined_building", "car_abandoned", "skyscraper", "street_light", "cactus", "snow_pine") si es prop
- nature_type ("tree", "rock", "bush", "mountain", "animal", "crate") si es nature
- position ([x, y, z]) (Distribuye los objetos, no pongas todo en 0,0,0)
- scale ([x, y, z])
- rotation ([x, y, z])
- color (c\xF3digo hex)
- label (nombre descriptivo)
Solo debes devolver un arreglo JSON v\xE1lido envuelto en \`\`\`json y \`\`\`.`;
    const modelName = "gemini-2.5-flash";
    console.log("Modelo Gemini:", modelName);
    let response;
    let retries = 3;
    while (retries > 0) {
      try {
        response = await ai.models.generateContent({
          model: modelName,
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          config: { systemInstruction, temperature: 0.8 }
        });
        break;
      } catch (err) {
        if (retries === 1 || err?.status !== "UNAVAILABLE" && err?.status !== "RESOURCE_EXHAUSTED" && err?.status !== 503 && err?.status !== 429) {
          throw err;
        }
        console.warn(`[Sandbox AI] Gemimi API retry (${3 - retries + 1}/3)... waiting 1000ms`);
        await new Promise((resolve) => setTimeout(resolve, 1e3));
        retries--;
      }
    }
    console.log("Respuesta Gemini OK");
    res.json({ success: true, text: response?.text });
  } catch (error) {
    console.error("Error Gemini:", error);
    res.status(500).json({ success: false, error: "Modelo Gemini no disponible" });
  }
};

// server/controllers/systemController.ts
var import_os = __toESM(require("os"), 1);
var getSystemStats = async (req, res) => {
  try {
    let cloudinaryUsage = null;
    try {
      const usage = await import_cloudinary.v2.api.usage();
      cloudinaryUsage = usage;
    } catch (e) {
      console.error("[Backend] Cloudinary usage error:", e?.message || JSON.stringify(e));
      try {
        let totalBytes = 0;
        let count = 0;
        const result = await import_cloudinary.v2.api.resources({ max_results: 500 });
        if (result && result.resources) {
          result.resources.forEach((r) => {
            totalBytes += r.bytes || 0;
            count++;
          });
        }
        cloudinaryUsage = {
          storage: { usage: totalBytes },
          resources: count,
          fallback: true
        };
      } catch (fallbackErr) {
        console.error("[Backend] Fallback cloudinary calc error:", fallbackErr?.message || JSON.stringify(fallbackErr));
        cloudinaryUsage = { storage: { usage: 0 }, fallback: true };
      }
    }
    const systemInfo = {
      osPlatform: import_os.default.platform(),
      cpuCores: import_os.default.cpus().length,
      totalMem: import_os.default.totalmem(),
      freeMem: import_os.default.freemem(),
      processUptime: process.uptime(),
      serverUptime: import_os.default.uptime(),
      loadAvg: import_os.default.loadavg(),
      vercelAvailable: !!process.env.VERCEL_TOKEN
    };
    res.json({ success: true, systemInfo, cloudinaryUsage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// server/controllers/userController.ts
var deleteAccount = async (req, res) => {
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
      return res.status(401).json({ error: "Token inv\xE1lido" });
    }
    const { data: profile } = await supBase.from("profiles").select("role").eq("id", user.id).single();
    const isAdmin = profile?.role === "admin";
    if (user.id !== userId && !isAdmin) {
      return res.status(403).json({ error: "No autorizado para eliminar esta cuenta" });
    }
    const { error: delAuthErr } = await supBase.auth.admin.deleteUser(userId);
    if (delAuthErr) {
      console.warn("[Backend] No se pudo borrar auth user:", delAuthErr.message);
      const { error: profileErr } = await supBase.from("profiles").delete().eq("id", userId);
      if (profileErr) throw new Error("Tampoco se pudo borrar el perfil: " + profileErr.message);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// server/routes.ts
var router = (0, import_express.Router)();
router.use((req, res, next) => {
  if (req.url.startsWith("/")) {
    console.log(`[Backend] ${req.method} /api${req.url}`);
  }
  next();
});
router.use("/", apiLimiter);
router.use("/nexus-ai", nexusAiLimiter);
router.get("/cloudinary-signature", requireAuth, getCloudinarySignature);
router.get("/supabase-config", getSupabaseConfig);
router.post("/upload-app", requireAuth, (req, res, next) => {
  console.log(`[Backend] Recibiendo registro final de app...`);
  next();
}, uploadApp);
router.post("/nexus-ai", nexusAiChat);
router.post("/nexus-3d-ai", nexus3dAi);
router.post("/delete-image", requireAuth, deleteImage);
router.post("/delete-folder", requireAdmin, deleteFolder);
router.get("/system-stats", requireAdmin, getSystemStats);
router.post("/delete-account", deleteAccount);
var routes_default = router;

// server.ts
import_dotenv4.default.config();
var app = (0, import_express2.default)();
app.use((0, import_helmet.default)({
  frameguard: false,
  contentSecurityPolicy: false
}));
var allowedOrigins = [
  "http://localhost:3000",
  "https://ai.studio",
  "https://aistudio.google.com"
];
app.use((0, import_cors.default)({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith(".run.app") || origin.includes("localhost")) {
      callback(null, true);
    } else {
      callback(new Error("CORS Policy Violation: Access denied from this origin"));
    }
  },
  credentials: true
}));
app.use(import_express2.default.json({ limit: "10mb" }));
app.use(import_express2.default.urlencoded({ limit: "10mb", extended: true }));
app.use("/api", routes_default);
app.use((err, req, res, next) => {
  console.error("[Global Error Handled]", err);
  const isProd = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
  res.status(err.status || 500).json({
    error: isProd ? "Internal Server Error" : err.message || "Internal Server Error",
    ...isProd ? {} : { details: typeof err === "object" ? err : String(err) }
  });
});
async function startServer() {
  const PORT = 3e3;
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    if (!process.env.VERCEL) {
      const distPath = import_path.default.join(process.cwd(), "dist");
      app.use(import_express2.default.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(import_path.default.join(distPath, "index.html"));
      });
    }
  }
  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}
if (!process.env.VERCEL) {
  startServer().catch((err) => {
    console.error("Failed to start server:", err);
  });
}
var server_default = app;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  app
});
//# sourceMappingURL=server.cjs.map

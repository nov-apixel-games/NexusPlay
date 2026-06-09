import express from "express";
import path from "path";
import os from "os";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import multer from "multer";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Supabase Configuration Helper
let supabaseClient: any = null;
function getSupabase() {
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

// Cloudinary Configuration
let cloudNameEnv = (process.env.VITE_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME || '').trim();
let apiKeyEnv = (process.env.CLOUDINARY_API_KEY || '').trim();
let apiSecretEnv = (process.env.CLOUDINARY_API_SECRET || '').trim();

// Filter out "your_" placeholders
if (cloudNameEnv.includes('your_')) cloudNameEnv = '';
if (apiKeyEnv.includes('your_')) apiKeyEnv = '';
if (apiSecretEnv.includes('your_')) apiSecretEnv = '';

// Fix for swapped credentials or using default account with missing parts
const IS_DEFAULT_CONFIG = 
  !cloudNameEnv || 
  cloudNameEnv === 'dnpnmhmht' || 
  apiKeyEnv === '719435337158523' || 
  cloudNameEnv === '719435337158523' || // Swapped
  apiKeyEnv === 'dnpnmhmht';           // Swapped

if (IS_DEFAULT_CONFIG) {
  console.log("[Cloudinary] Using default account configuration (detected from env or fallbacks)");
  cloudNameEnv = 'dnpnmhmht';
  apiKeyEnv = '719435337158523';
  apiSecretEnv = 'NTAKR4xesWwzwm74bY-TNwwp6To';
}

const CLOUD_NAME = cloudNameEnv || 'dnpnmhmht';
const CLOUDINARY_API_KEY = apiKeyEnv || '719435337158523';
const CLOUDINARY_API_SECRET = apiSecretEnv || 'NTAKR4xesWwzwm74bY-TNwwp6To';

cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET
});

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(os.tmpdir(), 'nexus-uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 2 * 1024 * 1024 * 1024 } // 2GB limit for APKs
});

// Delete resources from Cloudinary
async function deleteCloudinaryImage(url: string) {
  try {
    const parts = url.split('/');
    if (parts.length < 2) return false;
    const versionIndex = parts.findIndex(p => p.startsWith('v') && !isNaN(parseInt(p.substring(1))));
    
    // Extact everything after version index (or fallback if no version)
    const afterVersion = versionIndex !== -1 ? parts.slice(versionIndex + 1).join('/') : parts.slice(-2).join('/');
    
    // Remove extension
    const publicId = afterVersion.substring(0, afterVersion.lastIndexOf('.'));
    if (!publicId) return false;

    console.log(`[Cleanup] Eliminando imagen vieja de Cloudinary: ${publicId}`);
    const res = await cloudinary.uploader.destroy(publicId);
    return res.result === 'ok' || res.result === 'not found';
  } catch (err: any) {
    console.error(`[Cleanup] Error eliminando ${url}:`, err.message);
    return false;
  }
}

// Background Task: Image Cleanup (Every 12 hours)
setInterval(async () => {
    try {
      const supabase = getSupabase();
      if (!supabase) return;

      console.log("[Cleanup] Ejecutando limpieza automática de imágenes expiradas (>7 días)...");
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data: oldMessages, error } = await supabase
        .from('messages')
        .select('*')
        .lte('created_at', sevenDaysAgo.toISOString())
        .like('content', '%"image_url":"https://%');

      if (error || !oldMessages || oldMessages.length === 0) {
        console.log("[Cleanup] No hay mensajes con imágenes para borrar.");
        return;
      }

      for (const msg of oldMessages) {
        try {
          const parsed = JSON.parse(msg.content);
          if (parsed.image_url) {
            await deleteCloudinaryImage(parsed.image_url);
            
            // Edit message to remove image but keep text
            const newContent = {
              text: parsed.text || "Imagen expirada",
              channel: parsed.channel,
              image_url: null,
              expired: true
            };
            
            await supabase
              .from('messages')
              .update({ content: JSON.stringify(newContent) })
              .eq('id', msg.id);
              
            console.log(`[Cleanup] Mensaje ${msg.id} limpiado correctamente.`);
          }
        } catch(e) {
           console.error("[Cleanup] Falló parseo o borrado en msg", msg.id, e);
        }
      }
    } catch(err) {
       console.error("[Cleanup] Error general:", err);
    }
}, 12 * 60 * 60 * 1000); // 12 hours

export const app = express();

app.use(express.json({ limit: '2000mb' }));
app.use(express.urlencoded({ limit: '2000mb', extended: true }));

// Helper for Cloudinary Signature
app.get("/api/cloudinary-signature", (req, res) => {
  try {
    if (!CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
      console.error("[Backend] Cloudinary no está configurado (faltan variables de entorno)");
      return res.status(500).json({ error: "Cloudinary no está configurado en el servidor" });
    }

    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = req.query.folder as string || 'NexusStore/general';
    
    console.log(`[Cloudinary Signature] Generating for folder: "${folder}", timestamp: ${timestamp}`);

    const signature = cloudinary.utils.api_sign_request(
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
  } catch (error: any) {
    console.error("[Cloudinary Signature Error]", error);
    res.status(500).json({ error: error.message });
  }
});

// End point para obtener la configuración de Supabase real de forma dinámica
app.get("/api/supabase-config", (req, res) => {
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
});

app.use((req, res, next) => {
  if (req.url.startsWith('/api')) {
    console.log(`[Backend] ${req.method} ${req.url}`);
  }
  next();
});

// API Route: Register App (All data already uploaded by client)
app.post("/api/upload-app", (req, res, next) => {
  console.log(`[Backend] Recibiendo registro final de app...`);
  next();
}, async (req: any, res: any) => {
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

    const finalScreenshots = typeof screenshots === 'string' ? JSON.parse(screenshots) : screenshots;
    const finalScreenshotIds = typeof screenshots_public_ids === 'string' ? JSON.parse(screenshots_public_ids) : screenshots_public_ids;

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
});

// API Route: Nexus AI Chat Assistant
app.post("/api/nexus-ai", async (req, res) => {
  try {
    const { prompt, history, catalogue, language } = req.body;
    
    const langInstructions = language === 'en' ? 'RESPOND ALWAYS IN ENGLISH.' : language === 'pt' ? 'RESPOND ALWAYS IN PORTUGUESE.' : 'RESPONDE SIEMPRE EN ESPAÑOL.';
    
    const systemInstruction = `Eres Nexus AI, el asistente experto de la tienda de aplicaciones "NexusPlay".

REGLAS ESTRICTAS:
1. ${langInstructions}
2. Responde SIEMPRE con un tono natural, directo y servicial usando Markdown.
3. Si el usuario hace preguntas generales (ej: "cómo optimizar Android", "cómo liberar espacio"), responde ÚNICAMENTE la consulta de manera clara y profesional. NO recomiendes aplicaciones si no las piden expresamente o si no son clave para resolver el problema.
4. NO generes tablas mal formateadas o contenido roto. Usa viñetas o texto estructurado.
5. NUNCA recomiendes aplicaciones que no estén en tu catálogo. No inventes aplicaciones.
6. NO menciones juegos o apps (ej: "Minecraft") si no están en el contexto o catálogo.

MANEJO DE APPS Y JSON FINAL:
Si decides que es necesario recomendar aplicaciones (porque el usuario lo pidió o porque encajan perfectamente con el pedido), debes seleccionar sus IDs exactos del catálogo.
AL FINAL de tu respuesta, DEBES incluir EXCLUSIVAMENTE un bloque JSON protegido con \`\`\`json que contenga un arreglo de strings con los IDs. 

Ejemplo si no recomiendas nada (PREDETERMINADO PARA PREGUNTAS GENERALES):
\`\`\`json
[]
\`\`\`

Ejemplo si recomiendas aplicaciones del catálogo:
\`\`\`json
["id-app-1", "id-app-2"]
\`\`\`

Catálogo disponible:
${JSON.stringify(catalogue, null, 2)}`;

    const contents = (history || []).map((h: any) => ({
      role: h.role, // 'user' or 'model'
      parts: [{ text: h.text }]
    }));
    contents.push({ role: 'user', parts: [{ text: prompt }] });

    let response;
    let retries = 3;
    while (retries > 0) {
      try {
        console.log(`[Nexus AI] Enviando mensaje a Gemini (prompt: ${prompt.substring(0, 50)}...)`);
        response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: contents,
          config: {
            systemInstruction: systemInstruction,
            temperature: 0.7
          }
        });
        console.log(`[Nexus AI] Respuesta de Gemini OK`);
        break; // Sucess, exit retry loop
      } catch (err: any) {
        if (retries === 1 || (err?.status !== 'UNAVAILABLE' && err?.status !== 'RESOURCE_EXHAUSTED' && err?.status !== 503 && err?.status !== 429)) {
          throw err;
        }
        console.warn(`[Nexus AI] Gemini API falló (${err?.status}). Reintentando (${3 - retries + 1}/3)... wait 1000ms`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        retries--;
      }
    }
    
    res.json({ success: true, text: response?.text });
  } catch (error: any) {
    console.error("[Nexus AI Error]", error);
    
    // Devolvemos el error detallado
    res.status(500).json({ 
      success: false,
      error: error.message || "Error al procesar la recomendación de IA",
      details: {
        code: error?.status || error?.code || 500,
        status: error?.statusText || "ERROR",
        fullError: JSON.stringify(error, Object.getOwnPropertyNames(error))
      }
    });
  }
});

// API Route: Nexus 3D Editor AI
app.post("/api/nexus-3d-ai", async (req, res) => {
  try {
    const { prompt } = req.body;
    const systemInstruction = `Eres una IA experta en diseño de niveles 3D para una plataforma "Nexus Studio" (estilo voxel/Three.js).
Genera SIEMPRE un entorno COMPLETO y RICO con MÚLTIPLES objetos (AL MENOS 10 A 30 OBJETOS) distribuidos en la escena. Nunca generes un solo objeto, debes construir la escena entera (ciudades completas con edificios y calles, bosques densos, etc).
Genera un array de objetos JSON para construir el escenario. Cada objeto debe tener:
- id (string único)
- type ("wall", "prop", "nature", "enemy", "vehicle")
- shape ("cube", "sphere", "cylinder") si es wall
- prop_type ("ruined_building", "car_abandoned", "skyscraper", "street_light", "cactus", "snow_pine") si es prop
- nature_type ("tree", "rock", "bush", "mountain", "animal", "crate") si es nature
- position ([x, y, z]) (Distribuye los objetos, no pongas todo en 0,0,0)
- scale ([x, y, z])
- rotation ([x, y, z])
- color (código hex)
- label (nombre descriptivo)
Solo debes devolver un arreglo JSON válido envuelto en \`\`\`json y \`\`\`.`;

    const modelName = "gemini-2.5-flash";
    console.log("Modelo Gemini:", modelName);

    let response;
    let retries = 3;
    while (retries > 0) {
      try {
        response = await ai.models.generateContent({
          model: modelName,
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: { systemInstruction: systemInstruction, temperature: 0.8 }
        });
        break;
      } catch (err: any) {
        if (retries === 1 || (err?.status !== 'UNAVAILABLE' && err?.status !== 'RESOURCE_EXHAUSTED' && err?.status !== 503 && err?.status !== 429)) {
          throw err;
        }
        console.warn(`[Sandbox AI] Gemimi API retry (${3 - retries + 1}/3)... waiting 1000ms`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        retries--;
      }
    }
    
    console.log("Respuesta Gemini OK");
    res.json({ success: true, text: response?.text });
  } catch (error: any) {
    console.error("Error Gemini:", error);
    res.status(500).json({ success: false, error: "Modelo Gemini no disponible" });
  }
});

// API Route: Secure Image Deletion
app.post("/api/delete-image", async (req, res) => {
  const { public_id } = req.body;
  
  if (!public_id) {
    return res.status(400).json({ error: "No public_id provided" });
  }

  try {
    console.log(`[Backend] Deleting image: ${public_id}`);
    const result = await cloudinary.uploader.destroy(public_id);
    
    if (result.result === 'ok' || result.result === 'not found') {
      res.json({ success: true, result: result.result });
    } else {
      res.status(500).json({ success: false, result: result.result });
    }
  } catch (error: any) {
    console.error("[Backend] Cloudinary Delete Error:", error);
    res.status(500).json({ error: error.message || "Failed to delete from Cloudinary" });
  }
});

// API Route: Delete App Folder
app.post("/api/delete-folder", async (req, res) => {
  const { folder } = req.body;
  
  if (!folder) {
    return res.status(400).json({ error: "No folder provided" });
  }

  try {
    console.log(`[Backend] Deleting all resources in folder: ${folder}`);
    await cloudinary.api.delete_resources_by_prefix(folder);
    
    try {
      await cloudinary.api.delete_folder(folder + "/icono");
      await cloudinary.api.delete_folder(folder + "/screenshots");
      await cloudinary.api.delete_folder(folder);
    } catch (e) {
      // Ignore
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error("[Backend] Cloudinary Folder Delete Error:", error);
    res.status(500).json({ error: error.message || "Failed to delete folder from Cloudinary" });
  }
});

// API Route: System & Storage Stats
app.get("/api/system-stats", async (req, res) => {
  try {
     let cloudinaryUsage = null;
     try {
       const usage = await cloudinary.api.usage();
       cloudinaryUsage = usage;
     } catch (e: any) {
       console.error("[Backend] Cloudinary usage error:", e?.message || JSON.stringify(e));
       try {
         let totalBytes = 0;
         let count = 0;
         const result = await cloudinary.api.resources({ max_results: 500 });
         if (result && result.resources) {
           result.resources.forEach((r: any) => { totalBytes += (r.bytes || 0); count++; });
         }
         cloudinaryUsage = {
           storage: { usage: totalBytes },
           resources: count,
           fallback: true
         };
       } catch (fallbackErr: any) {
         console.error("[Backend] Fallback cloudinary calc error:", fallbackErr?.message || JSON.stringify(fallbackErr));
         cloudinaryUsage = { storage: { usage: 0 }, fallback: true };
       }
     }

     const systemInfo = {
       osPlatform: os.platform(),
       cpuCores: os.cpus().length,
       totalMem: os.totalmem(),
       freeMem: os.freemem(),
       processUptime: process.uptime(),
       serverUptime: os.uptime(),
       loadAvg: os.loadavg(),
       vercelAvailable: !!process.env.VERCEL_TOKEN
     };

     res.json({ success: true, systemInfo, cloudinaryUsage });
  } catch (err: any) {
     res.status(500).json({ error: err.message });
  }
});

// Global Error Handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error("[Global Error Handled]", err);
  res.status(err.status || 500).json({ 
    error: err.message || "Internal Server Error",
    details: typeof err === 'object' ? err : String(err)
  });
});

async function startServer() {
  const PORT = 3000;

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Only serve static files if NOT in Vercel
    if (!process.env.VERCEL) {
      const distPath = path.join(process.cwd(), "dist");
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }
  }

  // Only listen on port if NOT in Vercel
  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

if (!process.env.VERCEL) {
  startServer().catch(err => {
    console.error("Failed to start server:", err);
  });
}

export default app;

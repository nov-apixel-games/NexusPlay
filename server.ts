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

async function startServer() {
  const app = express();
  const PORT = 3000;

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

  console.log("[Backend] Verificando variables de entorno...");
  console.log(`[Backend] SUPABASE_URL: ${(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL) ? 'Configurado' : 'No configurado'}`);
  console.log(`[Backend] CLOUDINARY_API_KEY: ${process.env.CLOUDINARY_API_KEY ? 'Configurado' : 'No configurado'}`);

  // Logging middleware
  app.use((req, res, next) => {
    console.log(`[Backend] ${req.method} ${req.url}`);
    next();
  });

  // API Route: Register App (All data already uploaded by client)
  app.post("/api/upload-app", (req, res, next) => {
    console.log(`[Backend] Recibiendo registro final de app...`);
    // No multipart files needed anymore
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
      
      // Save to Supabase
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
      const { prompt, history, catalogue } = req.body;
      
      const systemInstruction = `Eres Nexus AI, el asistente inteligente y experto de la tienda de aplicaciones "NexusPlay".
Tu objetivo es recomendar aplicaciones reales del catálogo actual (provisto abajo), crear "packs" temáticos de apps, dar consejos para optimizar celulares (Android) y proponer retos o "misiones" que los usuarios puedan hacer usando apps.

IMPORTANTE: 
1. Responde SIEMPRE con formato natural, amigable, usando Markdown, emojis y estilo moderno. No suenes robótico.
2. NUNCA recomiendes apps que no estén en el catálogo provisto.
3. Si el usuario te da detalles de su dispositivo (ej: "tengo 2GB RAM"), tenlo en cuenta para recomendar apps ligeras.
4. Responde a lo que pide: si pide un pack, presenta el "Pack", apps incluidas, por qué elegidas. Si pide misión, dale pasos claros.
5. AL FINAL de tu respuesta, SIEMPRE DEBES incluir un bloque de código JSON, envuelto con \`\`\`json y \`\`\`, que contenga únicamente un array de stings con los IDs exactos de las aplicaciones que recomendaste a lo largo del mensaje. Ejemplo: \`\`\`json\n["app-id-1", "app-id-2"]\n\`\`\` (si no recomiendas ninguna, devuelve \`\`\`json\n[]\n\`\`\`).

Catálogo actual de aplicaciones disponibles en NexusPlay:
${JSON.stringify(catalogue, null, 2)}
`;

      const contents = (history || []).map((h: any) => ({
        role: h.role, // 'user' or 'model'
        parts: [{ text: h.text }]
      }));
      contents.push({ role: 'user', parts: [{ text: prompt }] });

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7
        }
      });
      
      res.json({ success: true, text: response.text });
    } catch (error: any) {
      console.error("[Nexus AI Error]", error);
      res.status(500).json({ error: error.message || "Error al procesar la recomendación de IA" });
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
      // 1. Delete all files in folder and its subfolders
      // delete_resources_by_prefix requires the folder name with trailing slash usually, or just prefix
      await cloudinary.api.delete_resources_by_prefix(folder);
      
      // 2. The Cloudinary free tier or normal setup also requires deleting subfolders sequentially if we want to remove the folders, 
      // but deleting resources is what frees up space. Usually, empty folders are fine or we can try to delete them.
      try {
        await cloudinary.api.delete_folder(folder + "/icono");
        await cloudinary.api.delete_folder(folder + "/screenshots");
        await cloudinary.api.delete_folder(folder);
      } catch (e) {
        // Ignorar errores si la carpeta no existe o tiene subcarpetas anidadas
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
       };

       res.json({ success: true, systemInfo, cloudinaryUsage });
    } catch (err: any) {
       res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
});

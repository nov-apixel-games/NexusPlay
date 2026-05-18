import express from "express";
import path from "path";
import os from "os";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import multer from "multer";
import { createClient } from "@supabase/supabase-js";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

dotenv.config();

// Cloudflare R2 Configuration
const R2_ACCOUNT_ID = (process.env.CLOUDFLARE_ACCOUNT_ID || '39ab12ebf72be930b4a0d6c7440c8054').trim();
const R2_ACCESS_KEY_ID = (process.env.R2_ACCESS_KEY_ID || '').trim();
const R2_SECRET_ACCESS_KEY = (process.env.R2_SECRET_ACCESS_KEY || '').trim();
const R2_BUCKET_NAME = (process.env.R2_BUCKET_NAME || '').trim();
const R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL || 'https://pub-6be90dd8331c48729d89adc7052f0229.r2.dev').trim();

let s3Client: S3Client | null = null;
if (R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY) {
  s3Client = new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
    forcePathStyle: true,
  });
}

// Supabase Configuration Helper
let supabaseClient: any = null;
function getSupabase() {
  if (!supabaseClient) {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://qs5r4evrhseujp5dxofq.supabase.co';
    let supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_hiLuwfxZawX0zhzWwutviw_RXecYoNL';
    
    if (supabaseServiceKey.includes('your_')) {
      supabaseServiceKey = 'sb_publishable_hiLuwfxZawX0zhzWwutviw_RXecYoNL';
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
  limits: { fileSize: 500 * 1024 * 1024 } // 500MB limit for APKs
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '500mb' }));
  app.use(express.urlencoded({ limit: '500mb', extended: true }));

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

  // NEW: HANDLE CLOUDFLARE R2 ASSET UPLOAD via PRESIGNED URL
  app.post("/api/upload-apk-presigned", async (req, res) => {
    try {
      const { app_name, version, contentType = "application/octet-stream" } = req.body;

      if (!s3Client || !R2_BUCKET_NAME) {
        return res.status(500).json({ success: false, error: "Cloudflare R2 no está configurado en el servidor" });
      }

      console.log(`[Backend] Generating presigned URL para: ${app_name} v${version} con type: ${contentType}`);

      const cleanAppName = (app_name || 'app').replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const finalFileName = `${cleanAppName}_v${version}_${Date.now()}.apk`;
      
      const command = new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: finalFileName,
        ContentType: contentType,
      });

      const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

      
      // Generate Public URL for when it's done
      const publicUrl = R2_PUBLIC_URL 
        ? `${R2_PUBLIC_URL.replace(/\/$/, '')}/${finalFileName}`
        : `https://${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${finalFileName}`;

      return res.json({
        success: true,
        presigned_url: presignedUrl,
        public_url: publicUrl,
        file_name: finalFileName
      });
    } catch (error: any) {
      console.error("[Backend] Error generando presigned URL:", error);
      res.status(500).json({ success: false, error: error.message || "Error interno" });
    }
  });

  // OLD: HANDLE CLOUDFLARE R2 ASSET UPLOAD (direct passing)
  app.post("/api/upload-apk-r2", upload.single('apk'), async (req, res) => {
    try {
      const { app_name, version } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ success: false, error: "No se recibió el archivo APK" });
      }

      if (!s3Client || !R2_BUCKET_NAME) {
        return res.status(500).json({ success: false, error: "Cloudflare R2 no está configurado en el servidor" });
      }

      console.log(`[Backend] APK recibido (${file.size} bytes). Subiendo a Cloudflare R2...`);

      const cleanAppName = app_name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const finalFileName = `${cleanAppName}_v${version}_${Date.now()}.apk`;
      
      const fileStream = fs.createReadStream(file.path);

      const command = new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: finalFileName,
        Body: fileStream,
        ContentType: "application/vnd.android.package-archive",
      });

      await s3Client.send(command);

      // Cleanup
      try {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      } catch (e) {
        console.error("[Backend] Warning: could not delete temp file", e);
      }

      // Generate Public URL
      const publicUrl = R2_PUBLIC_URL 
        ? `${R2_PUBLIC_URL.replace(/\/$/, '')}/${finalFileName}`
        : `https://${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${finalFileName}`;

      console.log(`[Backend] Subida a R2 completada: ${publicUrl}`);
      return res.json({
        success: true,
        apk_url: publicUrl,
      });
    } catch (error: any) {
      if (req.file && fs.existsSync(req.file.path)) {
        try { fs.unlinkSync(req.file.path); } catch(e){}
      }
      console.error("[Backend] Error subiendo APK a R2:", error);
      res.status(500).json({ success: false, error: error.message || "Error interno subiendo el APK a R2" });
    }
  });

  console.log("[Backend] Verificando variables de entorno...");
  console.log(`[Backend] R2_ACCOUNT_ID: ${R2_ACCOUNT_ID ? 'Configurado' : 'No configurado'}`);
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
          full_description,
          developer_id,
          icon_url,
          icon_public_id,
          screenshots: finalScreenshots,
          screenshots_public_ids: finalScreenshotIds,
          download_url,
          size: size || "Desconocido",
          version,
          category,
          status: 'published',
          changelog: whats_new,
          compatibility: min_android,
          tags: tags || []
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

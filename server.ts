import express from "express";
import path from "path";
import os from "os";
import { createServer as createViteServer } from "vite";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

// Cloudinary Configuration
cloudinary.config({
  cloud_name: 'dnpnmhmht',
  api_key: '719435337158523',
  api_secret: 'NTAKR4xesWwzwm74bY-TNwwp6To'
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

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

startServer();

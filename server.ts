import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.VITE_CLOUDINARY_CLOUD_NAME || 'dnpnmhmht',
  api_key: process.env.VITE_CLOUDINARY_API_KEY || '719435337158523',
  api_secret: process.env.VITE_CLOUDINARY_API_SECRET || 'NTAKR4xesWwzwm74bY-TNwwp6To'
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

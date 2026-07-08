import { Router } from "express";
import { requireAuth, requireAdmin } from "./middleware/auth";
import { apiLimiter, nexusAiLimiter } from "./middleware/rateLimiter";
import { getCloudinarySignature, deleteImage, deleteFolder } from "./controllers/cloudinaryController";
import { getSupabaseConfig } from "./controllers/supabaseController";
import { uploadApp } from "./controllers/appController";
import { nexusAiChat, nexus3dAi } from "./controllers/aiController";
import { getSystemStats } from "./controllers/systemController";
import { deleteAccount } from "./controllers/userController";

const router = Router();

// Log API requests middleware
router.use((req, res, next) => {
  if (req.url.startsWith('/')) {
    console.log(`[Backend] ${req.method} /api${req.url}`);
  }
  next();
});

// Apply rate limits
router.use('/', apiLimiter);
router.use('/nexus-ai', nexusAiLimiter);

// Public / general configuration endpoints
router.get("/cloudinary-signature", requireAuth, getCloudinarySignature);
router.get("/supabase-config", getSupabaseConfig);

// App routes
router.post("/upload-app", requireAuth, (req, res, next) => {
  console.log(`[Backend] Recibiendo registro final de app...`);
  next();
}, uploadApp);

// AI features routes
router.post("/nexus-ai", nexusAiChat);
router.post("/nexus-3d-ai", nexus3dAi);

// Cloudinary image/folder management routes
router.post("/delete-image", requireAuth, deleteImage);
router.post("/delete-folder", requireAdmin, deleteFolder);

// Admin system stats route
router.get("/system-stats", requireAdmin, getSystemStats);

// User management route
router.post("/delete-account", deleteAccount);

export default router;

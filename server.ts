import express from "express";
import path from "path";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import apiRoutes from "./server/routes";

dotenv.config();

export const app = express();

// Secure headers with Helmet (disabling frameguard/CSP so AI Studio Iframe & remote assets work seamlessly)
app.use(helmet({
  frameguard: false,
  contentSecurityPolicy: false,
}));

// Configure CORS safely
const allowedOrigins = [
  "http://localhost:3000",
  "https://ai.studio",
  "https://aistudio.google.com"
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith(".run.app") || origin.includes("localhost")) {
      callback(null, true);
    } else {
      callback(new Error("CORS Policy Violation: Access denied from this origin"));
    }
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Mount all modularized API routes
app.use("/api", apiRoutes);

// Global Error Handler - Prevents exposing sensitive stack traces or raw details to client
app.use((err: any, req: any, res: any, next: any) => {
  console.error("[Global Error Handled]", err);
  const isProd = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
  res.status(err.status || 500).json({ 
    error: isProd ? "Internal Server Error" : (err.message || "Internal Server Error"),
    ...(isProd ? {} : { details: typeof err === 'object' ? err : String(err) })
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

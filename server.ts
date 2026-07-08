import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import apiRoutes from "./server/routes";

dotenv.config();

export const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Mount all modularized API routes
app.use("/api", apiRoutes);

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

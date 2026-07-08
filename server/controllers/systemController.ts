import os from "os";
import { cloudinary } from "../services/cloudinary";

export const getSystemStats = async (req: any, res: any) => {
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
};

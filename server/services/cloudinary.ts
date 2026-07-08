import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

let cloudNameEnv = (process.env.VITE_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME || '').trim();
let apiKeyEnv = (process.env.CLOUDINARY_API_KEY || '').trim();
let apiSecretEnv = (process.env.CLOUDINARY_API_SECRET || '').trim();

// Filter out "your_" placeholders
if (cloudNameEnv.includes('your_')) cloudNameEnv = '';
if (apiKeyEnv.includes('your_')) apiKeyEnv = '';
if (apiSecretEnv.includes('your_')) apiSecretEnv = '';

if (!cloudNameEnv || !apiKeyEnv || !apiSecretEnv) {
  console.error("CRITICAL ERROR: Cloudinary credentials are not properly configured in environment variables. Refusing to start.");
  process.exit(1);
}

export const CLOUD_NAME = cloudNameEnv;
export const CLOUDINARY_API_KEY = apiKeyEnv;
export const CLOUDINARY_API_SECRET = apiSecretEnv;

cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET
});

// Delete resources from Cloudinary
export async function deleteCloudinaryImage(url: string) {
  try {
    const parts = url.split('/');
    if (parts.length < 2) return false;
    const versionIndex = parts.findIndex(p => p.startsWith('v') && !isNaN(parseInt(p.substring(1))));
    
    // Extract everything after version index (or fallback if no version)
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

export { cloudinary };

import { supabase } from './supabase';

const compressImage = async (file: File): Promise<File> => {
  if (!file.type?.startsWith("image/")) return file;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          if (width > height) {
            height = Math.round((height *= MAX_WIDTH / width));
            width = MAX_WIDTH;
          } else {
            width = Math.round((width *= MAX_HEIGHT / height));
            height = MAX_HEIGHT;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return resolve(file);
        }
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) return resolve(file);
            const compressedFile = new File([blob], file.name, {
              type: "image/jpeg",
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          "image/jpeg",
          0.8,
        );
      };
      img.onerror = () => resolve(file); // fallback to original
    };
    reader.onerror = () => resolve(file);
  });
};

export const uploadToCloudinary = async (file: File, folder: string) => {
;
;

  const isImage =
    file.type?.startsWith("image/") &&
    !file.name.match(/\.(glb|gltf|fbx|obj)$/i);
    
;
  
  const processedFile = isImage ? await compressImage(file) : file;
;

  // Decide resource_type
  let resourceType = "auto"; // Cloudinary can auto-detect mostly, but for 3D models 'raw' or 'auto' works. Let's use 'auto' or 'image' for images.
  if (!isImage) {
    if (file.name.match(/\.(glb|gltf|fbx|obj|zip)$/i)) resourceType = "raw";
    else if (file.type?.startsWith("video/")) resourceType = "video";
  } else {
    resourceType = "image";
  }
  
;

  // Try signed upload first
  try {
    const sigURL = `/api/cloudinary-signature?folder=${encodeURIComponent(folder || "avatars")}`;
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const sigResponse = await fetch(sigURL, {
      headers: {
        ...(token ? { "Authorization": `Bearer ${token}` } : {})
      }
    });
    
;
    
    if (sigResponse.ok) {
      const sigData = await sigResponse.json();
;
      
      if (sigData && sigData.signature) {
        console.log(
          `[Cloudinary Diagnostics] Realizando subida firmada mediante backend a cloud_name: ${sigData.cloud_name}...`
        );
        const formData = new FormData();
        formData.append("file", processedFile);
        formData.append("api_key", sigData.api_key);
        formData.append("timestamp", sigData.timestamp.toString());
        formData.append("signature", sigData.signature);
        formData.append("folder", sigData.folder);

        const signedUploadURL = `https://api.cloudinary.com/v1_1/${sigData.cloud_name}/${resourceType}/upload`;
;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        
;
        const startTime = Date.now();
        
        try {
          const uploadResponse = await fetch(signedUploadURL, {
            method: "POST",
            body: formData,
            signal: controller.signal
          });
          clearTimeout(timeoutId);
;
;

          if (uploadResponse.ok) {
            const resJson = await uploadResponse.json();
            console.log(
              `[Cloudinary Diagnostics] Subida firmada exitosa, JSON de respuesta completo:`,
              resJson
            );
            return resJson;
          } else {
            const errData = await uploadResponse.json();
            console.warn(
              `[Cloudinary Diagnostics] Intento de subida firmada falló (status ${uploadResponse.status}), JSON:`,
              errData,
            );
          }
        } catch (fetchErr: any) {
           clearTimeout(timeoutId);
           if (fetchErr.name === 'AbortError') {
               console.error(`[Cloudinary Diagnostics] Timeout de 30 segundos alcanzado durante fetch() firmado!`);
               throw new Error("Cloudinary request timeout");
           }
           console.error(`[Cloudinary Diagnostics] fetchErr en subida firmada:`, fetchErr);
           throw fetchErr;
        }
      } else {
        console.warn(`[Cloudinary Diagnostics] sigResponse ok pero no hubo firma:`, sigData);
      }
    } else {
      console.warn(`[Cloudinary Diagnostics] sigResponse NOT ok: ${sigResponse.statusText}`);
    }
  } catch (sigErr) {
    console.warn(
      `[Cloudinary Diagnostics] throw catch al obtener firma del backend:`,
      sigErr,
    );
  }

  // Fallback to unsigned upload
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "dnpnmhmht";
  const uploadPreset =
    import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "nexus_unsigned";
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

  console.log(
    `[Cloudinary Diagnostics] Realizando subida no firmada para ${file.name}. Endpoint final Cloudinary: ${url}, cloudName utilizado: ${cloudName}, uploadPreset utilizado: ${uploadPreset}, resourceType: ${resourceType}`
  );
  const formData = new FormData();
  formData.append("file", processedFile);
  formData.append("upload_preset", uploadPreset);
  if (folder) {
    formData.append("folder", folder);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  
;
  const startTime = Date.now();

  try {
    const uploadResponse = await fetch(url, {
      method: "POST",
      body: formData,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
;
;

    if (!uploadResponse.ok) {
      let errData: any;
      try {
        errData = await uploadResponse.json();
      } catch(e) {
        errData = await uploadResponse.text();
      }
      const errorMsg = errData?.error?.message || (typeof errData === 'string' ? errData : "Error al subir a Cloudinary");
      console.error("[Cloudinary Diagnostics] Unsigned Upload Error Details JSON/Text:", errData);
      const error: any = new Error(`Cloudinary Error HTTP ${uploadResponse.status}: ${errorMsg}`);
      error.diagnostic = { cloudName, uploadPreset, url, status: uploadResponse.status, statusText: uploadResponse.statusText, json: errData, route: "unsigned" };
      throw error;
    }

    const json = await uploadResponse.json();
;
    return json;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
       console.error(`[Cloudinary Diagnostics] Timeout de 30 segundos alcanzado durante fetch() no firmado!`);
       const errToThrow: any = new Error("Cloudinary request timeout");
       errToThrow.diagnostic = { timeout: true, route: "unsigned", cloudName, uploadPreset, url };
       throw errToThrow;
    }
    console.error(`[Cloudinary Diagnostics] Error devuelto por catch completo para ${file.name}:`, err);
    if (!err.diagnostic) {
       err.diagnostic = { route: "unsigned catch", message: err.message, cloudName, uploadPreset, url };
    }
    throw err;
  }
};

export const deleteFromCloudinary = async (publicId: string) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const response = await fetch("/api/delete-image", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ public_id: publicId }),
    });
    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error("Error deleting from Cloudinary:", error);
    return false;
  }
};

export const deleteFolderFromCloudinary = async (folder: string) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    
    const response = await fetch("/api/delete-folder", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ folder }),
    });
    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error("Error deleting folder from Cloudinary:", error);
    return false;
  }
};

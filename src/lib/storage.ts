import { supabase } from "./supabase";

export interface UploadProgressEvent {
  loaded: number;
  total: number;
  speed: number; // bytes per second
}

export const uploadToSupabaseWithProgress = async (
  file: File,
  folder: string,
  onProgress: (event: UploadProgressEvent) => void
): Promise<{ path: string; url: string }> => {
  return new Promise(async (resolve, reject) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.user) {
        throw new Error("Debes iniciar sesión para subir activos.");
      }
      const token = sessionData.session.access_token;
      const userId = sessionData.session.user.id;

      // Extract Supabase URL from the initialized client
      // Try to get it from environment variables
      const envUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!envUrl) {
         throw new Error("VITE_SUPABASE_URL no está configurado.");
      }

      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${userId}/${folder}/${fileName}`;

      const uploadUrl = `${envUrl}/storage/v1/object/studio-assets/${filePath}`;

      const xhr = new XMLHttpRequest();
      let startTime = Date.now();
      let lastLoaded = 0;

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const currentTime = Date.now();
          const elapsed = (currentTime - startTime) / 1000; // in seconds
          const loadedDiff = event.loaded - lastLoaded;
          // Only calculate speed if time elapsed is > 0
          const speed = elapsed > 0 ? (event.loaded / elapsed) : 0;
          
          onProgress({
            loaded: event.loaded,
            total: event.total,
            speed: speed,
          });
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const { data: publicUrlData } = supabase.storage
              .from("studio-assets")
              .getPublicUrl(filePath);

            resolve({
              path: filePath,
              url: publicUrlData.publicUrl,
            });
          } catch (e: any) {
            reject(new Error(`Error obteniendo URL pública: ${e.message}`));
          }
        } else {
          let errMsg = `Error HTTP ${xhr.status}`;
          try {
            const res = JSON.parse(xhr.responseText);
            errMsg = res.message || res.error || errMsg;
          } catch(e) {}
          reject(new Error(errMsg));
        }
      };

      xhr.onerror = () => {
        reject(new Error("Error de red durante la subida a Storage."));
      };
      
      xhr.onabort = () => {
        reject(new Error("Subida cancelada por el usuario."));
      }

      xhr.open("POST", uploadUrl, true);
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
      xhr.send(file);
    } catch (e) {
      reject(e);
    }
  });
};

export const deleteAssetFromStorage = async (path: string) => {
  const { error } = await supabase.storage.from("studio-assets").remove([path]);
  if (error) {
    throw new Error(`Storage Delete Error: ${error.message}`);
  }
};

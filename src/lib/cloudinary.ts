const compressImage = async (file: File): Promise<File> => {
  if (!file.type.startsWith("image/")) return file;

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
  const isImage =
    file.type.startsWith("image/") &&
    !file.name.match(/\.(glb|gltf|fbx|obj)$/i);
  const processedFile = isImage ? await compressImage(file) : file;

  // Decide resource_type
  let resourceType = "auto"; // Cloudinary can auto-detect mostly, but for 3D models 'raw' or 'auto' works. Let's use 'auto' or 'image' for images.
  if (!isImage) {
    if (file.name.match(/\.(glb|gltf|fbx|obj|zip)$/i)) resourceType = "raw";
    else if (file.type.startsWith("video/")) resourceType = "video";
  } else {
    resourceType = "image";
  }

  // Try signed upload first
  try {
    const sigResponse = await fetch(
      `/api/cloudinary-signature?folder=${encodeURIComponent(folder || "avatars")}`,
    );
    if (sigResponse.ok) {
      const sigData = await sigResponse.json();
      if (sigData && sigData.signature) {
        console.log(
          "[Cloudinary] Realizando subida firmada mediante backend...",
        );
        const formData = new FormData();
        formData.append("file", processedFile);
        formData.append("api_key", sigData.api_key);
        formData.append("timestamp", sigData.timestamp.toString());
        formData.append("signature", sigData.signature);
        formData.append("folder", sigData.folder);

        const uploadResponse = await fetch(
          `https://api.cloudinary.com/v1_1/${sigData.cloud_name}/${resourceType}/upload`,
          {
            method: "POST",
            body: formData,
          },
        );

        if (uploadResponse.ok) {
          const resJson = await uploadResponse.json();
          console.log(
            "[Cloudinary] Subida firmada exitosa:",
            resJson.secure_url || resJson.url,
          );
          return resJson;
        } else {
          const errData = await uploadResponse.json();
          console.warn(
            "[Cloudinary] Intento de subida firmada falló, reintentando de forma no firmada...",
            errData,
          );
        }
      }
    }
  } catch (sigErr) {
    console.warn(
      "[Cloudinary] No se pudo obtener firma del backend, usando fallback no firmado:",
      sigErr,
    );
  }

  // Fallback to unsigned upload
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "dnpnmhmht";
  const uploadPreset =
    import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "nexus_unsigned";

  console.log(
    "[Cloudinary] Realizando subida no firmada usando preset:",
    uploadPreset,
  );
  const formData = new FormData();
  formData.append("file", processedFile);
  formData.append("upload_preset", uploadPreset);
  if (folder) {
    formData.append("folder", folder);
  }

  const uploadResponse = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
    {
      method: "POST",
      body: formData,
    },
  );

  if (!uploadResponse.ok) {
    const errData = await uploadResponse.json();
    const errorMsg = errData.error?.message || "Error al subir a Cloudinary";
    console.error("Cloudinary Unsigned Upload Error Details:", errData);
    throw new Error(errorMsg);
  }

  return await uploadResponse.json();
};

export const deleteFromCloudinary = async (publicId: string) => {
  try {
    const response = await fetch("/api/delete-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
    const response = await fetch("/api/delete-folder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folder }),
    });
    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error("Error deleting folder from Cloudinary:", error);
    return false;
  }
};

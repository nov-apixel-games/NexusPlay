
const compressImage = async (file: File): Promise<File> => {
  if (!file.type.startsWith('image/')) return file;
  
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

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(file);
        }
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (!blob) return resolve(file);
          const compressedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        }, 'image/jpeg', 0.8);
      };
      img.onerror = () => resolve(file); // fallback to original
    };
    reader.onerror = () => resolve(file);
  });
};

export const uploadToCloudinary = async (file: File, folder: string) => {
  // Compress image before upload logic
  const processedFile = await compressImage(file);
  
  // 1. Get signature from server
  const sigResponse = await fetch(`/api/cloudinary-signature?folder=${encodeURIComponent(folder)}`);
  if (!sigResponse.ok) throw new Error("No se pudo obtener la firma de Cloudinary");
  const { signature, timestamp, cloud_name, api_key } = await sigResponse.json();

  // 2. Upload directly to Cloudinary
  const formData = new FormData();
  formData.append('file', processedFile);
  formData.append('signature', signature);
  formData.append('timestamp', timestamp.toString());
  formData.append('api_key', api_key);
  formData.append('folder', folder);

  const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${cloud_name}/auto/upload`, {
    method: 'POST',
    body: formData
  });

  if (!uploadResponse.ok) {
    const errData = await uploadResponse.json();
    const errorMsg = errData.error?.message || "Error al subir a Cloudinary";
    console.error("Cloudinary Upload Error Details:", {
      status: uploadResponse.status,
      error: errData.error,
      cloud_name
    });
    throw new Error(errorMsg);
  }

  return await uploadResponse.json();
};

export const deleteFromCloudinary = async (publicId: string) => {
  try {
    const response = await fetch('/api/delete-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ public_id: publicId })
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
    const response = await fetch('/api/delete-folder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder })
    });
    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error("Error deleting folder from Cloudinary:", error);
    return false;
  }
};

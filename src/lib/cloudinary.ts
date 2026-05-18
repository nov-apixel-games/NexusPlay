
export const uploadToCloudinary = async (file: File, folder: string) => {
  // 1. Get signature from server
  const sigResponse = await fetch(`/api/cloudinary-signature?folder=${encodeURIComponent(folder)}`);
  if (!sigResponse.ok) throw new Error("No se pudo obtener la firma de Cloudinary");
  const { signature, timestamp, cloud_name, api_key } = await sigResponse.json();

  // 2. Upload directly to Cloudinary
  const formData = new FormData();
  formData.append('file', file);
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

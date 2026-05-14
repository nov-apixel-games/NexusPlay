export async function uploadToCloudinary(file: File, subFolder: string = ''): Promise<{ url: string, public_id: string }> {
  const cloudName = 'dnpnmhmht';
  const uploadPreset = 'Iconos y capturas';
  
  // Limpiamos el nombre de la carpeta para evitar problemas
  const sanitizedFolder = subFolder.replace(/[^a-zA-Z0-9_/]/g, '_');
  const folderPath = sanitizedFolder ? `nexus_app/${sanitizedFolder}` : 'nexus_app';

  console.log(`[Cloudinary] Subiendo a: ${cloudName} | Folder: "${folderPath}"`);

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', folderPath);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const msg = errorData.error?.message || '';
      console.error("Error Detallado:", errorData);
      
      if (msg.includes('cloud_name') || response.status === 404) {
        throw new Error(`⚠️ NUBE NO VÁLIDA: El Cloud Name "dnpnmhmht" no parece correcto.`);
      }

      if (msg.includes('preset') || response.status === 400) {
        throw new Error(`⚠️ PRESET NO VÁLIDO: Cloudinary no encuentra "${uploadPreset}". 
          \nAsegúrate de que se llame exactamente así y sea 'UNSIGNED'.`);
      }
      
      throw new Error(msg || "Error en la subida a Cloudinary");
    }

    const data = await response.json();
    return { 
      url: data.secure_url, 
      public_id: data.public_id 
    };
  } catch (error: any) {
    console.error("Fallo en la subida directa:", error);
    throw error;
  }
}

export async function deleteFromCloudinary(publicId: string): Promise<boolean> {
  console.log(`[Frontend] Solicitando eliminación segura de: ${publicId}`);
  
  try {
    const response = await fetch('/api/delete-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ public_id: publicId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Error al eliminar de Cloudinary via Backend:", errorData);
      return false;
    }

    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error("Error de comunicación con el backend para eliminar:", error);
    return false;
  }
}

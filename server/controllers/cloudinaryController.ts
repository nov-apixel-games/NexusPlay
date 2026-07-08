import { cloudinary, CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } from "../services/cloudinary";

export const getCloudinarySignature = (req: any, res: any) => {
  try {
    if (!CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
      console.error("[Backend] Cloudinary no está configurado (faltan variables de entorno)");
      return res.status(500).json({ error: "Cloudinary no está configurado en el servidor" });
    }

    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = req.query.folder as string || 'NexusStore/general';
    
    console.log(`[Cloudinary Signature] Generating for folder: "${folder}", timestamp: ${timestamp}`);

    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder },
      CLOUDINARY_API_SECRET
    );

    console.log(`[Cloudinary Signature] Generated: ${signature}`);

    res.json({
      signature,
      timestamp,
      cloud_name: CLOUD_NAME,
      api_key: CLOUDINARY_API_KEY,
      folder
    });
  } catch (error: any) {
    console.error("[Cloudinary Signature Error]", error);
    res.status(500).json({ error: error.message });
  }
};

export const deleteImage = async (req: any, res: any) => {
  const { public_id } = req.body;
  
  if (!public_id) {
    return res.status(400).json({ error: "No public_id provided" });
  }

  try {
    console.log(`[Backend] Deleting image: ${public_id}`);
    const result = await cloudinary.uploader.destroy(public_id);
    
    if (result.result === 'ok' || result.result === 'not found') {
      res.json({ success: true, result: result.result });
    } else {
      res.status(500).json({ success: false, result: result.result });
    }
  } catch (error: any) {
    console.error("[Backend] Cloudinary Delete Error:", error);
    res.status(500).json({ error: error.message || "Failed to delete from Cloudinary" });
  }
};

export const deleteFolder = async (req: any, res: any) => {
  const { folder } = req.body;
  
  if (!folder) {
    return res.status(400).json({ error: "No folder provided" });
  }

  try {
    console.log(`[Backend] Deleting all resources in folder: ${folder}`);
    await cloudinary.api.delete_resources_by_prefix(folder);
    
    try {
      await cloudinary.api.delete_folder(folder + "/icono");
      await cloudinary.api.delete_folder(folder + "/screenshots");
      await cloudinary.api.delete_folder(folder);
    } catch (e) {
      // Ignore
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error("[Backend] Cloudinary Folder Delete Error:", error);
    res.status(500).json({ error: error.message || "Failed to delete folder from Cloudinary" });
  }
};

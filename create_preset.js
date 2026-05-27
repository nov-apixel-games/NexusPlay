import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: 'dnpnmhmht',
  api_key: '719435337158523',
  api_secret: 'NTAKR4xesWwzwm74bY-TNwwp6To'
});

async function main() {
  try {
    const preset = await cloudinary.api.create_upload_preset({
      name: "nexus_unsigned",
      unsigned: true,
      folder: "nexus_uploads",
      allowed_formats: "jpg,png,jpeg,gif,webp"
    });
    console.log("Preset created:", preset);
  } catch (err) {
    if (err.error?.message?.includes("already exists")) {
       console.log("Preset already exists. Enabling unsigned...");
       await cloudinary.api.update_upload_preset("nexus_unsigned", { unsigned: true });
       console.log("Updated.");
    } else {
       console.error("Error creating preset:", err);
    }
  }
}
main();

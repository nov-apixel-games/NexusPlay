import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: 'dnpnmhmht',
  api_key: '719435337158523',
  api_secret: 'NTAKR4xesWwzwm74bY-TNwwp6To'
});

cloudinary.uploader.upload("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", { folder: "test_upload" })
  .then(res => console.log("Success:", res.secure_url))
  .catch(err => console.error("Error:", err));

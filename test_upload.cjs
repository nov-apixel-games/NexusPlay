const https = require('https');

async function run() {
  const payload = new URLSearchParams();
  payload.append('file', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=');
  payload.append('upload_preset', 'nexus_unsigned');
  
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  if (!cloudName) { console.error('Set CLOUDINARY_CLOUD_NAME env var'); process.exit(1); }
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: payload // uses form-urlencoded
  });
  console.log(res.status, await res.text());
}
run();

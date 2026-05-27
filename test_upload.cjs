const https = require('https');

async function run() {
  const payload = new URLSearchParams();
  payload.append('file', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=');
  payload.append('upload_preset', 'nexus_unsigned');
  
  const res = await fetch('https://api.cloudinary.com/v1_1/dnpnmhmht/image/upload', {
    method: 'POST',
    body: payload // uses form-urlencoded
  });
  console.log(res.status, await res.text());
}
run();

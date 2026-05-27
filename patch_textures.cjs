const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'views', 'GameStudioEditor3D.tsx');
let code = fs.readFileSync(filePath, 'utf8');

const newTextures = `
  } else if (type === 'dirt') {
    ctx.fillStyle = '#78350f';
    ctx.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 300; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? '#451a03' : '#92400e';
      ctx.fillRect(Math.random() * 128, Math.random() * 128, 2, 2);
    }
    createNoise(0.12);
  } else if (type === 'sand') {
    ctx.fillStyle = '#fde047';
    ctx.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 400; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? '#fef08a' : '#d97706';
      ctx.globalAlpha = 0.5;
      ctx.fillRect(Math.random() * 128, Math.random() * 128, 1.5, 1.5);
    }
    ctx.globalAlpha = 1.0;
    createNoise(0.08);
  } else if (type === 'snow') {
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 128, 128);
    ctx.fillStyle = '#e2e8f0';
    for (let i = 0; i < 50; i++) {
       ctx.beginPath();
       ctx.arc(Math.random() * 128, Math.random() * 128, Math.random() * 15 + 5, 0, Math.PI * 2);
       ctx.fill();
    }
    createNoise(0.05);
  } else if (type === 'concrete') {
    ctx.fillStyle = '#64748b';
    ctx.fillRect(0, 0, 128, 128);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    for (let i = 0; i < 20; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * 128, Math.random() * 128);
      ctx.lineTo(Math.random() * 128, Math.random() * 128);
      ctx.stroke();
    }
    createNoise(0.15);
`;

code = code.replace("  } else if (type === 'lava') {", newTextures + "\n  } else if (type === 'lava') {");

fs.writeFileSync(filePath, code, 'utf8');
console.log("Added new textures");

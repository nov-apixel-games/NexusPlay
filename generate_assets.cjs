const fs = require('fs');
const { createCanvas } = require('canvas');

function generateImage(width, height, text, filename) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#0f172a'; // slate-900
  ctx.fillRect(0, 0, width, height);

  // Text
  ctx.fillStyle = '#22d3ee'; // cyan-400
  ctx.font = `bold ${width / 5}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, width / 2, height / 2);

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filename, buffer);
  console.log(`Generated ${filename}`);
}

if (!fs.existsSync('assets')) {
  fs.mkdirSync('assets');
}

generateImage(1024, 1024, 'NX', 'assets/icon.png');
generateImage(2732, 2732, 'NexusPlay', 'assets/splash.png');

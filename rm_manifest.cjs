const fs = require('fs');
if (fs.existsSync('./public/manifest.json')) fs.unlinkSync('./public/manifest.json');
if (fs.existsSync('./public/sw.js')) fs.unlinkSync('./public/sw.js');

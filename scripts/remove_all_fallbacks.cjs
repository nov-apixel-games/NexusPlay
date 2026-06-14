const fs = require('fs');

function processFile(path) {
  let c = fs.readFileSync(path, 'utf8');
  c = c.replace(/ \|\| '.*?'/g, '');
  c = c.replace(/ \|\| ".*?"/g, '');
  fs.writeFileSync(path, c);
}

processFile('src/components/AuthModal.tsx');
processFile('src/components/views/LegalViews.tsx');
processFile('src/components/AppUploadForm.tsx');
processFile('src/components/NexusHub.tsx');
processFile('src/components/AppGrid.tsx');
processFile('src/App.tsx');

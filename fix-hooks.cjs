const fs = require('fs');

const files = [
  'src/components/views/MainViews.tsx',
  'src/components/views/NexusStudio/components/BottomPanel.tsx',
  'src/components/views/SettingsView.tsx',
  'src/components/Navbar.tsx',
  'src/components/PublishingWizard.tsx',
  'src/components/AppUploadForm.tsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    // Replace arrow functions
    content = content.replace(/(const [A-Za-z0-9_]+ = \([^)]*\)(?:[:A-Za-z0-9_<> ]+)? => \{\n)  const \{ t \} = useAppStore\(\);\n\n?/g, '$1');
    fs.writeFileSync(file, content, 'utf8');
  }
});

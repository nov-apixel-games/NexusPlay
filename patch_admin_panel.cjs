const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

// Add Security to menu
content = content.replace(
  "{ id: 'settings', label: t('admin.tabSettings') || 'Configuración', icon: Settings },",
  "{ id: 'settings', label: t('admin.tabSettings') || 'Configuración', icon: Settings },\n    { id: 'security', label: 'Seguridad del Panel', icon: ShieldAlert },"
);

// We need to make sure ShieldAlert is imported
if (!content.includes('ShieldAlert')) {
  content = content.replace('import { \n  Shield,', 'import { \n  Shield, ShieldAlert,');
  // fallback if format is different
  if (!content.includes('ShieldAlert')) {
      content = content.replace('import {', 'import { ShieldAlert,');
  }
}

fs.writeFileSync('src/components/AdminPanel.tsx', content);

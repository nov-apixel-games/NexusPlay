const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

if (!content.includes('./admin/AdminSecurity')) {
  content = content.replace(
    "import { useAppStore } from '../store/useAppStore';",
    "import { useAppStore } from '../store/useAppStore';\nimport { AdminSecurity } from './admin/AdminSecurity';"
  );
}

fs.writeFileSync('src/components/AdminPanel.tsx', content);

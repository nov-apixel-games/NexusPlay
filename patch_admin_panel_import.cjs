const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

// Add import
if (!content.includes('AdminSecurity')) {
  content = content.replace(
    "import { AdminSettings, AdminAI, AdminNotifications, AdminDatabaseTools} from './admin/AdminViews2';",
    "import { AdminSettings, AdminAI, AdminNotifications, AdminDatabaseTools} from './admin/AdminViews2';\nimport { AdminSecurity } from './admin/AdminSecurity';"
  );
}

// Add the tab render logic
if (!content.includes("activeTab === 'security'")) {
  const settingsTab = `           {activeTab === 'settings' && (`;
  const securityTab = `           {activeTab === 'security' && (
             <AdminSecurity addToast={addToast} />
           )}
           
           {activeTab === 'settings' && (`
  content = content.replace(settingsTab, securityTab);
}

fs.writeFileSync('src/components/AdminPanel.tsx', content);

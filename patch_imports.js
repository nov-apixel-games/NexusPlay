const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminViews2.tsx', 'utf8');

// Ensure Clock and Trash are imported
let lines = code.split('\n');
let modified = false;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("from 'lucide-react'") && !lines[i].includes(" Trash")) {
     lines[i] = lines[i].replace("} from 'lucide-react'", ", Trash, Clock } from 'lucide-react'");
     modified = true;
     break;
  }
}

fs.writeFileSync('src/components/admin/AdminViews2.tsx', lines.join('\n'));
console.log("Imports patched");

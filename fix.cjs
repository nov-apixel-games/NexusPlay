const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'views', 'GameStudioEditor3D.tsx');
let code = fs.readFileSync(filePath, 'utf8');

code = code.replace(
  /    \)\}\n  <\/>;/g,
  "    )}\n  </>\n  );"
);

fs.writeFileSync(filePath, code, 'utf8');
console.log("Syntax fixed!");

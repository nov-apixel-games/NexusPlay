const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'views', 'GameStudioEditor3D.tsx');
let code = fs.readFileSync(filePath, 'utf8');

code = code.replace(
  "function LevelEnvironment({ objects, mode, selectedId, setSelectedId, template, mapProps }: any) {",
  "function LevelEnvironment({ objects, setObjects, mode, selectedId, setSelectedId, template, mapProps }: any) {"
);

fs.writeFileSync(filePath, code, 'utf8');
console.log("Fixed args");

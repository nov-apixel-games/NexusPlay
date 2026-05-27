const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'views', 'GameStudioEditor3D.tsx');
let code = fs.readFileSync(filePath, 'utf8');

const targetStr = `            gravity: mapProps.gravity,
            cameraMode: mapProps.cameraMode,
            rules: mapProps.rules
          });`;

const newStr = `            gravity: mapProps.gravity,
            cameraMode: mapProps.cameraMode,
            rules: mapProps.rules,
            floorTexture: mapProps.floorTexture
          });`;

code = code.replace(targetStr, newStr);

fs.writeFileSync(filePath, code, 'utf8');
console.log("Added floorTexture to autosave");

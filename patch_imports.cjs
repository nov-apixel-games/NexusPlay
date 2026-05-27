const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'views', 'GameStudioEditor3D.tsx');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Add TransformControls to imports
code = code.replace(
  /import \{ Sky, Text, Box, Sphere, Cylinder, OrbitControls, Grid \} from '@react-three\/drei';/,
  "import { Sky, Text, Box, Sphere, Cylinder, OrbitControls, Grid, TransformControls } from '@react-three/drei';"
);

fs.writeFileSync(filePath, code, 'utf8');
console.log("Import patch completed!");

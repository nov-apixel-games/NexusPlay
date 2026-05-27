const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'views', 'GameStudioEditor3D.tsx');
let code = fs.readFileSync(filePath, 'utf8');

code = code.replace(
  `onClick={() => alert("Función de elevar terreno webgl en desarrollo.")}`,
  `onClick={() => setObjects([...objects, { id: "n_"+Date.now(), type: "nature", nature_type: "mountain", position: [0, 0, 0], scale: [8, 8, 8], color: "#475569", label: "Montaña Rocosa" }])}`
);

code = code.replace(
  `onClick={() => alert("Función de suavizar terreno webgl en desarrollo.")}`,
  `onClick={() => setObjects(objects.filter(o => o.nature_type !== 'mountain'))}`
);

fs.writeFileSync(filePath, code, 'utf8');
console.log("Mountain functions mapped!");

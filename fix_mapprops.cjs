const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'views', 'GameStudioEditor3D.tsx');
let code = fs.readFileSync(filePath, 'utf8');

// Replace function signatures to include mapProps
code = code.replace(
  /function PlayerController\(\{ spawn, walls, template \}: any\) \{/g,
  "function PlayerController({ spawn, walls, template, mapProps }: any) {"
);

code = code.replace(
  /function PlayerWeapon\(\) \{/,
  "function PlayerWeapon({ mapProps, template }: any) {"
);

// We need to pass mapProps in GameStudioEditor3D return
code = code.replace(
  /<PlayerWeapon \/>/g,
  "<PlayerWeapon mapProps={mapProps} template={initialTemplate} />"
);

code = code.replace(
  /<PlayerController \n                  spawn=\{objects\.find\(o => o\.type === 'spawn'\)\?\.position \|\| \[0,0,0\]\} \n                  walls=\{objects\.filter\(o => o\.type === 'wall'\)\} \n                  template=\{initialTemplate\}\n                \/>/g,
  `<PlayerController 
                  spawn={objects.find((o: any) => o.type === 'spawn')?.position || [0,0,0]} 
                  walls={objects.filter((o: any) => o.type === 'wall')} 
                  template={initialTemplate}
                  mapProps={mapProps}
                />`
);

// GameplayPhysicsStep
code = code.replace(
  /function GameplayPhysicsStep\(\{ template \}: any\) \{/g,
  "function GameplayPhysicsStep({ template, mapProps }: any) {"
);

code = code.replace(
  /<GameplayPhysicsStep template=\{initialTemplate\} \/>/g,
  "<GameplayPhysicsStep template={initialTemplate} mapProps={mapProps} />"
);

// GameplayTriggers
code = code.replace(
  /function GameplayTriggers\(\{ objects, template \}: any\) \{/g,
  "function GameplayTriggers({ objects, template, mapProps }: any) {"
);

code = code.replace(
  /<GameplayTriggers objects=\{objects\} template=\{initialTemplate\} \/>/g,
  "<GameplayTriggers objects={objects} template={initialTemplate} mapProps={mapProps} />"
);

// Car mode visual
code = code.replace(/const carModeVisual = \(mapProps\?\.cameraMode === 'racing' \|\| template === 'Racing 3D'\);/g, "const carModeVisual = (mapProps?.cameraMode === 'racing' || initialTemplate === 'Racing 3D');");

fs.writeFileSync(filePath, code, 'utf8');
console.log("Fixed mapProps arguments");

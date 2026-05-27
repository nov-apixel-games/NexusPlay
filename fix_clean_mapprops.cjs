const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'views', 'GameStudioEditor3D.tsx');
let code = fs.readFileSync(filePath, 'utf8');

// Use exact string replacements instead of regex for function declaration
code = code.replace(
  "function EnemiesManager({ enemiesData, template }: any) {",
  "function EnemiesManager({ enemiesData, template, mapProps }: any) {"
);

code = code.replace(
  "<EnemiesManager enemiesData={objects.filter((o: any) => o.type === 'enemy')} template={initialTemplate} />",
  "<EnemiesManager enemiesData={objects.filter((o: any) => o.type === 'enemy')} template={initialTemplate} mapProps={mapProps} />"
);

code = code.replace(
  "function FloatingPickups({ pickupsData, template }: any) {",
  "function FloatingPickups({ pickupsData, template, mapProps }: any) {"
);

code = code.replace(
  "<FloatingPickups pickupsData={objects.filter((o: any) => o.type === 'pickup')} template={initialTemplate} />",
  "<FloatingPickups pickupsData={objects.filter((o: any) => o.type === 'pickup')} template={initialTemplate} mapProps={mapProps} />"
);

// We need to fix NeonSportsCar, wait let's check its definition
code = code.replace(
  "function NeonSportsCar({ position, rotationY }: any) {",
  "function NeonSportsCar({ position, rotationY, mapProps }: any) {"
);

// We made a typo with mapProps passing before:
code = code.replace(
  "<NeonSportsCar position={playState.carPosition} rotationY={playState.carRotationY} mapProps={mapProps} />",
  "<NeonSportsCar position={playState.carPosition} rotationY={playState.carRotationY} />"
); // Revert the previous mapProps passing error since NeonSportsCar doesn't need it!
// Oh wait, did we add mapProps inside NeonSportsCar? Let's check lines 1269.
code = code.replace(
  "const targetPos = (mapProps?.cameraMode === 'racing' || template === 'Racing 3D') ? playState.carPosition : camera.position;",
  "const targetPos = (mapProps?.cameraMode === 'racing' || template === 'Racing 3D') ? playState.carPosition : camera.position;"
);


// To fix ANY missing mapProps, let's just globally replace mapProps?.cameraMode inside functions that don't have it.
code = code.replace(
  /mapProps\?\.cameraMode === 'racing'/g,
  "(typeof mapProps !== 'undefined' && mapProps?.cameraMode === 'racing')"
);

code = code.replace(
  /mapProps\?\.cameraMode === 'fps'/g,
  "(typeof mapProps !== 'undefined' && mapProps?.cameraMode === 'fps')"
);

code = code.replace(
  /mapProps\?\.cameraMode === 'platformer'/g,
  "(typeof mapProps !== 'undefined' && mapProps?.cameraMode === 'platformer')"
);

fs.writeFileSync(filePath, code, 'utf8');
console.log("Fixed missing mapProps args cleanly!");

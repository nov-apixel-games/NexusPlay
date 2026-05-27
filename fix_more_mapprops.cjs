const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'views', 'GameStudioEditor3D.tsx');
let code = fs.readFileSync(filePath, 'utf8');

// EnemyAIBox
code = code.replace(
  /function EnemyAIBox\(\{ enemies: enemiesData, template \}: any\) \{/,
  "function EnemyAIBox({ enemies: enemiesData, template, mapProps }: any) {"
);

code = code.replace(
  /<EnemyAIBox enemies=\{objects\.filter\(\(o: any\) => o\.type === 'enemy'\)\} template=\{initialTemplate\} \/>/,
  "<EnemyAIBox enemies={objects.filter((o: any) => o.type === 'enemy')} template={initialTemplate} mapProps={mapProps} />"
);

// ItemPickupsManager
code = code.replace(
  /function ItemPickupsManager\(\{ template \}: any\) \{/,
  "function ItemPickupsManager({ template, mapProps }: any) {"
);

code = code.replace(
  /<ItemPickupsManager template=\{initialTemplate\} \/>/,
  "<ItemPickupsManager template={initialTemplate} mapProps={mapProps} />"
);

// NeonSportsCar
code = code.replace(
  /function NeonSportsCar\(\{ position, rotationY \}: any\) \{/,
  "function NeonSportsCar({ position, rotationY, mapProps }: any) {"
);

code = code.replace(
  /<NeonSportsCar position=\{playState\.carPosition\} rotationY=\{playState\.carRotationY\} \/>/,
  "<NeonSportsCar position={playState.carPosition} rotationY={playState.carRotationY} mapProps={mapProps} />"
);

fs.writeFileSync(filePath, code, 'utf8');
console.log("Fixed missing mapProps args!");

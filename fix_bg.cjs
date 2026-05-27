const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'views', 'GameStudioEditor3D.tsx');
let code = fs.readFileSync(filePath, 'utf8');

const targetStr = `<color 
              attach="background" 
              args={[
                initialTemplate === 'Zombie Survival 3D' ? '#dcfce7' : 
                initialTemplate === 'Racing 3D' ? '#ffedd5' : 
                initialTemplate === 'Platformer 3D' ? '#e0f2fe' : 
                '#1e1b4b'
              ]} 
            />`;

const newStr = `<color 
              attach="background" 
              args={[
                mapProps?.skyPreset === 'night' ? '#090d16' : 
                mapProps?.skyPreset === 'sunset' ? '#ffedd5' : 
                mapProps?.skyPreset === 'forest' ? '#c7d2fe' : 
                mapProps?.skyPreset === 'nuclear' ? '#dcfce7' : 
                mapProps?.skyPreset === 'desert' ? '#fef08a' : 
                '#e0f2fe'
              ]} 
            />`;

code = code.replace(targetStr, newStr);

fs.writeFileSync(filePath, code, 'utf8');
console.log("Updated global background");

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'views', 'GameStudioEditor3D.tsx');
let code = fs.readFileSync(filePath, 'utf8');

const targetStr = `         if (draftId) {
            const drafts = await getGameDrafts();
            const found = drafts.find(d => d.id === draftId);
            if (found && found.objects && found.objects.length > 0) {
               setObjects(found.objects);
               return;
            }
         }`;

const newStr = `         if (draftId) {
            const drafts = await getGameDrafts();
            const found = drafts.find(d => d.id === draftId);
            if (found && found.objects && found.objects.length > 0) {
               setObjects(found.objects);
               const savedMapConfig = found.objects.find((o: any) => o.type === "map_config");
               if (savedMapConfig) {
                  setMapProps({
                     skyPreset: savedMapConfig.skyPreset,
                     ambientColor: savedMapConfig.ambientColor,
                     fogColor: savedMapConfig.fogColor,
                     fogDensity: savedMapConfig.fogDensity,
                     waterLevel: savedMapConfig.waterLevel,
                     gravity: savedMapConfig.gravity,
                     cameraMode: savedMapConfig.cameraMode,
                     rules: savedMapConfig.rules || [],
                     floorTexture: savedMapConfig.floorTexture || 'grid'
                  });
               }
               return;
            }
         }`;

code = code.replace(targetStr, newStr);

fs.writeFileSync(filePath, code, 'utf8');
console.log("Restores mapProps correctly from DB!");

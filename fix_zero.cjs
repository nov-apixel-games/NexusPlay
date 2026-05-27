const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'views', 'GameStudioEditor3D.tsx');
let code = fs.readFileSync(filePath, 'utf8');

const targetStr = `             setObjects([
                { id: 'spawn', type: 'spawn', position: [0, 0, 15], scale: [1, 1, 1], color: '#22d3ee' },
                { id: 'guide_companion', type: 'npc', npc_name: 'Creador Compañero', npc_dialog: 'Haz click en "BIOMA" o "SCRIPTING" en el sidebar para empezar a dar vida visual a tu mapa desde cero.', position: [0, 0, 5], scale: [1, 1, 1], color: '#a21caf' },
                { id: 'starter_wall', type: 'wall', position: [0, 2, -5], scale: [8, 4, 1], color: '#1e293b', texture_style: 'grid', shape: 'cube' },
                { id: 'starter_checkpoint', type: 'checkpoint', position: [5, 0, -5], scale: [1, 1, 1], color: '#10b981' },
             ]);`;

const newStr = `             setObjects([
                { id: 'spawn', type: 'spawn', position: [0, 0, 15], scale: [1, 1, 1], color: '#22d3ee' },
                { id: 'guide_companion', type: 'npc', npc_name: 'Creador Compañero', npc_dialog: 'Bienvenido. Estás en un lienzo vacío. Añade luces, montañas rústicas, o crea un mundo FPS completo.', position: [0, 0, 5], scale: [1, 1, 1], color: '#a21caf' },
                { id: 'pine1', type: 'nature', nature_type: 'tree', position: [-8, 0, 2], scale: [1.2, 1.2, 1.2], color: '#166534' },
                { id: 'pine2', type: 'nature', nature_type: 'tree', position: [12, 0, -8], scale: [1.3, 1.3, 1.3], color: '#15803d' },
                { id: 'rock1', type: 'nature', nature_type: 'rock', position: [-6, 0, -10], scale: [1.8, 1.8, 1.8], color: '#374151' },
                { id: 'bush1', type: 'nature', nature_type: 'bush', position: [-3, 0, -1], scale: [1.0, 1.0, 1.0], color: '#10b981' },
                { id: 'starter_chest', type: 'pickup', position: [5, 1.2, -5], scale: [1, 1, 1], color: '#fbbf24' },
                { id: 'starter_wall', type: 'wall', position: [0, 1.5, -12], scale: [12, 3, 2], color: '#1e293b', texture_style: 'ruins', shape: 'cube' },
             ]);
             setMapProps(prev => ({...prev, skyPreset: 'forest'}));`;

code = code.replace(targetStr, newStr);

fs.writeFileSync(filePath, code, 'utf8');
console.log("Updated zero template");

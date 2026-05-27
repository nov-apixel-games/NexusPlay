const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'views', 'GameStudioEditor3D.tsx');
let code = fs.readFileSync(filePath, 'utf8');

// Update GameObject3D to include water
code = code.replace(
  "| 'nature' | 'npc' | 'trigger' | 'map_config' | 'vehicle';",
  "| 'nature' | 'npc' | 'trigger' | 'map_config' | 'vehicle' | 'water';"
);

// Add to prefabs UI
const newBtn = `<button onClick={() => setObjects([...objects, { id: "lake_"+Date.now(), type: "water", position: [0, 0, 0], scale: [10, 1, 10], color: "#0ea5e9", label: "Cubo de Agua" }])} className="bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 p-2 rounded-lg text-[9px] font-mono flex flex-col items-center gap-1 cursor-pointer border border-sky-500/20"><div className="w-4 h-4 mb-1 bg-sky-500/50 border border-sky-400 rounded-sm"></div> Agua</button>`;

code = code.replace(
  `<button onClick={() => setObjects([...objects, { id: "rs_"+Date.now(), type: "wall", shape: "cylinder", position: [0, 1.5, 0], scale: [1, 3, 1], color: "#fb7185", texture_style: "ruins", label: "Pedestal" }])} className="bg-white/5 hover:bg-white/10 p-2 rounded-lg text-white text-[9px] font-mono flex flex-col items-center gap-1 cursor-pointer border border-white/5"><div className="w-4 h-6 bg-rose-400 rounded-sm mb-1 rounded-t-full"></div>Cilindro</button>`,
  `<button onClick={() => setObjects([...objects, { id: "rs_"+Date.now(), type: "wall", shape: "cylinder", position: [0, 1.5, 0], scale: [1, 3, 1], color: "#fb7185", texture_style: "ruins", label: "Pedestal" }])} className="bg-white/5 hover:bg-white/10 p-2 rounded-lg text-white text-[9px] font-mono flex flex-col items-center gap-1 cursor-pointer border border-white/5"><div className="w-4 h-6 bg-rose-400 rounded-sm mb-1 rounded-t-full"></div>Cilindro</button>\n                      ` + newBtn
);

// Add to rendering loop
const targetRender = `           if (obj.type === 'vehicle') {`;
const waterRender = `           if (obj.type === 'water') {
             return (
               <mesh key={obj.id} position={obj.position} rotation={obj.rotation || [0,0,0]} scale={obj.scale} onClick={(e) => {
                 if (mode === 'edit') {
                   e.stopPropagation();
                   setSelectedId(obj.id);
                 }
               }}>
                 <boxGeometry args={[1, 1, 1]} />
                 <meshStandardMaterial color={obj.color} roughness={0.0} metalness={0.9} transparent opacity={0.65} emissive="#0284c7" emissiveIntensity={0.5} />
                 {mode === 'edit' && selectedId === obj.id && (
                   <lineSegments>
                     <edgesGeometry args={[new THREE.BoxGeometry(1.02, 1.02, 1.02)]} />
                     <lineBasicMaterial color="#22d3ee" linewidth={4} />
                   </lineSegments>
                 )}
               </mesh>
             )
           }
` + targetRender;

code = code.replace(targetRender, waterRender);

fs.writeFileSync(filePath, code, 'utf8');
console.log("Water prefabs done!");

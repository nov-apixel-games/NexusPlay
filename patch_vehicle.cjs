const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'views', 'GameStudioEditor3D.tsx');
let code = fs.readFileSync(filePath, 'utf8');

// Inject the rendering code for 'vehicle' objects in the editor view
const targetStr = `           if (obj.type === 'spawn') {
             return (
                <mesh key={obj.id} position={[obj.position[0], 0.1, obj.position[2]]} rotation={[-Math.PI/2, 0, 0]}>
                  <circleGeometry args={[1.8, 32]} />
                  <meshBasicMaterial color="#22d3ee" transparent opacity={mode === 'play' ? 0.1 : 0.65} />
                </mesh>
             );
           }`;

const vehicleStr = targetStr + `
           if (obj.type === 'vehicle') {
             return (
               <group key={obj.id} position={obj.position} rotation={obj.rotation || [0,0,0]} scale={obj.scale} onClick={(e) => {
                 if (mode === 'edit') {
                   e.stopPropagation();
                   setSelectedId(obj.id);
                 }
               }}>
                 {/* Body */}
                 <mesh position={[0, 0.4, 0]} castShadow>
                   <boxGeometry args={[1.8, 0.4, 4]} />
                   <meshStandardMaterial color={obj.color || "#ef4444"} roughness={0.3} metalness={0.7} />
                 </mesh>
                 {/* Cabin */}
                 <mesh position={[0, 0.8, -0.2]} castShadow>
                   <boxGeometry args={[1.4, 0.5, 1.8]} />
                   <meshStandardMaterial color="#1e293b" roughness={0.1} metalness={0.9} transparent opacity={0.8} />
                 </mesh>
                 {/* Selection Box */}
                 {mode === 'edit' && selectedId === obj.id && (
                   <mesh position={[0, 0.6, 0]}>
                      <boxGeometry args={[2, 1.2, 4.2]} />
                      <meshBasicMaterial color="#22d3ee" wireframe transparent opacity={0.6} />
                   </mesh>
                 )}
               </group>
             );
           }`;

code = code.replace(targetStr, vehicleStr);

fs.writeFileSync(filePath, code, 'utf8');
console.log("Vehicle object rendering added!");

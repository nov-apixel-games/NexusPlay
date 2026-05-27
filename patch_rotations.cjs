const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'views', 'GameStudioEditor3D.tsx');
let code = fs.readFileSync(filePath, 'utf8');

// For nature prefabs:
code = code.replace(
  `            if (obj.type === 'nature') {
              const natureType = obj.nature_type || 'tree';
              const color = obj.color || (natureType === 'tree' ? '#15803d' : '#64748b');
              return (
                <group key={obj.id} position={obj.position} scale={obj.scale} onClick={(e) => {`,
  `            if (obj.type === 'nature') {
              const natureType = obj.nature_type || 'tree';
              const color = obj.color || (natureType === 'tree' ? '#15803d' : '#64748b');
              return (
                <group key={obj.id} position={obj.position} scale={obj.scale} rotation={obj.rotation || [0,0,0]} onClick={(e) => {`
);

// For checkpoints:
code = code.replace(
  `            if (obj.type === 'checkpoint') {
             return (
                <group key={obj.id} position={obj.position}>`,
  `            if (obj.type === 'checkpoint') {
             return (
                <group key={obj.id} position={obj.position} rotation={obj.rotation || [0,0,0]} onClick={(e) => { if(mode==='edit'){ e.stopPropagation(); setSelectedId(obj.id); }}}>`
);

// For finish portal:
code = code.replace(
  `            if (obj.type === 'finish') {
             return (
                <group key={obj.id} position={obj.position}>`,
  `            if (obj.type === 'finish') {
             return (
                <group key={obj.id} position={obj.position} rotation={obj.rotation || [0,0,0]} onClick={(e) => { if(mode==='edit'){ e.stopPropagation(); setSelectedId(obj.id); }}}>`
);

// Adding selection line for nature objects:
const natureSelectStr = `
                  {mode === 'edit' && selectedId === obj.id && (
                     <mesh position={[0, 1.0, 0]}>
                        <boxGeometry args={[1.5, 3.0, 1.5]} />
                        <meshBasicMaterial color="#22d3ee" wireframe transparent opacity={0.6} />
                     </mesh>
                  )}
                </group>
              );`;

code = code.replace(`                </group>\n              );\n            }\n            if (obj.type === 'npc')`, natureSelectStr + "\n            }\n            if (obj.type === 'npc')");

fs.writeFileSync(filePath, code, 'utf8');
console.log("Updated elements selection and rotation support!");

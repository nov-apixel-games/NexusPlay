const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'views', 'GameStudioEditor3D.tsx');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Give DynamicShapeMesh access to setObjects via a new prop `updateObject`
code = code.replace(
  /function DynamicShapeMesh\(\{ obj, selectedId, mode, setSelectedId \}: any\) \{/g,
  "function DynamicShapeMesh({ obj, selectedId, mode, setSelectedId, updateObject }: any) {"
);

// 2. Add useRef and TransformControls to DynamicShapeMesh
code = code.replace(
  /const shape = obj\.shape/g,
  "const meshRef = useRef<THREE.Mesh>(null);\n  const shape = obj.shape"
);

// Add TransformControls conditionally returning inside DynamicShapeMesh
const meshReturn = `    <mesh 
      position={obj.position} 
      scale={obj.scale}
      rotation={rot}
      castShadow
      receiveShadow
      onClick={(e) => {
        if (mode === 'edit') {
          e.stopPropagation();
          setSelectedId(obj.id);
        }
      }}
    >`;

const newMeshReturn = `    <>
      <mesh 
        ref={meshRef}
        position={obj.position} 
        scale={obj.scale}
        rotation={rot}
        castShadow
        receiveShadow
        onClick={(e) => {
          if (mode === 'edit') {
            e.stopPropagation();
            setSelectedId(obj.id);
          }
        }}
      >`;

code = code.replace(meshReturn, newMeshReturn);

// Close the fragment
const meshClose = `    </mesh>
  );`;

const newMeshClose = `    </mesh>
    {selectedId === obj.id && mode === 'edit' && meshRef.current && (
       <TransformControls 
         object={meshRef.current} 
         mode="translate" 
         onMouseUp={() => {
           if (updateObject && meshRef.current) {
             updateObject(obj.id, {
               position: [meshRef.current.position.x, meshRef.current.position.y, meshRef.current.position.z],
               rotation: [meshRef.current.rotation.x, meshRef.current.rotation.y, meshRef.current.rotation.z],
               scale: [meshRef.current.scale.x, meshRef.current.scale.y, meshRef.current.scale.z]
             });
           }
         }} 
       />
    )}
  </>;`;

code = code.replace(meshClose, newMeshClose);

// Now patch LevelEnvironment to pass updateObject
const envSearch = `LevelEnvironment({ objects, mode, selectedId, setSelectedId, template }: any)`;
code = code.replace(envSearch, `LevelEnvironment({ objects, setObjects, mode, selectedId, setSelectedId, template }: any)`);

const envUpdateFunc = `const updateObject = (id: string, newProps: any) => {
    if(setObjects) {
       setObjects((prev: any[]) => prev.map(o => o.id === id ? { ...o, ...newProps } : o));
    }
  };`;

code = code.replace(
  /function LevelEnvironment.*\{/,
  `$& \n  ${envUpdateFunc}`
);

code = code.replace(
  /<DynamicShapeMesh \n                  key=\{obj\.id\} \n                  obj=\{obj\} \n                  selectedId=\{selectedId\} \n                  mode=\{mode\} \n                  setSelectedId=\{setSelectedId\} \n                \/>/g,
  `<DynamicShapeMesh \n                  key={obj.id} \n                  obj={obj} \n                  selectedId={selectedId} \n                  mode={mode} \n                  setSelectedId={setSelectedId}\n                  updateObject={updateObject} \n                />`
);

// Make sure Canvas LevelEnvironment gets setObjects
code = code.replace(
  /<LevelEnvironment \n              objects=\{objects\} \n              mode=\{mode\} \n              selectedId=\{selectedId\} \n              setSelectedId=\{setSelectedId\} \n              template=\{initialTemplate\}\n            \/>/g,
  `<LevelEnvironment \n              objects={objects} \n              setObjects={setObjects}\n              mode={mode} \n              selectedId={selectedId} \n              setSelectedId={setSelectedId} \n              template={initialTemplate}\n            />`
);


fs.writeFileSync(filePath, code, 'utf8');
console.log("TransformControls patch completed!");

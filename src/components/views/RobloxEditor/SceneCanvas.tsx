import React, { Suspense, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Sky, OrbitControls, Grid, TransformControls, Box, Sphere, Cylinder, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { useEditorStore } from './store';
import { SceneObject } from './editorTypes';

const RenderObject = ({ obj }: { obj: SceneObject }) => {
  const { selectedId, setSelectedId } = useEditorStore();
  const isSelected = selectedId === obj.id;
  const ref = useRef<THREE.Group>(null);

  // Position, scaling and rotation from Zustand
  const { x: px, y: py, z: pz } = obj.position;
  const { x: rx, y: ry, z: rz } = obj.rotation;
  const { x: sx, y: sy, z: sz } = obj.scale;

  const handleClick = (e: any) => {
    e.stopPropagation();
    setSelectedId(obj.id);
  };

  const getGeometryAndMaterial = () => {
    switch (obj.type) {
      case 'box':
        return (
          <Box args={[1, 1, 1]} castShadow receiveShadow>
            <meshStandardMaterial color={obj.color} roughness={0.4} />
          </Box>
        );
      case 'sphere':
        return (
          <Sphere args={[0.5, 32, 32]} castShadow receiveShadow>
            <meshStandardMaterial color={obj.color} roughness={0.2} metalness={0.1} />
          </Sphere>
        );
      case 'cylinder':
      case 'tree':
        return (
          <group>
            {/* Trunk */}
            <Cylinder args={[0.2, 0.2, 1]} position={[0, -0.5, 0]} castShadow>
              <meshStandardMaterial color="#8B4513" />
            </Cylinder>
            {/* Leaves */}
            <Sphere args={[0.8, 16, 16]} position={[0, 0.5, 0]} castShadow>
              <meshStandardMaterial color="#22c55e" />
            </Sphere>
          </group>
        );
      case 'house':
        return (
          <group>
            <Box args={[2, 2, 2]} position={[0, 0, 0]} castShadow receiveShadow>
              <meshStandardMaterial color="#e5e5e5" />
            </Box>
            {/* Roof */}
            <Cylinder args={[0, 1.6, 1.5, 4]} position={[0, 1.75, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
              <meshStandardMaterial color="#ef4444" />
            </Cylinder>
          </group>
        );
      case 'vehicle':
        return (
          <group>
            <Box args={[1.5, 0.5, 3]} position={[0, -0.2, 0]} castShadow>
              <meshStandardMaterial color={obj.color || "#3b82f6"} metalness={0.6} roughness={0.2} />
            </Box>
            <Box args={[1.2, 0.6, 1.5]} position={[0, 0.35, -0.2]} castShadow>
              <meshStandardMaterial color="#1e293b" />
            </Box>
          </group>
        );
      case 'character':
        return (
          <group>
            {/* Body */}
            <Box args={[0.8, 1.2, 0.4]} position={[0, 0.6, 0]} castShadow>
              <meshStandardMaterial color="#3b82f6" />
            </Box>
            {/* Head */}
            <Sphere args={[0.4]} position={[0, 1.6, 0]} castShadow>
              <meshStandardMaterial color="#fbbf24" />
            </Sphere>
          </group>
        );
      case 'terrain':
        const biome = obj.meta?.biome || 'forest';
        let tColor = "#22c55e"; // forest
        if(biome === 'desert') tColor = "#fcd34d";
        if(biome === 'snow') tColor = "#f8fafc";
        if(biome === 'city') tColor = "#475569";
        return (
          <Box args={[1, 1, 1]} castShadow receiveShadow>
            <meshStandardMaterial color={tColor} roughness={0.9} />
          </Box>
        );
      default:
        return (
          <Box args={[1, 1, 1]} castShadow receiveShadow>
             <meshStandardMaterial color={obj.color} />
          </Box>
        );
    }
  };

  return (
    <group 
      ref={ref}
      position={[px, py, pz]}
      rotation={[rx, ry, rz]}
      scale={[sx, sy, sz]}
      onClick={handleClick}
      visible={obj.visible}
    >
      {getGeometryAndMaterial()}
      
      {/* Highlighting selection */}
      {isSelected && (
         <mesh>
           <boxGeometry args={[1.05, 1.05, 1.05]} />
           <meshBasicMaterial color="#3b82f6" wireframe />
         </mesh>
      )}
    </group>
  );
};

// Transform Controls integration
const TransformManager = ({ setIsDragging }: { setIsDragging: (v: boolean) => void }) => {
  const { objects, selectedId, transformMode, updateObject } = useEditorStore();
  const selectedObj = objects.find(o => o.id === selectedId);
  const controlRef = useRef<any>(null);

  useEffect(() => {
    if (controlRef.current && selectedObj) {
      // Small trick to bind transform controls to our standalone proxy object
      // Actually @react-three/drei TransformControls is better used wrapping the object,
      // but since we want to sync state back to Zustand, we listen to its onChange event.
      const handleDrag = (e: any) => {
        // We get the object that is being transformed
        const obj = controlRef.current.object;
        if (obj) {
          updateObject(selectedId, {
            position: { x: obj.position.x, y: obj.position.y, z: obj.position.z },
            rotation: { x: obj.rotation.x, y: obj.rotation.y, z: obj.rotation.z },
            scale: { x: obj.scale.x, y: obj.scale.y, z: obj.scale.z },
          });
        }
      };

      const ctrl = controlRef.current;
      ctrl.addEventListener('dragging-changed', (e: any) => {
        setIsDragging(e.value);
      });
      
      ctrl.addEventListener('change', handleDrag);

      return () => {
        ctrl.removeEventListener('change', handleDrag);
      };
    }
  }, [selectedObj, selectedId, updateObject]);

  if (!selectedObj) return null;

  return (
    <TransformControls
      ref={controlRef}
      object={selectedObj ? undefined : undefined}
      mode={transformMode}
      position={[selectedObj.position.x, selectedObj.position.y, selectedObj.position.z]}
      rotation={[selectedObj.rotation.x, selectedObj.rotation.y, selectedObj.rotation.z]}
      scale={[selectedObj.scale.x, selectedObj.scale.y, selectedObj.scale.z]}
      onObjectChange={(e: any) => {
         // Syncing back on frame update
         // @ts-ignore
         if(e?.target?.object) {
           updateObject(selectedId, {
              // @ts-ignore
              position: { x: e.target.object.position.x, y: e.target.object.position.y, z: e.target.object.position.z },
              // @ts-ignore
              rotation: { x: e.target.object.rotation.x, y: e.target.object.rotation.y, z: e.target.object.rotation.z },
              // @ts-ignore
              scale: { x: e.target.object.scale.x, y: e.target.object.scale.y, z: e.target.object.scale.z },
           });
         }
      }}
    >
      <group />
    </TransformControls>
  );
};

export const SceneCanvas = () => {
  const { objects, setSelectedId } = useEditorStore();
  const [isDragging, setIsDragging] = React.useState(false);

  return (
    <div className="flex-1 w-full h-full bg-[#111827] relative" onClick={() => setSelectedId(null)}>
      <Canvas shadows camera={{ position: [15, 15, 15], fov: 50 }}>
        <Suspense fallback={null}>
          <Sky sunPosition={[100, 20, 100]} turbidity={0.1} rayleigh={0.5} />
          <ambientLight intensity={0.4} />
          <directionalLight 
            castShadow 
            position={[20, 30, 10]} 
            intensity={1.2} 
            shadow-mapSize={[2048, 2048]} 
          />
          <Environment preset="city" />
          
          <Grid 
            infiniteGrid 
            fadeDistance={100} 
            sectionColor="#4b5563" 
            cellColor="#1f2937" 
            position={[0, -0.01, 0]} 
          />

          <group onClick={(e) => e.stopPropagation()}>
            {objects.map((obj) => (
              <RenderObject key={obj.id} obj={obj} />
            ))}
            <TransformManager setIsDragging={setIsDragging} />
          </group>

          <OrbitControls makeDefault enabled={!isDragging} />
        </Suspense>
      </Canvas>
      <div className="absolute top-4 left-4 pointer-events-none text-white/50 text-xs font-mono">
        Controles: Click izquierdo para Orbitar. Click derecho para Panear.
      </div>
    </div>
  );
};

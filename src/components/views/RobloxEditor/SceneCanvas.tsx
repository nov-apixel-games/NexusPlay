import React, { Suspense, useRef, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Sky, OrbitControls, Grid, TransformControls, Box, Sphere, Cylinder, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { useEditorStore } from './store';
import { SceneObject } from './editorTypes';

const RenderObject = ({ obj }: { obj: SceneObject }) => {
  const { selectedId, setSelectedId, transformMode, updateObject, setIsDragging } = useEditorStore();
  const isSelected = selectedId === obj.id;
  
  const meshRef = useRef<THREE.Group>(null);
  const controlRef = useRef<any>(null);
  const isDraggingLocal = useRef(false);

  // Sync position from Zustand to THREE.js manually, ONLY IF not dragging.
  // This prevents R3F from overriding TransformControls during re-renders,
  // which caused the NaN and black screen glitches.
  useEffect(() => {
    if (meshRef.current && !isDraggingLocal.current) {
      meshRef.current.position.set(obj.position.x, obj.position.y, obj.position.z);
      meshRef.current.rotation.set(obj.rotation.x, obj.rotation.y, obj.rotation.z);
      meshRef.current.scale.set(obj.scale.x, obj.scale.y, obj.scale.z);
    }
  }, [obj.position, obj.rotation, obj.scale]);

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

  // Sync back to Zustand ONLY when drag ends. This avoids infinite update loops that result in NaN and black screen.
  useEffect(() => {
    if (isSelected && controlRef.current && meshRef.current) {
      const controls = controlRef.current;
      
      const onDragChange = (event: any) => {
        isDraggingLocal.current = event.value;
        setIsDragging(event.value);
        // event.value is true when dragging starts, false when it ends
        if (!event.value) {
          const targetObj = meshRef.current;
          // Safety check against NaN
          if (targetObj && (isNaN(targetObj.position.x) || isNaN(targetObj.scale.x))) {
             console.error("TransformControls generated null/NaN values. Reverting.");
             return;
          }

          if (targetObj) {
            updateObject(obj.id, {
              position: { x: targetObj.position.x, y: targetObj.position.y, z: targetObj.position.z },
              rotation: { x: targetObj.rotation.x, y: targetObj.rotation.y, z: targetObj.rotation.z },
              scale: { x: targetObj.scale.x, y: targetObj.scale.y, z: targetObj.scale.z },
            });
          }
        }
      };

      controls.addEventListener('dragging-changed', onDragChange);
      return () => {
         controls.removeEventListener('dragging-changed', onDragChange);
      };
    }
  }, [isSelected, obj.id, updateObject, setIsDragging]);

  return (
    <>
      {isSelected && (
        <TransformControls 
          ref={controlRef}
          object={meshRef} 
          mode={transformMode} 
        />
      )}
      <group 
        ref={meshRef}
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
    </>
  );
};

export const SceneCanvas = () => {
  const { objects, setSelectedId, isDragging } = useEditorStore();

  return (
    <div className="flex-1 w-full h-full bg-[#111827] relative">
      <Canvas shadows camera={{ position: [15, 15, 15], fov: 50 }} onPointerMissed={() => setSelectedId(null)}>
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

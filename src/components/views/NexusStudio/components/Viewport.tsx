import React, { useRef, useEffect, useState } from 'react';
import { useStudioStore, Entity, Entity3D, Entity2D } from '../store/useStudioStore';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sky, Grid, TransformControls, useGLTF } from '@react-three/drei';
import { Physics, RigidBody } from '@react-three/rapier';
import Phaser from 'phaser';

const ModelParams = ({ url }: { url?: string }) => {
  if (!url) return null;
  const { scene } = useGLTF(url);
  return <primitive object={scene.clone()} />;
};

const Entity3DNode = ({ entity, isPlayMode }: { entity: Entity3D, isPlayMode: boolean }) => {
  const { selectedEntityId, selectEntity, updateEntity, toolMode } = useStudioStore();
  const isSelected = selectedEntityId === entity.id;
  const groupRef = useRef<any>(null);
  
  const content = (
    <group 
      ref={groupRef}
      position={entity.position} 
      rotation={entity.rotation} 
      scale={entity.scale}
      onClick={(e) => {
        if (!isPlayMode) {
          e.stopPropagation();
          selectEntity(entity.id);
        }
      }}
    >
      {entity.type === 'cube' && (
        <mesh>
          <boxGeometry />
          <meshStandardMaterial color={entity.color || '#cccccc'} emissive={isSelected && !isPlayMode ? '#222222' : entity.emission || '#000000'} roughness={entity.roughness || 0.5} metalness={entity.metalness || 0} transparent opacity={entity.opacity || 1} />
        </mesh>
      )}
      {entity.type === 'sphere' && (
        <mesh>
          <sphereGeometry args={[0.5, 32, 32]} />
          <meshStandardMaterial color={entity.color || '#cccccc'} emissive={isSelected && !isPlayMode ? '#222222' : entity.emission || '#000000'} roughness={entity.roughness || 0.5} metalness={entity.metalness || 0} transparent opacity={entity.opacity || 1} />
        </mesh>
      )}
      {entity.type === 'model' && (
         <React.Suspense fallback={<group><mesh><boxGeometry/><meshStandardMaterial color="hotpink" wireframe/></mesh></group>}>
            <ModelParams url={entity.modelUrl} />
         </React.Suspense>
      )}
      {isSelected && !isPlayMode && (
        <mesh>
          <boxGeometry args={[1.05, 1.05, 1.05]} />
          <meshBasicMaterial color="#3b82f6" wireframe visible={entity.type !== 'model'} />
        </mesh>
      )}
    </group>
  );

  if (isPlayMode && entity.type !== 'model' && entity.type !== 'light') {
     return (
       <RigidBody type={entity.position[1] < 0 ? "fixed" : "dynamic"} colliders={entity.type === 'cube' ? "cuboid" : "ball"} position={entity.position} rotation={entity.rotation}>
         {content}
       </RigidBody>
     );
  }

  if (isSelected && !isPlayMode && toolMode !== 'select') {
    return (
      <TransformControls 
        object={groupRef} 
        mode={toolMode as any}
        onMouseUp={() => {
          if (groupRef.current) {
            updateEntity(entity.id, {
              position: [groupRef.current.position.x, groupRef.current.position.y, groupRef.current.position.z],
              rotation: [groupRef.current.rotation.x, groupRef.current.rotation.y, groupRef.current.rotation.z],
              scale: [groupRef.current.scale.x, groupRef.current.scale.y, groupRef.current.scale.z],
            });
          }
        }}
      >
        {content}
      </TransformControls>
    );
  }

  return content;
};

const ScriptRunner = () => {
  const scripts = useStudioStore(s => s.scripts);
  const isPlayMode = useStudioStore(s => s.appState === 'play');
  const updateRef = useRef<Function | null>(null);

  useEffect(() => {
    if (!isPlayMode) {
      updateRef.current = null;
      return;
    }
    try {
      const func = new Function('store', `
        ${scripts}
        if (typeof update === 'function') return update;
        return null;
      `);
      updateRef.current = func(useStudioStore.getState());
      
      const setupFunc = new Function('store', `
        ${scripts}
        if (typeof setup === 'function') return setup;
        return null;
      `);
      const setup = setupFunc(useStudioStore.getState());
      if (setup) setup();
    } catch (e) {
      console.error('Script Error:', e);
    }
  }, [scripts, isPlayMode]);

  useFrame((state, dt) => {
    if (updateRef.current && isPlayMode) {
      try {
        updateRef.current(dt);
      } catch (e) {
        console.error('Script Update Error:', e);
      }
    }
  });
  return null;
};

const Viewport3D = () => {
  const { entities, selectEntity, appState } = useStudioStore();
  const entities3D = entities.filter(e => e.is3D) as Entity3D[];
  const isPlayMode = appState === 'play';

  return (
    <Canvas 
      camera={{ position: [5, 5, 5], fov: 50 }} 
      onPointerMissed={() => { if (!isPlayMode) selectEntity(null); }}
      className="w-full h-full outline-none"
      shadows
    >
      <Sky sunPosition={[100, 20, 100]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 10]} intensity={1} castShadow />
      
      {!isPlayMode && <Grid infiniteGrid fadeDistance={40} sectionColor="#444444" cellColor="#222222" />}

      <ScriptRunner />

      {isPlayMode ? (
        <Physics>
          {entities3D.map(e => (
            <Entity3DNode key={e.id} entity={e} isPlayMode={isPlayMode} />
          ))}
          {/* Ground Plane for Play Mode */}
          <RigidBody type="fixed" colliders="cuboid" position={[0, -0.5, 0]}>
             <mesh receiveShadow>
               <boxGeometry args={[100, 1, 100]} />
               <meshStandardMaterial color="#333333" />
             </mesh>
          </RigidBody>
        </Physics>
      ) : (
        entities3D.map(e => (
          <Entity3DNode key={e.id} entity={e} isPlayMode={isPlayMode} />
        ))
      )}

      <OrbitControls makeDefault />
    </Canvas>
  );
};

const Viewport2D = () => {
  const gameRef = useRef<HTMLDivElement>(null);
  const { entities, selectEntity, appState } = useStudioStore();
  const entities2D = entities.filter(e => !e.is3D) as Entity2D[];

  useEffect(() => {
    if (!gameRef.current) return;

    class MainScene extends Phaser.Scene {
       constructor() {
         super('MainScene');
       }
       preload() {
         // Load default assets
       }
       create() {
         this.cameras.main.setBackgroundColor('#1e1e1e');
         
         const gridGraphics = this.add.graphics();
         gridGraphics.lineStyle(1, 0x333333, 1);
         for(let i = 0; i < 800; i+= 40) {
            gridGraphics.moveTo(i, 0);
            gridGraphics.lineTo(i, 600);
            gridGraphics.moveTo(0, i);
            gridGraphics.lineTo(800, i);
         }
         gridGraphics.strokePath();

         // Add entities
         entities2D.forEach(e => {
            if (e.type === 'rect') {
              const rect = this.add.rectangle(e.x, e.y, e.width, e.height, parseInt((e.color || '#cccccc').replace('#', '0x')));
              rect.setInteractive();
              if (appState !== 'play') {
                this.input.setDraggable(rect);
                rect.on('pointerdown', () => {
                  selectEntity(e.id);
                });
              }
            }
         });

         if (appState !== 'play') {
           this.input.on('drag', (pointer: any, gameObject: any, dragX: number, dragY: number) => {
               gameObject.x = dragX;
               gameObject.y = dragY;
               // Need to sync back to Zustand in a real impl via events
           });
         }
       }
       update() {
         
       }
    }

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: gameRef.current,
      width: '100%',
      height: '100%',
      scene: MainScene,
      scale: {
         mode: Phaser.Scale.RESIZE,
      },
      physics: appState === 'play' ? {
        default: 'arcade',
        arcade: { gravity: { x: 0, y: 300 } }
      } : undefined
    };

    const game = new Phaser.Game(config);

    return () => {
      game.destroy(true);
    };
  }, [entities2D, appState, selectEntity]);

  return (
    <div className="w-full h-full bg-[#1e1e1e] relative">
      <div ref={gameRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
};

export const Viewport = () => {
  const engineMode = useStudioStore(s => s.engineMode);
  
  return (
    <div className="flex-1 relative bg-black overflow-hidden flex">
      {engineMode === '3D' ? <Viewport3D /> : <Viewport2D />}
      
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <div className="bg-black/50 backdrop-blur text-white text-xs px-2 py-1 rounded font-mono border border-white/10">
          Modo: {engineMode}
        </div>
      </div>
    </div>
  );
};


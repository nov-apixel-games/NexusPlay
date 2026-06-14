import React, { useRef, useEffect, useState } from 'react';
import { useStudioStore, Entity3D, Entity2D } from '../store/useStudioStore';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Sky, Grid, TransformControls, useGLTF, Html } from '@react-three/drei';
import { Physics, RigidBody } from '@react-three/rapier';
import Phaser from 'phaser';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

class ModelErrorBoundary extends React.Component<{ url: string, entityName: string, children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const ext = this.props.url.split('.').pop()?.split('?')[0]?.toLowerCase();
    
    console.error(`[Nexus Studio Diagnostics] =======================================`);
    console.error(`[Nexus Studio Diagnostics] MODEL LOAD ERROR`);
    console.error(`[Nexus Studio Diagnostics] Entity Name: ${this.props.entityName}`);
    console.error(`[Nexus Studio Diagnostics] URL: ${this.props.url}`);
    console.error(`[Nexus Studio Diagnostics] Detected Extension: ${ext}`);
    console.error(`[Nexus Studio Diagnostics] Error details:`, error);
    console.error(`[Nexus Studio Diagnostics] =======================================`);
    
    // Attempting a quick fetch to check if the file is reachable and check its headers
    fetch(this.props.url, { method: "HEAD" }).then(res => {
;
;
    }).catch(e => {
      console.error(`[Nexus Studio Diagnostics] Validation HEAD fetch failed:`, e);
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <group>
          <mesh>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="red" wireframe />
          </mesh>
          <Html center>
            <div className="bg-red-900/90 text-nexus-text p-3 rounded-lg border border-red-500 w-64 text-xs font-mono break-all pointer-events-none">
              <strong className="block mb-1 text-red-300">Model Load Error</strong>
              <div>Ext: {this.props.url.split('.').pop()?.split('?')[0]}</div>
              <div className="mt-1 font-semibold text-red-200">{this.state.error?.message}</div>
              <div className="mt-2 text-[10px] break-all">{this.props.url.substring(0, 100)}...</div>
            </div>
          </Html>
        </group>
      );
    }
    return this.props.children;
  }
}

const GLTFModel = ({ url }: { url: string }) => {

  const { scene } = useGLTF(url);
  return <primitive object={scene.clone()} />;
};

const FBXModel = ({ url }: { url: string }) => {
  const fbx = useLoader(FBXLoader as any, url);
  return <primitive object={(fbx as any).clone()} />;
};

const OBJModel = ({ url }: { url: string }) => {
  const obj = useLoader(OBJLoader as any, url);
  return <primitive object={(obj as any).clone()} />;
};

const ModelParams = ({ url, entityName }: { url?: string, entityName: string }) => {
  React.useEffect(() => {
    if (!url) {
      console.warn(`[Nexus Studio] Asset incompleto: El modelo '${entityName}' no tiene un modelUrl válido.`);
    }
  }, [url, entityName]);

  if (!url) return null;
  
  const extension = url.split('.').pop()?.split('?')[0]?.toLowerCase();

  try {
    if (extension === 'fbx') return <FBXModel url={url} />;
    if (extension === 'obj') return <OBJModel url={url} />;
    return <GLTFModel url={url} />;
  } catch (err) {
    console.error(`[Nexus Studio] Error cargando modelo ${entityName}:`, err);
    return null;
  }
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
         <ModelErrorBoundary url={entity.modelUrl as string} entityName={entity.name}>
           <React.Suspense fallback={null}>
              <ModelParams url={entity.modelUrl} entityName={entity.name} />
           </React.Suspense>
         </ModelErrorBoundary>
      )}
      {entity.type === 'terrain' && (
         <mesh rotation={[-Math.PI/2, 0, 0]}>
           <planeGeometry args={[100, 100, 32, 32]} />
           <meshStandardMaterial color={entity.color || '#44aa44'} roughness={entity.roughness || 0.8} metalness={entity.metalness || 0.1} />
         </mesh>
      )}
      {entity.type === 'pointLight' && (
         <>
           <pointLight color={entity.color || '#ffffff'} intensity={entity.intensity ?? 1} distance={entity.distance ?? 0} decay={entity.decay ?? 2} />
           {!isPlayMode && <mesh><sphereGeometry args={[0.2, 8, 8]}/><meshBasicMaterial color={entity.color || '#ffffff'} wireframe/></mesh>}
         </>
      )}
      {entity.type === 'directionalLight' && (
         <>
           <directionalLight color={entity.color || '#ffffff'} intensity={entity.intensity ?? 1} />
           {!isPlayMode && <mesh><cylinderGeometry args={[0, 0.2, 0.5, 8]}/><meshBasicMaterial color={entity.color || '#ffffff'} wireframe/></mesh>}
         </>
      )}
      {entity.type === 'spotLight' && (
         <>
           <spotLight color={entity.color || '#ffffff'} intensity={entity.intensity ?? 1} distance={entity.distance ?? 0} angle={entity.angle ?? Math.PI/4} penumbra={entity.penumbra ?? 0.5} decay={entity.decay ?? 2} />
           {!isPlayMode && <mesh><coneGeometry args={[0.2, 0.5, 8]}/><meshBasicMaterial color={entity.color || '#ffffff'} wireframe/></mesh>}
         </>
      )}
      {entity.type === 'ambientLight' && (
         <>
           <ambientLight color={entity.color || '#ffffff'} intensity={entity.intensity ?? 0.2} />
           {!isPlayMode && <mesh><octahedronGeometry args={[0.2]} /><meshBasicMaterial color={entity.color || '#ffffff'} wireframe/></mesh>}
         </>
      )}
      {isSelected && !isPlayMode && !entity.type.includes('Light') && (
        <mesh>
          <boxGeometry args={[1.05, 1.05, 1.05]} />
          <meshBasicMaterial color="#3b82f6" wireframe visible={entity.type !== 'model' && entity.type !== 'terrain'} />
        </mesh>
      )}
    </group>
  );

  if (isPlayMode && !entity.type.includes('Light') && entity.type !== 'model' && entity.type !== 'terrain') {
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
  const { entities, selectEntity, appState, activeSceneId } = useStudioStore();
  const entities3D = entities.filter(e => e.is3D && e.sceneId === activeSceneId) as Entity3D[];
  const isPlayMode = appState === 'play';
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <Canvas 
      camera={{ position: [5, 5, 5], fov: 50 }} 
      onPointerMissed={() => { if (!isPlayMode) selectEntity(null); }}
      className="w-full h-full outline-none"
      shadows={!isMobile} // Disabled on mobile for performance
      dpr={isMobile ? [1, 1.5] : [1, 2]} // Lower Max DPR on mobile for performance
    >
      <Sky sunPosition={[100, 20, 100]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 10]} intensity={1} castShadow={!isMobile} shadow-mapSize={[isMobile ? 512 : 2048, isMobile ? 512 : 2048]} />
      
      {!isPlayMode && <Grid infiniteGrid fadeDistance={isMobile ? 20 : 40} sectionColor="#444444" cellColor="#222222" />}

      <ScriptRunner />

      {isPlayMode ? (
        <Physics>
          {entities3D.map(e => (
            <Entity3DNode key={e.id} entity={e} isPlayMode={isPlayMode} />
          ))}
          {/* Ground Plane for Play Mode */}
          <RigidBody type="fixed" colliders="cuboid" position={[0, -0.5, 0]}>
             <mesh receiveShadow={!isMobile}>
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

      <OrbitControls 
        makeDefault 
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        enableDamping={true}
      />
    </Canvas>
  );
};

const Viewport2D = () => {
  const gameRef = useRef<HTMLDivElement>(null);
  const { entities, selectEntity, appState, activeSceneId } = useStudioStore();
  const entities2D = entities.filter(e => !e.is3D && e.sceneId === activeSceneId) as Entity2D[];

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

           // Pan camera with 2 fingers or right click / middle click
           this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
             if (!pointer.isDown) return;
             // Check if it's a pan action (pointer2 down means pinch/pan on mobile; or right button on desktop)
             if (this.input.pointer2.isDown || pointer.rightButtonDown() || pointer.middleButtonDown()) {
               this.cameras.main.scrollX -= (pointer.x - pointer.prevPosition.x) / this.cameras.main.zoom;
               this.cameras.main.scrollY -= (pointer.y - pointer.prevPosition.y) / this.cameras.main.zoom;
             }
           });

           // Enable pinch zoom for mobile
           let baseZoom = 1;
           this.input.on('pointerdown', () => {
             if (this.input.pointer1.isDown && this.input.pointer2.isDown) {
               baseZoom = this.cameras.main.zoom;
             }
           });
           
           this.input.on('pointermove', () => {
             if (this.input.pointer1.isDown && this.input.pointer2.isDown) {
               const p1 = this.input.pointer1;
               const p2 = this.input.pointer2;
               
               const currentDist = Phaser.Math.Distance.Between(p1.x, p1.y, p2.x, p2.y);
               const prevDist = Phaser.Math.Distance.Between(p1.prevPosition.x, p1.prevPosition.y, p2.prevPosition.x, p2.prevPosition.y);
               
               if (prevDist > 0) {
                 const scale = currentDist / prevDist;
                 this.cameras.main.zoom = Phaser.Math.Clamp(this.cameras.main.zoom * scale, 0.1, 10);
               }
             }
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
    <div className="w-full h-full bg-nexus-card relative">
      <div ref={gameRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
};

export const Viewport = () => {
  const engineMode = useStudioStore(s => s.engineMode);
  const addEntity = useStudioStore(s => s.addEntity);
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dataStr = e.dataTransfer.getData('text/plain');
    if (!dataStr) return;
    try {
      const data = JSON.parse(dataStr);
      // Need a way to project unproject the mouse coords into 3D, 
      // but for simplicity we'll just put it at 0,0,0
      addEntity({
        name: data.name,
        type: data.type || (engineMode === '3D' ? 'cube' : 'rect'),
        is3D: engineMode === '3D',
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        x: 400,
        y: 300,
        width: 100,
        height: 100,
        visible: true,
        locked: false,
        color: '#aaaaaa',
        assetType: data.assetType,
        modelUrl: data.modelUrl
      });
    } catch(err) {
      console.error("Drop parse error", err);
    }
  };

  return (
    <div 
      className="flex-1 relative bg-black overflow-hidden flex"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      {engineMode === '3D' ? <Viewport3D /> : <Viewport2D />}
      
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <div className="bg-nexus-surface backdrop-blur text-nexus-text text-xs px-2 py-1 rounded font-mono border border-nexus-border">
          Modo: {engineMode}
        </div>
      </div>
    </div>
  );
};


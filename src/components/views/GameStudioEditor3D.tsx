import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sky, Text, Box, Sphere, Cylinder, OrbitControls, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { Play, Square, Save, Upload, RotateCcw, Check, Settings, ChevronLeft, Move, Crosshair, PlusCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface GameObject3D {
  id: string;
  type: 'wall' | 'enemy' | 'pickup' | 'spawn';
  position: [number, number, number];
  scale: [number, number, number];
  color: string;
}

interface Editor3DProps {
  initialTemplate: string;
  onBack: () => void;
}

// Custom simple physics / gameplay state
const playState = {
  score: 0,
  health: 3,
  gameOver: false,
  won: false,
  bullets: [] as any[],
  enemies: [] as any[],
  pickups: [] as any[],
  keys: {} as Record<string, boolean>,
  joystick: { x: 0, y: 0 }, // For movement
  lookDelta: { x: 0, y: 0 }, // For looking around
  isShooting: false,
  lastShot: 0
};

function PlayerWeapon() {
  const { camera } = useThree();
  const group = useRef<THREE.Group>(null);
  const recoilParams = useRef({ current: 0, target: 0 });

  useFrame((state, delta) => {
    if (!group.current) return;
    group.current.position.copy(camera.position);
    group.current.quaternion.copy(camera.quaternion);

    // Recoil
    if (playState.isShooting) {
       recoilParams.current.target = 0.1;
    }
    recoilParams.current.current = THREE.MathUtils.lerp(recoilParams.current.current, recoilParams.current.target, delta * 15);
    recoilParams.current.target = THREE.MathUtils.lerp(recoilParams.current.target, 0, delta * 10);
    
    group.current.translateZ(recoilParams.current.current); // kick back
  });

  return (
    <group ref={group}>
      <group position={[0.3, -0.3, -0.5]}>
         <mesh castShadow>
           <boxGeometry args={[0.1, 0.1, 0.5]} />
           <meshStandardMaterial color="#475569" />
         </mesh>
         <mesh position={[0, -0.1, 0.1]} castShadow>
            <boxGeometry args={[0.08, 0.2, 0.1]} />
            <meshStandardMaterial color="#1e293b" />
         </mesh>
         <mesh position={[0, 0, -0.26]}>
            <boxGeometry args={[0.06, 0.06, 0.02]} />
            <meshBasicMaterial color="#ef4444" />
         </mesh>
      </group>
    </group>
  );
}

// Player logic component
function PlayerController({ spawn, onHit, walls, enemies }: any) {
  const { camera } = useThree();
  const playerRef = useRef(new THREE.Vector3(...spawn));
  const velocity = useRef(new THREE.Vector3());
  const euler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));
  
  useEffect(() => {
    camera.position.set(spawn[0], 1.6, spawn[2]);
    playerRef.current.set(spawn[0], 1.6, spawn[2]);
  }, [spawn, camera]);

  useFrame((state, delta) => {
    if (playState.gameOver || playState.won) return;

    const moveSpeed = 8.0;
    
    // 1) Gather input into local velocity vectors
    let fwd = 0;
    let right = 0;

    // Desktop WASD
    if (playState.keys['w']) fwd = 1;
    if (playState.keys['s']) fwd = -1;
    if (playState.keys['a']) right = -1;
    if (playState.keys['d']) right = 1;

    // Mobile Joystick
    if (playState.joystick.y !== 0) fwd = -playState.joystick.y;
    if (playState.joystick.x !== 0) right = playState.joystick.x;

    // 2) Look logic (Touch drag or mouse)
    euler.current.y -= playState.lookDelta.x * 0.005;
    euler.current.x -= playState.lookDelta.y * 0.005;
    euler.current.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, euler.current.x));
    camera.quaternion.setFromEuler(euler.current);

    // Reset delta
    playState.lookDelta.x *= 0.8;
    playState.lookDelta.y *= 0.8;

    // 3) Apply movement relative to camera direction
    const camDir = new THREE.Vector3();
    camera.getWorldDirection(camDir);
    camDir.y = 0;
    camDir.normalize();
    
    const camRight = new THREE.Vector3();
    camRight.crossVectors(camera.up, camDir).normalize();

    // Multiply direction inputs by base speed
    const moveStep = new THREE.Vector3();
    moveStep.addScaledVector(camDir, fwd * moveSpeed * delta);
    moveStep.addScaledVector(camRight, -right * moveSpeed * delta);
    
    // Very simple Collision detection with walls
    let hitWall = false;
    const nextPos = playerRef.current.clone().add(moveStep);
    
    for(const w of walls) {
      if (
        nextPos.x > w.position[0] - w.scale[0]/2 - 0.5 &&
        nextPos.x < w.position[0] + w.scale[0]/2 + 0.5 &&
        nextPos.z > w.position[2] - w.scale[2]/2 - 0.5 &&
        nextPos.z < w.position[2] + w.scale[2]/2 + 0.5
      ) {
         hitWall = true;
         break;
      }
    }

    if (!hitWall) {
      playerRef.current.copy(nextPos);
    }
    camera.position.copy(playerRef.current);

    // Shooting
    if (playState.isShooting && state.clock.elapsedTime * 1000 - playState.lastShot > 300) {
      playState.bullets.push({
        id: Math.random(),
        position: camera.position.clone().add(camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(1)),
        velocity: camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(40),
        life: 2.0
      });
      playState.lastShot = state.clock.elapsedTime * 1000;
      playState.isShooting = false;
    }
  });

  return null;
}

function BulletManager({ walls }: any) {
  const { scene } = useThree();
  const bulletsRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state, delta) => {
    if (!bulletsRef.current) return;
    let count = 0;
    
    for (let i = playState.bullets.length - 1; i >= 0; i--) {
      const b = playState.bullets[i];
      b.position.addScaledVector(b.velocity, delta);
      b.life -= delta;

      let hit = false;
      // Collisions
      for (const w of walls) {
        if (
          b.position.x > w.position[0] - w.scale[0]/2 &&
          b.position.x < w.position[0] + w.scale[0]/2 &&
          b.position.z > w.position[2] - w.scale[2]/2 &&
          b.position.z < w.position[2] + w.scale[2]/2 &&
          b.position.y > 0 && b.position.y < w.scale[1]
        ) {
          hit = true; break;
        }
      }

      for (let j = playState.enemies.length - 1; j >= 0; j--) {
        const e = playState.enemies[j];
        if (!e.dead && b.position.distanceTo(e.position) < 1.5) {
          hit = true;
          e.hp -= 1;
          if (e.hp <= 0) {
            e.dead = true;
            playState.score += 100;
          }
          break;
        }
      }

      if (hit || b.life <= 0) {
        playState.bullets.splice(i, 1);
        continue;
      }

      dummy.position.copy(b.position);
      dummy.updateMatrix();
      bulletsRef.current.setMatrixAt(count, dummy.matrix);
      count++;
    }
    bulletsRef.current.count = count;
    bulletsRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={bulletsRef} args={[undefined, undefined, 100]} frustumCulled={false}>
      <sphereGeometry args={[0.1, 8, 8]} />
      <meshBasicMaterial color="#facc15" />
    </instancedMesh>
  );
}

function EnemiesManager({ enemiesData }: any) {
  const { camera } = useThree();
  
  useEffect(() => {
    playState.enemies = enemiesData.map((e: any) => ({
      ...e,
      position: new THREE.Vector3(...e.position),
      hp: 3,
      dead: false,
      lastAttack: 0
    }));
  }, [enemiesData]);

  useFrame((state, delta) => {
    if (playState.gameOver) return;

    for (const e of playState.enemies) {
      if (e.dead) {
         if (e.position.y > -2) e.position.y -= delta * 5;
         continue;
      }

      // Move towards player
      const dist = e.position.distanceTo(camera.position);
      
      // Look at player (Y axis only)
      const dir = camera.position.clone().sub(e.position).normalize();
      dir.y = 0;
      
      if (dir.lengthSq() > 0.0001) {
         e.rotationY = Math.atan2(dir.x, dir.z);
      }
      
      if (dist < 15 && dist > 1.5) {
         e.position.addScaledVector(dir, delta * 2.5);
      } else if (dist <= 1.5) {
         // Attack
         if (state.clock.elapsedTime * 1000 - e.lastAttack > 1000) {
           playState.health -= 1;
           if (playState.health <= 0) playState.gameOver = true;
           e.lastAttack = state.clock.elapsedTime * 1000;
         }
      }
    }
  });

  return (
    <>
      {playState.enemies.map((e, idx) => (
        <group key={idx} position={e.position} rotation={[0, e.rotationY || 0, 0]}>
          <mesh castShadow>
            <boxGeometry args={e.scale} />
            <meshStandardMaterial color={e.dead ? '#4b5563' : e.color} />
          </mesh>
          {!e.dead && (
            <group position={[0, e.scale[1]*0.2, (e.scale[2]/2) + 0.01]}>
               <mesh position={[-0.2, 0, 0]}>
                 <boxGeometry args={[0.15, 0.15, 0.05]} />
                 <meshBasicMaterial color="#ffffff" />
               </mesh>
               <mesh position={[0.2, 0, 0]}>
                 <boxGeometry args={[0.15, 0.15, 0.05]} />
                 <meshBasicMaterial color="#ffffff" />
               </mesh>
               {/* pupils */}
               <mesh position={[-0.2, 0, 0.03]}>
                 <boxGeometry args={[0.05, 0.05, 0.05]} />
                 <meshBasicMaterial color="#000000" />
               </mesh>
               <mesh position={[0.2, 0, 0.03]}>
                 <boxGeometry args={[0.05, 0.05, 0.05]} />
                 <meshBasicMaterial color="#000000" />
               </mesh>
            </group>
          )}
        </group>
      ))}
    </>
  );
}

function LevelEnvironment({ objects, mode, selectedId, setSelectedId }: any) {
  return (
    <>
      <Sky distance={450000} sunPosition={[0, 1, 0]} inclination={0} azimuth={0.25} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 20, 10]} intensity={1} castShadow />
      
      {/* Floor with neon grid style */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#0f172a" roughness={0.8} />
      </mesh>
      
      <Grid 
        position={[0, 0, 0]} 
        args={[200, 200]} 
        cellSize={1} 
        cellThickness={0.5} 
        cellColor="#1e293b" 
        sectionSize={5} 
        sectionThickness={1.5} 
        sectionColor="#38bdf8" 
        fadeDistance={50} 
        fadeStrength={1.5} 
      />

      {/* Editor specific helpers */}
      {mode === 'edit' && (
        <gridHelper args={[200, 20, '#334155', '#334155']} position={[0, 0.01, 0]} />
      )}

      {objects.map((obj: any) => {
        if (obj.type === 'wall' || obj.type === 'enemy') {
          return (
            <mesh 
              key={obj.id} 
              position={obj.position} 
              scale={obj.scale}
              onClick={(e) => {
                if (mode === 'edit') {
                  e.stopPropagation();
                  setSelectedId(obj.id);
                }
              }}
            >
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial 
                 color={obj.color} 
                 emissive={selectedId === obj.id ? '#22d3ee' : '#000000'}
                 emissiveIntensity={selectedId === obj.id ? 0.5 : 0}
              />
              {selectedId === obj.id && mode === 'edit' && (
                 <lineSegments>
                   <edgesGeometry args={[new THREE.BoxGeometry(1.05, 1.05, 1.05)]} />
                   <lineBasicMaterial color="#22d3ee" linewidth={2} />
                 </lineSegments>
              )}
            </mesh>
          )
        }
        if (obj.type === 'spawn') {
          return (
             <mesh key={obj.id} position={[obj.position[0], 0.1, obj.position[2]]} rotation={[-Math.PI/2, 0, 0]}>
               <circleGeometry args={[1, 16]} />
               <meshBasicMaterial color="#22d3ee" transparent opacity={mode === 'play' ? 0 : 0.5} />
             </mesh>
          )
        }
        return null;
      })}
    </>
  );
}

export function GameStudioEditor3D({ initialTemplate, onBack }: Editor3DProps) {
  const [mode, setMode] = useState<'edit' | 'play'>('edit');
  const [isPublishing, setIsPublishing] = useState(false);
  const [objects, setObjects] = useState<GameObject3D[]>([]);

  useEffect(() => {
     if (initialTemplate === 'Zombie Survival 3D') {
        const obs: GameObject3D[] = [
           { id: 'spawn', type: 'spawn', position: [0, 0, 0], scale: [1, 1, 1], color: '#22d3ee' },
           // Only a few walls
           { id: 'w1', type: 'wall', position: [-20, 2, -20], scale: [4, 4, 4], color: '#334155' },
           { id: 'w2', type: 'wall', position: [20, 2, 20], scale: [4, 4, 4], color: '#334155' }
        ];
        // Lots of zombies
        for(let i=0; i<15; i++) {
           const angle = Math.random() * Math.PI * 2;
           const dist = 10 + Math.random() * 20;
           obs.push({
              id: 'e_'+i,
              type: 'enemy',
              position: [Math.cos(angle)*dist, 1, Math.sin(angle)*dist],
              scale: [1.2, 2, 1.2],
              color: '#16a34a' // Green zombies
           });
        }
        setObjects(obs);
     } else if (initialTemplate === 'Racing 3D') {
        setObjects([
           { id: 'spawn', type: 'spawn', position: [0, 0, 5], scale: [1, 1, 1], color: '#22d3ee' },
           { id: 'track1', type: 'wall', position: [0, 0.5, -20], scale: [10, 1, 50], color: '#334155' },
           { id: 'track2', type: 'wall', position: [15, 0.5, -40], scale: [20, 1, 10], color: '#334155' },
        ]);
     } else {
        // Default: Shooter 3D
        setObjects([
          { id: 'spawn', type: 'spawn', position: [0, 0, 5], scale: [1, 1, 1], color: '#22d3ee' },
          { id: 'w1', type: 'wall', position: [0, 2, -5], scale: [20, 4, 1], color: '#334155' },
          { id: 'w2', type: 'wall', position: [-10, 2, 5], scale: [1, 4, 20], color: '#334155' },
          { id: 'w3', type: 'wall', position: [10, 2, 5], scale: [1, 4, 20], color: '#334155' },
          { id: 'w4', type: 'wall', position: [0, 2, 15], scale: [20, 4, 1], color: '#334155' },
          { id: 'w5', type: 'wall', position: [0, 2, 0], scale: [4, 4, 4], color: '#ef4444' }, // changed color slightly
          { id: 'e1', type: 'enemy', position: [-5, 1, -2], scale: [1.2, 2, 1.2], color: '#ef4444' },
          { id: 'e2', type: 'enemy', position: [5, 1, 8], scale: [1.2, 2, 1.2], color: '#ef4444' },
          { id: 'e3', type: 'enemy', position: [4, 1, -2], scale: [1.2, 2, 1.2], color: '#ef4444' }
        ]);
     }
  }, [initialTemplate]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [uiScore, setUiScore] = useState(0);
  const [uiHealth, setUiHealth] = useState(3);
  const [uiGameOver, setUiGameOver] = useState(false);

  // Sync state loop for UI
  useEffect(() => {
    if (mode === 'play') {
      const interval = setInterval(() => {
        setUiScore(playState.score);
        setUiHealth(playState.health);
        setUiGameOver(playState.gameOver);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [mode]);

  useEffect(() => {
     const down = (e: KeyboardEvent) => { playState.keys[e.key.toLowerCase()] = true; if(e.code==='Space') playState.isShooting = true; }
     const up = (e: KeyboardEvent) => { playState.keys[e.key.toLowerCase()] = false; }
     window.addEventListener('keydown', down);
     window.addEventListener('keyup', up);
     return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); }
  }, []);

  const handleStartPlay = () => {
    playState.score = 0;
    playState.health = 3;
    playState.gameOver = false;
    playState.won = false;
    playState.bullets = [];
    playState.enemies = [];
    setUiGameOver(false);
    setUiScore(0);
    setUiHealth(3);
    setMode('play');
  };

  const handleStopPlay = () => {
    playState.score = 0;
    playState.bullets = [];
    playState.enemies = [];
    setMode('edit');
  };

  // Joystick handlers
  const joyRef = useRef<HTMLDivElement>(null);
  const joyCenter = useRef({x:0, y:0});
  const joyTouchId = useRef<number | null>(null);
  
  const handleJoyStart = (e: React.TouchEvent | React.MouseEvent | any) => {
    if (!joyRef.current) return;
    const rect = joyRef.current.getBoundingClientRect();
    joyCenter.current = { x: rect.left + rect.width/2, y: rect.top + rect.height/2 };
    
    if (e.changedTouches) {
       joyTouchId.current = e.changedTouches[0].identifier;
    }
    handleJoyMove(e);
  };
  
  const handleJoyMove = (e: React.TouchEvent | React.MouseEvent | any) => {
    if (!joyCenter.current.x) return;
    
    let clientX = e.clientX;
    let clientY = e.clientY;
    
    if (e.changedTouches) {
       let touch = Array.from(e.changedTouches).find((t: any) => t.identifier === joyTouchId.current);
       if (!touch) return;
       clientX = (touch as any).clientX;
       clientY = (touch as any).clientY;
    }
    
    let dx = clientX - joyCenter.current.x;
    let dy = clientY - joyCenter.current.y;
    
    // Normalize
    const dist = Math.sqrt(dx*dx + dy*dy);
    const max = 40;
    if (dist > max) {
       dx = (dx / dist) * max;
       dy = (dy / dist) * max;
    }
    
    playState.joystick.x = dx / max;
    playState.joystick.y = dy / max;
  };
  
  const handleJoyEnd = (e: React.TouchEvent | React.MouseEvent | any) => {
    if (e.changedTouches) {
       let touch = Array.from(e.changedTouches).find((t: any) => t.identifier === joyTouchId.current);
       if (!touch) return;
    }
    playState.joystick.x = 0;
    playState.joystick.y = 0;
    joyCenter.current = {x:0, y:0};
    joyTouchId.current = null;
  };

  // Look Around handlers (Right side)
  const lastTouch = useRef({x:0, y:0});
  const lookTouchId = useRef<number | null>(null);
  
  const handleLookStart = (e: React.TouchEvent | React.MouseEvent | any) => {
     let clientX = e.clientX;
     let clientY = e.clientY;
     
     if (e.changedTouches) {
        let touch = e.changedTouches[0];
        lookTouchId.current = touch.identifier;
        clientX = touch.clientX;
        clientY = touch.clientY;
     }

     lastTouch.current = { x: clientX, y: clientY };
  };
  
  const handleLookMove = (e: React.TouchEvent | React.MouseEvent | any) => {
     if (!lastTouch.current.x) return;
     
     let clientX = e.clientX;
     let clientY = e.clientY;
     
     if (e.changedTouches) {
        let touch = Array.from(e.changedTouches).find((t: any) => t.identifier === lookTouchId.current);
        if (!touch) return;
        clientX = (touch as any).clientX;
        clientY = (touch as any).clientY;
     }
     
     playState.lookDelta.x = clientX - lastTouch.current.x;
     playState.lookDelta.y = clientY - lastTouch.current.y;
     
     lastTouch.current = { x: clientX, y: clientY };
  };
  
  const handleLookEnd = (e: React.TouchEvent | React.MouseEvent | any) => {
     if (e.changedTouches) {
        let touch = Array.from(e.changedTouches).find((t: any) => t.identifier === lookTouchId.current);
        if (!touch) return;
     }
     lastTouch.current = {x:0, y:0};
     lookTouchId.current = null;
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0c10] flex flex-col">
      {/* Header */}
      <div className="bg-[#12141c] border-b border-white/5 py-4 px-4 sm:px-6 flex items-center justify-between z-10 shrink-0 shadow-lg pt-8 sm:pt-4">
         <div className="flex items-center gap-4">
           <button onClick={onBack} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors">
              <ChevronLeft className="w-5 h-5" />
           </button>
           <div>
             <h2 className="text-white font-black text-lg tracking-tight leading-none">Game Studio 3D <span className="ml-2 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-xs uppercase">BETA</span></h2>
             <span className="text-xs text-gray-400 font-medium">Motor WebGL Experto</span>
           </div>
         </div>
         
         <div className="flex items-center gap-3">
           {mode === 'edit' ? (
             <button onClick={handleStartPlay} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-2 rounded-xl font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all">
               <Play className="w-4 h-4" /> <span className="hidden sm:inline">Probar Gameplay</span>
             </button>
           ) : (
             <button onClick={handleStopPlay} className="flex items-center gap-2 bg-red-500 hover:bg-red-400 text-white px-4 py-2 rounded-xl font-bold shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all">
               <Square className="w-4 h-4" /> <span className="hidden sm:inline">Volver a Editor</span>
             </button>
           )}
         </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
         <Canvas shadows camera={{ position: [0, 5, 10], fov: 75 }}>
           {mode === 'edit' && <OrbitControls makeDefault />}
           <LevelEnvironment 
             objects={objects} 
             mode={mode} 
             selectedId={selectedId} 
             setSelectedId={setSelectedId} 
           />
           {mode === 'play' && (
             <>
               <PlayerController 
                 spawn={objects.find(o => o.type === 'spawn')?.position || [0,0,0]} 
                 walls={objects.filter(o => o.type === 'wall')} 
                 enemies={objects.filter(o => o.type === 'enemy')}
               />
               <PlayerWeapon />
               <BulletManager walls={objects.filter(o => o.type === 'wall')} />
               <EnemiesManager enemiesData={objects.filter(o => o.type === 'enemy')} />
             </>
           )}
         </Canvas>

         {/* PLAY MODE UI & CONTROLS */}
         {mode === 'play' && (
           <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between">
              
              {/* HUD */}
              <div className="p-6 flex justify-between items-start">
                 <div className="flex gap-2">
                    {[1, 2, 3].map(i => (
                       <svg key={i} className={`w-8 h-8 ${i <= uiHealth ? 'text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]' : 'text-gray-800'} transition-colors`} fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                       </svg>
                    ))}
                 </div>
                 <div className="text-3xl font-black text-white italic drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                    {uiScore.toString().padStart(5, '0')}
                 </div>
              </div>

              {/* Crosshair */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center opacity-50">
                 <Crosshair className="w-8 h-8 text-white drop-shadow-md" />
              </div>

              {/* Game Over Screen */}
              {uiGameOver && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center flex-col pointer-events-auto backdrop-blur-sm">
                   <h1 className="text-6xl font-black text-red-500 mb-4 drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]">WASTED</h1>
                   <p className="text-2xl text-white font-bold mb-8">Score: {uiScore}</p>
                   <button onClick={handleStartPlay} className="px-8 py-4 bg-white text-black font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-transform">Intentar de Nuevo</button>
                </div>
              )}

              {/* Mobile Controls Envelope */}
              <div className="h-full w-full flex">
                 {/* Left side: Movement Joystick */}
                 <div 
                   className="flex-1 pointer-events-auto flex items-end justify-start p-8"
                   onTouchStart={handleJoyStart} onTouchMove={handleJoyMove} onTouchEnd={handleJoyEnd}
                   onMouseDown={handleJoyStart} onMouseMove={handleJoyMove} onMouseUp={handleJoyEnd} onMouseLeave={handleJoyEnd}
                 >
                    <div ref={joyRef} className="w-32 h-32 bg-white/10 rounded-full border border-white/20 relative flex items-center justify-center backdrop-blur-md">
                       <div className="w-12 h-12 bg-white/50 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.5)]" style={{ transform: `translate(${playState.joystick.x*40}px, ${playState.joystick.y*40}px)` }}></div>
                    </div>
                 </div>
                 
                 {/* Right side: Look drag & Shoot */}
                 <div 
                   className="flex-1 pointer-events-auto relative flex items-end justify-end p-8"
                   onTouchStart={handleLookStart} onTouchMove={handleLookMove} onTouchEnd={handleLookEnd}
                   onMouseDown={handleLookStart} onMouseMove={handleLookMove} onMouseUp={handleLookEnd} onMouseLeave={handleLookEnd}
                 >
                    <button 
                       className="w-24 h-24 bg-red-500/50 rounded-full border border-red-400/50 flex items-center justify-center active:scale-95 active:bg-red-500/80 transition-all backdrop-blur-md"
                       onTouchStart={(e) => { e.stopPropagation(); playState.isShooting = true; }}
                       onMouseDown={(e) => { e.stopPropagation(); playState.isShooting = true; }}
                    >
                       <Crosshair className="w-10 h-10 text-white" />
                    </button>
                 </div>
              </div>
           </div>
         )}

         {/* EDITOR CONTROLS */}
         {mode === 'edit' && (
           <div className="absolute right-4 top-4 bg-[#12141c]/90 backdrop-blur-md border border-white/10 p-4 rounded-xl w-64 shadow-2xl flex flex-col gap-4 max-h-[80vh] overflow-y-auto">
             <h3 className="text-white font-bold mb-2">Añadir Entidad</h3>
             <div className="grid grid-cols-2 gap-2 mb-4">
                <button onClick={() => setObjects([...objects, { id: 'w_'+Date.now(), type: 'wall', position: [0, 2, 0], scale: [4, 4, 4], color: '#334155' }])} className="bg-white/5 hover:bg-white/10 p-3 rounded-lg text-white text-xs font-bold flex flex-col items-center gap-1"><Square className="w-5 h-5"/> Muro</button>
                <button onClick={() => setObjects([...objects, { id: 'e_'+Date.now(), type: 'enemy', position: [0, 1, 0], scale: [1.2, 2, 1.2], color: '#ef4444' }])} className="bg-red-500/10 hover:bg-red-500/20 text-red-500 p-3 rounded-lg text-xs font-bold flex flex-col items-center gap-1"><PlusCircle className="w-5 h-5"/> Enemigo</button>
             </div>

             {selectedId && (
               <div className="border-t border-white/10 pt-4">
                  <h4 className="text-cyan-400 font-bold text-sm mb-3">Propiedades</h4>
                  {objects.filter(o => o.id === selectedId).map(obj => (
                     <div key={obj.id} className="space-y-3">
                        <div>
                           <label className="text-xs text-gray-400 block mb-1">Posición X</label>
                           <input type="number" value={obj.position[0]} onChange={(e) => setObjects(objects.map(o => o.id===obj.id ? {...o, position: [parseFloat(e.target.value), o.position[1], o.position[2]]} : o))} className="w-full bg-black/50 text-white px-3 py-1.5 rounded border border-white/10 text-sm" />
                        </div>
                        <div>
                           <label className="text-xs text-gray-400 block mb-1">Posición Z (Profundidad)</label>
                           <input type="number" value={obj.position[2]} onChange={(e) => setObjects(objects.map(o => o.id===obj.id ? {...o, position: [o.position[0], o.position[1], parseFloat(e.target.value)]} : o))} className="w-full bg-black/50 text-white px-3 py-1.5 rounded border border-white/10 text-sm" />
                        </div>
                        {obj.type === 'wall' && (
                           <>
                           <div>
                              <label className="text-xs text-gray-400 block mb-1">Ancho</label>
                              <input type="number" value={obj.scale[0]} onChange={(e) => setObjects(objects.map(o => o.id===obj.id ? {...o, scale: [parseFloat(e.target.value), o.scale[1], o.scale[2]]} : o))} className="w-full bg-black/50 text-white px-3 py-1.5 rounded border border-white/10 text-sm" />
                           </div>
                           <div>
                              <label className="text-xs text-gray-400 block mb-1">Profundidad</label>
                              <input type="number" value={obj.scale[2]} onChange={(e) => setObjects(objects.map(o => o.id===obj.id ? {...o, scale: [o.scale[0], o.scale[1], parseFloat(e.target.value)]} : o))} className="w-full bg-black/50 text-white px-3 py-1.5 rounded border border-white/10 text-sm" />
                           </div>
                           </>
                        )}
                        <button onClick={() => { setObjects(objects.filter(o => o.id !== obj.id)); setSelectedId(null); }} className="w-full mt-2 bg-red-500/20 text-red-500 font-bold text-xs py-2 rounded">ELIMINAR</button>
                     </div>
                  ))}
               </div>
             )}
           </div>
         )}
      </div>
    </div>
  );
}

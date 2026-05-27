import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sky, Text, Box, Sphere, Cylinder, OrbitControls, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { Play, Square, Save, Upload, RotateCcw, Check, Settings, ChevronLeft, Move, Crosshair, PlusCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface GameObject3D {
  id: string;
  type: 'wall' | 'enemy' | 'pickup' | 'spawn' | 'finish';
  position: [number, number, number];
  scale: [number, number, number];
  color: string;
}

interface Editor3DProps {
  initialTemplate: string;
  onBack: () => void;
}

// Global lightweight Web Audio helper for 3D Game Synth sounds
class WebAudio3DSynth {
  ctx: AudioContext | null = null;

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  playLaser() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.15);
    
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  playZombieGrowl() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(90, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(50, this.ctx.currentTime + 0.35);
    
    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.35);
  }

  playDrift() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(220, this.ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  playHurt() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(30, this.ctx.currentTime + 0.25);
    
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }

  playExplosion() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(100, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(10, this.ctx.currentTime + 0.4);
    
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.4);
  }

  playScoreUp() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.setValueAtTime(800, this.ctx.currentTime + 0.08);
    osc.frequency.setValueAtTime(1200, this.ctx.currentTime + 0.16);
    
    gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }
}

const audio3D = new WebAudio3DSynth();

// Global 3D mutable physics state container
const playState = {
  score: 0,
  health: 3,
  gameOver: false,
  won: false,
  bullets: [] as any[],
  enemies: [] as any[],
  pickups: [] as any[],
  keys: {} as Record<string, boolean>,
  joystick: { x: 0, y: 0 },
  lookDelta: { x: 0, y: 0 },
  isShooting: false,
  lastShot: 0,
  // Car driving specific parameters
  carSpeed: 0,
  carRotationY: 0,
  carPosition: new THREE.Vector3(0, 0, 0),
  carCheckpointCount: 0,
  laps: 0
};

// Character Voxel Zombie Render
function VoxelZombie({ dead, rotationY }: { dead: boolean; rotationY: number }) {
  const armBob = useRef(0);
  
  useFrame((state) => {
    if (dead) return;
    armBob.current = Math.sin(state.clock.elapsedTime * 8) * 0.4;
  });

  return (
    <group rotation={[0, rotationY, 0]}>
      {/* Voxel Torso */}
      <mesh castShadow position={[0, 0.45, 0]}>
        <boxGeometry args={[0.9, 1.0, 0.5]} />
        <meshStandardMaterial color={dead ? '#1e293b' : '#047857'} roughness={0.7} />
      </mesh>
      
      {/* Creepy Head */}
      <mesh castShadow position={[0, 1.25, 0]}>
        <boxGeometry args={[0.7, 0.6, 0.7]} />
        <meshStandardMaterial color={dead ? '#475569' : '#059669'} roughness={0.7} />
      </mesh>

      {/* Voxel Arms Bobbing out */}
      <group position={[0, 0.7, 0.3]}>
        {/* Left Arm */}
        <mesh castShadow position={[-0.55, armBob.current, 0.2]} rotation={[Math.PI / 2, 0, 0]}>
          <boxGeometry args={[0.25, 0.3, 0.9]} />
          <meshStandardMaterial color={dead ? '#1e293b' : '#06b6d4'} roughness={0.7} />
        </mesh>
        {/* Right Arm */}
        <mesh castShadow position={[0.55, -armBob.current, 0.2]} rotation={[Math.PI / 2, 0, 0]}>
          <boxGeometry args={[0.25, 0.3, 0.9]} />
          <meshStandardMaterial color={dead ? '#1e293b' : '#06b6d4'} roughness={0.7} />
        </mesh>
      </group>

      {/* Red Glistening eyes */}
      {!dead && (
        <group position={[0, 1.3, 0.36]}>
          <mesh position={[-0.2, 0, 0]}>
            <boxGeometry args={[0.15, 0.1, 0.05]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>
          <mesh position={[0.2, 0, 0]}>
            <boxGeometry args={[0.15, 0.1, 0.05]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>
        </group>
      )}
    </group>
  );
}

// Low Poly Cyber Sports Car Render
function NeonSportsCar({ position, rotationY }: { position: THREE.Vector3; rotationY: number }) {
  const wheelRotateRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (wheelRotateRef.current && playState.carSpeed !== 0) {
      wheelRotateRef.current.rotation.x += playState.carSpeed * delta * 5;
    }
  });

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Lower chassis */}
      <mesh castShadow position={[0, 0.25, 0]}>
        <boxGeometry args={[1.8, 0.4, 3.6]} />
        <meshStandardMaterial color="#06b6d4" roughness={0.2} metalness={0.9} emissive="#083344" />
      </mesh>

      {/* Upper cockpit */}
      <mesh castShadow position={[0, 0.65, -0.2]}>
        <boxGeometry args={[1.3, 0.5, 1.8]} />
        <meshStandardMaterial color="#1e293b" roughness={0.0} metalness={1.0} />
      </mesh>

      {/* Neon glowing trail exhaust glow */}
      <mesh position={[0, 0.25, 1.81]}>
        <boxGeometry args={[1.2, 0.1, 0.05]} />
        <meshBasicMaterial color="#f43f5e" />
      </mesh>

      {/* 4 Spinning wheels */}
      <group ref={wheelRotateRef}>
        {/* Front Wheels */}
        <mesh position={[-1.0, 0.2, -1.0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.4, 0.4, 0.3, 16]} />
          <meshStandardMaterial color="#0c0a09" roughness={0.9} />
        </mesh>
        <mesh position={[1.0, 0.2, -1.0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.4, 0.4, 0.3, 16]} />
          <meshStandardMaterial color="#0c0a09" roughness={0.9} />
        </mesh>
        {/* Rear Wheels */}
        <mesh position={[-1.0, 0.2, 1.0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.4, 0.4, 0.3, 16]} />
          <meshStandardMaterial color="#0c0a09" roughness={0.9} />
        </mesh>
        <mesh position={[1.0, 0.2, 1.0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.4, 0.4, 0.3, 16]} />
          <meshStandardMaterial color="#0c0a09" roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
}

// FP Shooter HUD and Weapon Display
function PlayerWeapon() {
  const { camera } = useThree();
  const group = useRef<THREE.Group>(null);
  const recoilParams = useRef({ current: 0, target: 0 });

  useFrame((state, delta) => {
    if (!group.current) return;
    group.current.position.copy(camera.position);
    group.current.quaternion.copy(camera.quaternion);

    // Dynamic recoil kicks back gun mesh on shoot
    if (playState.isShooting) {
      recoilParams.current.target = 0.15;
    }
    recoilParams.current.current = THREE.MathUtils.lerp(recoilParams.current.current, recoilParams.current.target, delta * 14);
    recoilParams.current.target = THREE.MathUtils.lerp(recoilParams.current.target, 0, delta * 8);
    
    group.current.translateZ(recoilParams.current.current);
  });

  return (
    <group ref={group}>
      <group position={[0.26, -0.28, -0.45]}>
         {/* Cyber Laser Pistol */}
         <mesh castShadow>
           <boxGeometry args={[0.08, 0.08, 0.4]} />
           <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.2} />
         </mesh>
         <mesh position={[0, -0.08, 0.08]} castShadow>
            <boxGeometry args={[0.06, 0.14, 0.08]} />
            <meshStandardMaterial color="#0f172a" />
         </mesh>
         {/* Neon core barrel glow */}
         <mesh position={[0, 0, -0.21]}>
            <boxGeometry args={[0.04, 0.04, 0.02]} />
            <meshBasicMaterial color="#06b6d4" />
         </mesh>
      </group>
    </group>
  );
}

// 3D Player / Camera Physical controller
function PlayerController({ spawn, walls, template }: any) {
  const { camera } = useThree();
  const playerRef = useRef(new THREE.Vector3(...spawn));
  const euler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));
  
  useEffect(() => {
    camera.position.set(spawn[0], 1.6, spawn[2]);
    playerRef.current.set(spawn[0], 1.6, spawn[2]);
    // Reset view heading direction
    euler.current.set(0, 0, 0, 'YXZ');
  }, [spawn, camera]);

  useFrame((state, delta) => {
    if (playState.gameOver || playState.won) return;

    if (template === 'Racing 3D') {
      // 3D CAR CHASE DRIVING SCHEMAS (Third Person Space)
      const maxCarSpeed = 42.0;
      let accelInput = 0;
      let turnInput = 0;

      if (playState.keys['arrowup'] || playState.keys['w']) accelInput = 1;
      if (playState.keys['arrowdown'] || playState.keys['s']) accelInput = -1;
      if (playState.keys['arrowleft'] || playState.keys['a']) turnInput = 1;
      if (playState.keys['arrowright'] || playState.keys['d']) turnInput = -1;

      // Joystick bindings
      if (playState.joystick.y !== 0) accelInput = -playState.joystick.y;
      if (playState.joystick.x !== 0) turnInput = -playState.joystick.x;

      // Acceleration mechanics
      if (accelInput !== 0) {
        playState.carSpeed = THREE.MathUtils.lerp(playState.carSpeed, accelInput * maxCarSpeed, delta * 2.5);
        if (Math.abs(playState.carSpeed) > 10 && Math.random() < 0.25) {
          audio3D.playDrift(); // Play engine/tire synth hums
        }
      } else {
        playState.carSpeed = THREE.MathUtils.lerp(playState.carSpeed, 0, delta * 1.5);
      }

      // Turn mechanics
      if (Math.abs(playState.carSpeed) > 1) {
        const turnSpeed = playState.carSpeed > 0 ? 2.5 : -2.5;
        playState.carRotationY += turnInput * turnSpeed * delta;
      }

      // Compute vector step ahead
      const nextPos = playState.carPosition.clone();
      nextPos.x += Math.sin(playState.carRotationY) * playState.carSpeed * delta;
      nextPos.z += Math.cos(playState.carRotationY) * playState.carSpeed * delta;

      // Basic Wall crash clip logic
      let crash = false;
      for (const w of walls) {
        if (
          nextPos.x > w.position[0] - w.scale[0]/2 - 0.8 &&
          nextPos.x < w.position[0] + w.scale[0]/2 + 0.8 &&
          nextPos.z > w.position[2] - w.scale[2]/2 - 0.8 &&
          nextPos.z < w.position[2] + w.scale[2]/2 + 0.8
        ) {
          crash = true;
          break;
        }
      }

      if (!crash) {
        playState.carPosition.copy(nextPos);
        playState.score = Math.floor(playState.carPosition.distanceTo(new THREE.Vector3(...spawn)) * 10);
      } else {
        // Crash rebound
        playState.carSpeed = -playState.carSpeed * 0.4;
        audio3D.playHurt();
      }

      // Position chase follow cam behind neon car
      const camOffset = new THREE.Vector3(
        -Math.sin(playState.carRotationY) * 9,
        5.2,
        -Math.cos(playState.carRotationY) * 9
      );
      camera.position.copy(playState.carPosition).add(camOffset);
      camera.lookAt(playState.carPosition.clone().add(new THREE.Vector3(0, 1, 0)));

    } else {
      // 3D FIRST PERSON SHOOTER CONTROLLER
      const moveSpeed = template === 'Zombie Survival 3D' ? 9.5 : 8.0;
      let fwd = 0;
      let right = 0;

      if (playState.keys['w']) fwd = 1;
      if (playState.keys['s']) fwd = -1;
      if (playState.keys['a']) right = -1;
      if (playState.keys['d']) right = 1;

      // Joystick parameters
      if (playState.joystick.y !== 0) fwd = -playState.joystick.y;
      if (playState.joystick.x !== 0) right = playState.joystick.x;

      // View angles look drag setup
      euler.current.y -= playState.lookDelta.x * 0.005;
      euler.current.x -= playState.lookDelta.y * 0.005;
      euler.current.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, euler.current.x));
      camera.quaternion.setFromEuler(euler.current);

      playState.lookDelta.x *= 0.75;
      playState.lookDelta.y *= 0.75;

      const camDir = new THREE.Vector3();
      camera.getWorldDirection(camDir);
      camDir.y = 0;
      camDir.normalize();
      
      const camRight = new THREE.Vector3();
      camRight.crossVectors(camera.up, camDir).normalize();

      const moveStep = new THREE.Vector3();
      moveStep.addScaledVector(camDir, fwd * moveSpeed * delta);
      moveStep.addScaledVector(camRight, -right * moveSpeed * delta);

      let hitWall = false;
      const nextPos = playerRef.current.clone().add(moveStep);
      
      for(const w of walls) {
        if (
          nextPos.x > w.position[0] - w.scale[0]/2 - 0.6 &&
          nextPos.x < w.position[0] + w.scale[0]/2 + 0.6 &&
          nextPos.z > w.position[2] - w.scale[2]/2 - 0.6 &&
          nextPos.z < w.position[2] + w.scale[2]/2 + 0.6
        ) {
           hitWall = true;
           break;
        }
      }

      if (!hitWall) {
        playerRef.current.copy(nextPos);
      }
      camera.position.copy(playerRef.current);

      // Shooting controller
      if (playState.isShooting && state.clock.elapsedTime * 1000 - playState.lastShot > 250) {
        audio3D.playLaser();
        playState.bullets.push({
          id: Math.random(),
          position: camera.position.clone().add(camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(0.8)),
          velocity: camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(45),
          life: 1.8
        });
        playState.lastShot = state.clock.elapsedTime * 1000;
        playState.isShooting = false;
      }
    }
  });

  return null;
}

// 3D Instanced Bullet management & Particle Core particles
function BulletManager({ walls }: any) {
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
      
      for (const w of walls) {
        if (
          b.position.x > w.position[0] - w.scale[0]/2 &&
          b.position.x < w.position[0] + w.scale[0]/2 &&
          b.position.z > w.position[2] - w.scale[2]/2 &&
          b.position.z < w.position[2] + w.scale[2]/2 &&
          b.position.y > 0 && b.position.y < w.scale[1]
        ) {
          hit = true; 
          break;
        }
      }

      for (let j = playState.enemies.length - 1; j >= 0; j--) {
        const e = playState.enemies[j];
        if (!e.dead && b.position.distanceTo(e.position) < 1.6) {
          hit = true;
          e.hp -= 1;
          audio3D.playHurt();

          if (e.hp <= 0) {
            e.dead = true;
            playState.score += 150;
            audio3D.playExplosion();
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
      <sphereGeometry args={[0.15, 8, 8]} />
      <meshBasicMaterial color="#38bdf8" />
    </instancedMesh>
  );
}

// 3D Zombie / Alien AI managers
function EnemiesManager({ enemiesData, template }: any) {
  const { camera } = useThree();
  
  useEffect(() => {
    playState.enemies = enemiesData.map((e: any) => ({
      ...e,
      position: new THREE.Vector3(...e.position),
      hp: template === 'Zombie Survival 3D' ? 2 : 3,
      dead: false,
      lastAttack: 0,
       rotationY: 0
    }));
  }, [enemiesData]);

  useFrame((state, delta) => {
    if (playState.gameOver || playState.won) return;

    const targetPos = template === 'Racing 3D' ? playState.carPosition : camera.position;

    for (const e of playState.enemies) {
      if (e.dead) {
         if (e.position.y > -2) e.position.y -= delta * 4;
         continue;
      }

      const dist = e.position.distanceTo(targetPos);
      const dir = targetPos.clone().sub(e.position).normalize();
      dir.y = 0;
      
      if (dir.lengthSq() > 0.0001) {
         e.rotationY = Math.atan2(dir.x, dir.z);
      }
      
      // AI movement logic towards camera player
      const activeSeekDist = template === 'Racing 3D' ? 30 : 25;
      if (dist < activeSeekDist && dist > 1.6) {
         const pathSpeed = template === 'Zombie Survival 3D' ? 3.2 : 2.5;
         e.position.addScaledVector(dir, delta * pathSpeed);
         
         // Ambient growls
         if (template === 'Zombie Survival 3D' && Math.random() < 0.003) {
           audio3D.playZombieGrowl();
         }
      } else if (dist <= 1.6) {
         // Punch hit event
         if (state.clock.elapsedTime * 1000 - e.lastAttack > 1200) {
           playState.health -= 1;
           audio3D.playHurt();
           if (playState.health <= 0) playState.gameOver = true;
           e.lastAttack = state.clock.elapsedTime * 1000;
         }
      }
    }
  });

  return (
    <>
      {playState.enemies.map((e, idx) => (
        <group key={idx} position={e.position}>
          <VoxelZombie dead={e.dead} rotationY={e.rotationY || 0} />
        </group>
      ))}
    </>
  );
}

// Float floating rotating coins/points pickups
function FloatingPickups({ pickupsData, template }: any) {
  useFrame((state, delta) => {
    if (playState.gameOver) return;
    const playerPos = template === 'Racing 3D' ? playState.carPosition : state.camera.position;

    for (let i = playState.pickups.length - 1; i >= 0; i--) {
       const pk = playState.pickups[i];
       if (pk.collected) continue;

       // Spin pickups
       pk.rotationY += delta * 2;

       // AABB Box intersection
       if (pk.position.distanceTo(playerPos) < 2.0) {
         pk.collected = true;
         audio3D.playScoreUp();
         playState.score += 250;
       }
    }
  });

  return (
    <>
      {playState.pickups.map((pk, idx) => {
        if (pk.collected) return null;
        return (
          <group key={idx} position={pk.position} rotation={[0, pk.rotationY || 0, 0]}>
             {/* Neon glowing floating gem */}
             <mesh castShadow>
               <octahedronGeometry args={[0.6, 0]} />
               <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.6} metalness={0.9} />
             </mesh>
          </group>
        );
      })}
    </>
  );
}

function LevelEnvironment({ objects, mode, selectedId, setSelectedId, template }: any) {
  // Reset pickups container
  useEffect(() => {
    playState.pickups = objects
      .filter((o: any) => o.type === 'pickup')
      .map((o: any) => ({
         ...o,
         position: new THREE.Vector3(...o.position),
         collected: false,
         rotationY: Math.random() * Math.PI
      }));
  }, [objects]);

  return (
    <>
      {/* Dynamic sky dome colors matching theme context */}
      <Sky 
        distance={450000} 
        sunPosition={template === 'Zombie Survival 3D' ? [0, -0.05, -1] : [0, 1, 0]} 
        inclination={template === 'Zombie Survival 3D' ? 0.6 : 0} 
        azimuth={0.25} 
      />
      <ambientLight intensity={template === 'Zombie Survival 3D' ? 0.15 : 0.6} />
      <directionalLight position={[10, 25, 10]} intensity={template === 'Zombie Survival 3D' ? 0.35 : 1.2} castShadow />
      
      {/* Floor with neon grids */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[300, 300]} />
        <meshStandardMaterial color={template === 'Zombie Survival 3D' ? '#022c22' : '#020617'} roughness={0.9} />
      </mesh>
      
      <Grid 
        position={[0, 0, 0]} 
        args={[300, 300]} 
        cellSize={1} 
        cellThickness={0.5} 
        cellColor={template === 'Zombie Survival 3D' ? '#047857' : '#1e293b'} 
        sectionSize={10} 
        sectionThickness={1.8} 
        sectionColor={template === 'Zombie Survival 3D' ? '#10b981' : '#0891b2'} 
        fadeDistance={90} 
        fadeStrength={1.8} 
      />

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
                 roughness={0.2}
                 metalness={0.8}
                 emissive={selectedId === obj.id ? '#06b6d4' : '#000000'}
                 emissiveIntensity={selectedId === obj.id ? 0.6 : 0}
              />
              {selectedId === obj.id && mode === 'edit' && (
                 <lineSegments>
                   <edgesGeometry args={[new THREE.BoxGeometry(1.06, 1.06, 1.06)]} />
                   <lineBasicMaterial color="#22d3ee" linewidth={3} />
                 </lineSegments>
              )}
            </mesh>
          )
        }
        if (obj.type === 'spawn') {
          return (
             <mesh key={obj.id} position={[obj.position[0], 0.1, obj.position[2]]} rotation={[-Math.PI/2, 0, 0]}>
               <circleGeometry args={[1.5, 32]} />
               <meshBasicMaterial color="#22d3ee" transparent opacity={mode === 'play' ? 0 : 0.6} />
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
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // States mirroring playState for clean React HUD bindings
  const [uiScore, setUiScore] = useState(0);
  const [uiHealth, setUiHealth] = useState(3);
  const [uiGameOver, setUiGameOver] = useState(false);
  const [carModeVisual, setCarModeVisual] = useState(false);

  useEffect(() => {
     setCarModeVisual(initialTemplate === 'Racing 3D');

     if (initialTemplate === 'Zombie Survival 3D') {
        const obs: GameObject3D[] = [
           { id: 'spawn', type: 'spawn', position: [0, 0, 0], scale: [1, 1, 1], color: '#22d3ee' },
           // Moonlight ruined walls
           { id: 'ruin1', type: 'wall', position: [-15, 3, -15], scale: [6, 6, 2], color: '#14532d' },
           { id: 'ruin2', type: 'wall', position: [15, 3, 15], scale: [2, 6, 8], color: '#14532d' },
           { id: 'ruin3', type: 'wall', position: [-25, 3, 25], scale: [8, 6, 2], color: '#14532d' },
           { id: 'ruin4', type: 'wall', position: [25, 3, -25], scale: [2, 6, 6], color: '#14532d' },
        ];
        // Populate creepy zombie models
        for(let i=0; i<12; i++) {
           const angle = Math.random() * Math.PI * 2;
           const dist = 12 + Math.random() * 22;
           obs.push({
              id: 'z_' + i,
              type: 'enemy',
              position: [Math.cos(angle)*dist, 1, Math.sin(angle)*dist],
              scale: [1.3, 2, 1.3],
              color: '#047857' 
           });
        }
        // Floating health crystal pickups
        for (let j=0; j<5; j++) {
           const angle = Math.random() * Math.PI * 2;
           const dist = 8 + Math.random() * 15;
           obs.push({
              id: 'gem_' + j,
              type: 'pickup',
              position: [Math.cos(angle)*dist, 1.2, Math.sin(angle)*dist],
              scale: [1, 1, 1],
              color: '#fbbf24'
           });
        }
        setObjects(obs);
     } else if (initialTemplate === 'Racing 3D') {
        // Build Formula Race loop
        setObjects([
           { id: 'spawn', type: 'spawn', position: [0, 0, 0], scale: [1, 1, 1], color: '#22d3ee' },
           // Track barriers (walls arranged in a racing circuit loop)
           { id: 'tr_left', type: 'wall', position: [-8, 2, 0], scale: [1, 4, 80], color: '#1e1b4b' },
           { id: 'tr_right', type: 'wall', position: [8, 2, 0], scale: [1, 4, 80], color: '#1e1b4b' },

           // Hairpin curve walls
           { id: 'tr_curve_in', type: 'wall', position: [16, 2, -40], scale: [32, 4, 1], color: '#1e1b4b' },
           { id: 'tr_curve_out', type: 'wall', position: [16, 2, -56], scale: [48, 4, 1], color: '#1e1b4b' },

           // Return lane
           { id: 'tr_ret_left', type: 'wall', position: [40, 2, 0], scale: [1, 4, 80], color: '#1e1b4b' },
           { id: 'tr_ret_right', type: 'wall', position: [24, 2, 0], scale: [1, 4, 80], color: '#1e1b4b' },

           // Checkpoint gems
           { id: 'nitro1', type: 'pickup', position: [0, 1.2, -20], scale: [1, 1, 1], color: '#ea580c' },
           { id: 'nitro2', type: 'pickup', position: [16, 1.2, -48], scale: [1, 1, 1], color: '#ea580c' },
           { id: 'nitro3', type: 'pickup', position: [32, 1.2, -20], scale: [1, 1, 1], color: '#ea580c' },
           { id: 'nitro4', type: 'pickup', position: [32, 1.2, 10], scale: [1, 1, 1], color: '#ea580c' },
        ]);
     } else {
        // Futuristic Cyber Arena
        setObjects([
          { id: 'spawn', type: 'spawn', position: [0, 0, 15], scale: [1, 1, 1], color: '#22d3ee' },
          { id: 'wall_n', type: 'wall', position: [0, 3, -25], scale: [50, 6, 1], color: '#0f172a' },
          { id: 'wall_s', type: 'wall', position: [0, 3, 25], scale: [50, 6, 1], color: '#0f172a' },
          { id: 'wall_e', type: 'wall', position: [25, 3, 0], scale: [1, 6, 50], color: '#0f172a' },
          { id: 'wall_w', type: 'wall', position: [-25, 3, 0], scale: [1, 6, 50], color: '#0f172a' },
          
          // Tactical Sci-Fi shield covers
          { id: 'cov1', type: 'wall', position: [0, 1.5, 6], scale: [12, 3, 1.5], color: '#1e293b' },
          { id: 'cov2', type: 'wall', position: [-10, 2, -4], scale: [5, 4, 5], color: '#334155' },
          { id: 'cov3', type: 'wall', position: [10, 2, -4], scale: [5, 4, 5], color: '#334155' },
          
          // Enemies
          { id: 'e1', type: 'enemy', position: [-6, 1, -2], scale: [1.2, 2, 1.2], color: '#047857' },
          { id: 'e2', type: 'enemy', position: [6, 1, -2], scale: [1.2, 2, 1.2], color: '#047857' },
          { id: 'e3', type: 'enemy', position: [0, 1, -10], scale: [1.2, 2, 1.2], color: '#047857' },
          
          // Golden Coins
          { id: 'gp1', type: 'pickup', position: [-10, 1.2, 10], scale: [1, 1, 1], color: '#fbbf24' },
          { id: 'gp2', type: 'pickup', position: [10, 1.2, 10], scale: [1, 1, 1], color: '#fbbf24' },
        ]);
     }
  }, [initialTemplate]);

  // Sync state loops for React HUD HUD rendering overlay
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
     const down = (e: KeyboardEvent) => { 
       playState.keys[e.key.toLowerCase()] = true; 
       if(e.code==='Space') {
         playState.isShooting = true; 
       }
     }
     const up = (e: KeyboardEvent) => { 
       playState.keys[e.key.toLowerCase()] = false; 
     }
     window.addEventListener('keydown', down);
     window.addEventListener('keyup', up);
     return () => { 
       window.removeEventListener('keydown', down); 
       window.removeEventListener('keyup', up); 
     }
  }, []);

  const handleStartPlay = () => {
    audio3D.init();
    playState.score = 0;
    playState.health = 4;
    playState.gameOver = false;
    playState.won = false;
    playState.bullets = [];
    playState.enemies = [];
    // Reset car mechanics
    playState.carSpeed = 0;
    playState.carRotationY = 0;
    playState.carPosition.set(0, 0, 0);

    setUiGameOver(false);
    setUiScore(0);
    setUiHealth(4);
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
    playState.joystick.x = 0;
    playState.joystick.y = 0;
    joyCenter.current = {x:0, y:0};
    joyTouchId.current = null;
  };

  // Drag look around handler (right side touch envelope)
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
     lastTouch.current = {x:0, y:0};
     lookTouchId.current = null;
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] bg-[#030712] flex flex-col w-screen h-screen m-0 p-0 overflow-hidden left-0 top-0">
      
      {/* Dynamic Header */}
      <div className="bg-[#0b0f19] border-b border-white/5 py-4 px-6 flex items-center justify-between z-[100] shrink-0 shadow-lg pt-8 sm:pt-4">
         <div className="flex items-center gap-4">
           <button onClick={onBack} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-all cursor-pointer">
              <ChevronLeft className="w-5 h-5" />
           </button>
           <div>
             <h2 className="text-white font-black text-lg tracking-tight">
               Games Studio <span className="ml-2 px-2 py-0.5 rounded-md bg-cyan-500/15 border border-cyan-500/20 text-cyan-400 text-[10px] font-bold uppercase tracking-widest font-mono">3D RENDER</span>
             </h2>
             <span className="text-xs text-gray-400 font-mono">{initialTemplate} Game Engine</span>
           </div>
         </div>
         
         <div className="flex items-center gap-3">
           {mode === 'edit' ? (
             <button onClick={handleStartPlay} className="flex items-center gap-2 bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-black px-5 py-2.5 rounded-xl font-bold font-mono shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-all cursor-pointer">
               <Play className="w-4.5 h-4.5 fill-black" /> ENTRAR GAMEPLAY
             </button>
           ) : (
             <button onClick={handleStopPlay} className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-5 py-2.5 rounded-xl font-bold font-mono shadow-[0_0_20px_rgba(244,63,94,0.35)] transition-all cursor-pointer">
               <Square className="w-4.5 h-4.5 fill-white" /> SALIR A EDITOR
             </button>
           )}
         </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
          
          <Canvas shadows camera={{ position: [0, 6, 14], fov: 70 }}>
            {mode === 'edit' && <OrbitControls makeDefault />}
            
            <LevelEnvironment 
              objects={objects} 
              mode={mode} 
              selectedId={selectedId} 
              setSelectedId={setSelectedId} 
              template={initialTemplate}
            />

            {mode === 'play' && (
              <>
                <PlayerController 
                  spawn={objects.find(o => o.type === 'spawn')?.position || [0,0,0]} 
                  walls={objects.filter(o => o.type === 'wall')} 
                  template={initialTemplate}
                />
                
                {!carModeVisual && <PlayerWeapon />}
                {carModeVisual && <NeonSportsCar position={playState.carPosition} rotationY={playState.carRotationY} />}

                <BulletManager walls={objects.filter(o => o.type === 'wall')} />
                <EnemiesManager enemiesData={objects.filter(o => o.type === 'enemy')} template={initialTemplate} />
                <FloatingPickups pickupsData={objects.filter(o => o.type === 'pickup')} template={initialTemplate} />
              </>
            )}
          </Canvas>

          {/* PLAY IN-GAME HUD LAYERS */}
          {mode === 'play' && (
            <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between">
               
               {/* CORE HUD */}
               <div className="p-6 flex justify-between items-start">
                  <div className="flex gap-2">
                     {[1, 2, 3, 4].map(i => (
                        <svg key={i} className={`w-8 h-8 ${i <= uiHealth ? 'text-rose-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]' : 'text-gray-800'} transition-colors`} fill="currentColor" viewBox="0 0 24 24">
                           <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        </svg>
                     ))}
                  </div>
                  <div className="text-3xl font-black font-mono text-cyan-400 drop-shadow-[0_0_12px_rgba(6,182,212,0.4)]">
                     {uiScore.toString().padStart(6, '0')} PTS
                  </div>
               </div>

               {/* FP CROSSHAIR (Only for Shooter template profiles) */}
               {!carModeVisual && (
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center opacity-60">
                    <Crosshair className="w-8 h-8 text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]" />
                 </div>
               )}

               {/* GAME OVER CARD OVERLAY */}
               {uiGameOver && (
                 <div className="absolute inset-0 bg-[#020617]/95 flex items-center justify-center flex-col pointer-events-auto backdrop-blur-md">
                    <h1 className="text-6xl font-black text-rose-500 mb-4 drop-shadow-[0_0_20px_rgba(239,68,68,0.8)] leading-none font-mono">WASTED</h1>
                     <p className="text-xl text-gray-400 font-mono mb-8">Puntuación de Sesión: {uiScore}</p>
                    <button onClick={handleStartPlay} className="px-8 py-3.5 bg-gradient-to-r from-emerald-400 to-teal-500 text-black font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer">Intentar de Nuevo</button>
                 </div>
               )}

               {/* ON-SCREEN MOBILE JOYSTICK DRAG AND TOUCH COVERS */}
               <div className="h-full w-full flex">
                  {/* Left joystick pad */}
                  <div 
                    className="flex-1 pointer-events-auto flex items-end justify-start p-8"
                    onTouchStart={handleJoyStart} onTouchMove={handleJoyMove} onTouchEnd={handleJoyEnd}
                    onMouseDown={handleJoyStart} onMouseMove={handleJoyMove} onMouseUp={handleJoyEnd} onMouseLeave={handleJoyEnd}
                  >
                     <div ref={joyRef} className="w-32 h-32 bg-white/5 rounded-full border border-white/10 relative flex items-center justify-center backdrop-blur-md">
                        <div className="w-12 h-12 bg-cyan-400/40 rounded-full shadow-[0_0_15px_rgba(34,211,238,0.6)]" style={{ transform: `translate(${playState.joystick.x*40}px, ${playState.joystick.y*40}px)` }}></div>
                     </div>
                  </div>
                  
                  {/* Right hand swipe / shoot controller */}
                  <div 
                    className="flex-1 pointer-events-auto relative flex items-end justify-end p-8"
                    onTouchStart={handleLookStart} onTouchMove={handleLookMove} onTouchEnd={handleLookEnd}
                    onMouseDown={handleLookStart} onMouseMove={handleLookMove} onMouseUp={handleLookEnd} onMouseLeave={handleLookEnd}
                  >
                     {!carModeVisual ? (
                       <button 
                          className="w-24 h-24 bg-cyan-500/15 rounded-full border border-cyan-400/35 flex items-center justify-center active:scale-95 active:bg-cyan-500/40 transition-all backdrop-blur-sm cursor-pointer"
                          onTouchStart={(e) => { e.stopPropagation(); playState.isShooting = true; }}
                          onMouseDown={(e) => { e.stopPropagation(); playState.isShooting = true; }}
                       >
                          <Crosshair className="w-10 h-10 text-cyan-400 animate-pulse" />
                       </button>
                     ) : (
                       <div className="text-right pointer-events-none">
                         <span className="text-xs text-gray-500 font-mono block">Velocimetro</span>
                         <span className="text-2xl font-black font-mono text-cyan-400">{Math.round(Math.abs(playState.carSpeed) * 4)} KM/H</span>
                       </div>
                     )}
                  </div>
               </div>
            </div>
          )}

          {/* REALTIME 3D SIDEBAR INSPECTOR */}
          {mode === 'edit' && (
            <div className="absolute right-4 top-4 bg-[#090d16]/95 backdrop-blur-md border border-white/5 p-5 rounded-2xl w-64 shadow-2xl flex flex-col gap-4 max-h-[80vh] overflow-y-auto z-10">
              <h3 className="text-cyan-400 font-black font-mono text-xs tracking-wider flex items-center gap-1.5"><Settings className="w-4 h-4"/> ENTIDADES 3D</h3>
              
              <div className="grid grid-cols-2 gap-2 mb-2">
                 <button onClick={() => setObjects([...objects, { id: 'w_'+Date.now(), type: 'wall', position: [0, 2, 0], scale: [4, 4, 4], color: '#334155' }])} className="bg-white/5 hover:bg-white/10 p-3 rounded-xl text-white text-[11px] font-mono flex flex-col items-center gap-1 cursor-pointer"><Move className="w-4 h-4 text-cyan-400"/> + Muro</button>
                 <button onClick={() => setObjects([...objects, { id: 'e_'+Date.now(), type: 'enemy', position: [0, 1.2, 0], scale: [1.3, 2, 1.3], color: '#047857' }])} className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 p-3 rounded-xl text-[11px] font-mono flex flex-col items-center gap-1 cursor-pointer"><PlusCircle className="w-4 h-4"/> + Zombie</button>
              </div>

              {selectedId && (
                <div className="border-t border-white/5 pt-4 space-y-4">
                   <h4 className="text-white font-bold text-xs">Propiedades Selección</h4>
                   {objects.filter(o => o.id === selectedId).map(obj => (
                      <div key={obj.id} className="space-y-3.5 text-xs">
                         <div>
                            <label className="text-[10px] text-gray-500 font-bold block mb-1">POSICIÓN X</label>
                            <input type="number" value={obj.position[0]} onChange={(e) => setObjects(objects.map(o => o.id===obj.id ? {...o, position: [parseFloat(e.target.value)||0, o.position[1], o.position[2]]} : o))} className="w-full bg-slate-900 border border-white/10 text-white px-3 py-1.5 rounded-lg text-xs" />
                         </div>
                         <div>
                            <label className="text-[10px] text-gray-500 font-bold block mb-1">POSICIÓN Z</label>
                            <input type="number" value={obj.position[2]} onChange={(e) => setObjects(objects.map(o => o.id===obj.id ? {...o, position: [o.position[0], o.position[1], parseFloat(e.target.value)||0]} : o))} className="w-full bg-slate-900 border border-white/10 text-white px-3 py-1.5 rounded-lg text-xs" />
                         </div>
                         {obj.type === 'wall' && (
                            <>
                            <div>
                               <label className="text-[10px] text-gray-500 font-bold block mb-1">ANCHO (ESCALA X)</label>
                               <input type="number" value={obj.scale[0]} onChange={(e) => setObjects(objects.map(o => o.id===obj.id ? {...o, scale: [parseFloat(e.target.value)||1, o.scale[1], o.scale[2]]} : o))} className="w-full bg-slate-900 border border-white/10 text-white px-3 py-1.5 rounded-lg text-xs" />
                            </div>
                            <div>
                               <label className="text-[10px] text-gray-500 font-bold block mb-1">PROG (ESCALA Z)</label>
                               <input type="number" value={obj.scale[2]} onChange={(e) => setObjects(objects.map(o => o.id===obj.id ? {...o, scale: [o.scale[0], o.scale[1], parseFloat(e.target.value)||1]} : o))} className="w-full bg-slate-900 border border-white/10 text-white px-3 py-1.5 rounded-lg text-xs" />
                            </div>
                            </>
                         )}
                         
                         <div>
                            <label className="text-[10px] text-gray-500 font-bold block mb-1.5">COLOR DE MALLA</label>
                            <div className="flex gap-1.5 flex-wrap">
                              {['#0f172a', '#1e1b4b', '#1e293b', '#047857', '#fbbf24', '#06b6d4'].map(c => (
                                <button 
                                  key={c} 
                                  onClick={() => setObjects(objects.map(o => o.id===obj.id ? {...o, color: c} : o))}
                                  className="w-5 h-5 rounded-full border border-white/10 cursor-pointer" 
                                  style={{ backgroundColor: c }}
                                />
                              ))}
                            </div>
                         </div>

                         <button onClick={() => { setObjects(objects.filter(o => o.id !== obj.id)); setSelectedId(null); }} className="w-full mt-2 bg-red-600/15 hover:bg-red-600/25 border border-red-500/25 text-red-400 font-black text-xs py-2.5 rounded-xl cursor-pointer">ELIMINAR</button>
                      </div>
                   ))}
                </div>
              )}
            </div>
          )}
      </div>
    </div>,
    document.body
  );
}

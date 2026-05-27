import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sky, Text, Box, Sphere, Cylinder, OrbitControls, Grid, TransformControls } from '@react-three/drei';
import * as THREE from 'three';
import { Play, Square, Save, Upload, RotateCcw, Check, Settings, ChevronLeft, Move, Crosshair, PlusCircle, Sparkles, Trash2, Copy, Sliders, MapPin, Eye, Compass, Shield, Zap, Plus, Info, UserCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { saveGameDraft, getGameDrafts, GameDraft } from '../../lib/offlineDb';

interface GameObject3D {
  id: string;
  type: 'wall' | 'enemy' | 'pickup' | 'spawn' | 'finish' | 'checkpoint' | 'nature' | 'npc' | 'trigger' | 'map_config' | 'vehicle' | 'water';
  position: [number, number, number];
  scale: [number, number, number];
  color: string;
  rotation?: [number, number, number]; // [X, Y, Z] in radians
  label?: string;
  texture_style?: 'neon' | 'grid' | 'metal' | 'lava' | 'ruins' | string;
  enemy_type?: 'zombie' | 'cyborg' | 'boss' | string;
  shape?: 'cube' | 'sphere' | 'cylinder' | 'cone' | 'torus' | string;
  category?: string;
  nature_type?: 'tree' | 'rock' | 'bush' | 'crate' | string;
  npc_name?: string;
  npc_dialog?: string;
  [key: string]: any; // Allow map_config values
}

interface Editor3DProps {
  initialTemplate: string;
  draftId?: string | null;
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

  playShotgun() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }

  playPlasma() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1400, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }

  playNitro() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.4);
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.4);
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
  carSmoke: [] as any[],
  keys: {} as Record<string, boolean>,
  joystick: { x: 0, y: 0 },
  lookDelta: { x: 0, y: 0 },
  isShooting: false,
  lastShot: 0,
  muzzleFlashTime: 0, // Time standard ticker for muzzle mesh
  // Car driving specific parameters
  carSpeed: 0,
  carRotationY: 0,
  carPosition: new THREE.Vector3(0, 0, 0),
  carCheckpointCount: 0,
  lap: 1,
  bestLapTime: 99.9,
  lapStart: 0,

  // Floating damage text in 3D scene
  damageNumbers: [] as any[],

  // Playable Shooter specs
  currentWeapon: 'pistol' as 'pistol' | 'plasma' | 'shotgun',
  unlockedWeapons: ['pistol'] as string[],
  ammo: 30,
  maxAmmo: 30,
  wave: 1,
  enemiesDefeated: 0,

  // Platformer specifically
  playerPos: new THREE.Vector3(0, 1.6, 15),
  playerVel: new THREE.Vector3(0, 0, 0),
  onGround: true,
  checkpointPos: new THREE.Vector3(0, 1.6, 15),
  doubleJumpUsed: false,

  // Sandbox active dynamic simulation entities
  sandboxBodies: [] as any[]
};

// Sleek animated robotic hovering platformer hero!
function PlatformerRobot({ position }: { position: THREE.Vector3 }) {
  const robotRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (robotRef.current) {
      // Bob up & down and spin ring smoothly
      robotRef.current.position.y = position.y + Math.sin(state.clock.elapsedTime * 8) * 0.08;
      robotRef.current.position.x = position.x;
      robotRef.current.position.z = position.z;
      robotRef.current.rotation.y = state.clock.elapsedTime * 1.8;
    }
  });

  return (
    <group ref={robotRef}>
      {/* Sci-Fi glowing core orb */}
      <mesh castShadow>
        <sphereGeometry args={[0.42, 12, 12]} />
        <meshStandardMaterial color="#38bdf8" roughness={0.1} metalness={0.9} emissive="#0284c7" emissiveIntensity={0.6} />
      </mesh>
      {/* Red outer energy boundary torus ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.55, 0.05, 8, 24]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
      {/* Centered glowing laser eyes visor */}
      <mesh position={[0, 0.08, 0.35]}>
        <boxGeometry args={[0.26, 0.07, 0.08]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
    </group>
  );
}

// Character Voxel Zombie Render (with cyborg spider variants!)
function VoxelZombie({ dead, rotationY, type = 'zombie' }: { dead: boolean; rotationY: number; type?: 'zombie' | 'cyborg' | 'boss' }) {
  const armBob = useRef(0);
  const legBob = useRef(0);
  
  useFrame((state) => {
    if (dead) return;
    const timeSpeed = type === 'cyborg' ? 14 : type === 'boss' ? 5 : 8;
    armBob.current = Math.sin(state.clock.elapsedTime * timeSpeed) * 0.4;
    legBob.current = Math.cos(state.clock.elapsedTime * timeSpeed) * 0.35;
  });

  if (type === 'cyborg') {
    // Futuristic glowing metal spider-bot/cyber crab enemy!
    return (
      <group rotation={[0, rotationY, 0]}>
        {/* Core armored body */}
        <mesh castShadow position={[0, 0.4, 0]}>
          <boxGeometry args={[1.0, 0.6, 1.0]} />
          <meshStandardMaterial color={dead ? '#334155' : '#1e1b4b'} roughness={0.1} metalness={0.9} />
        </mesh>
        
        {/* Top glowing laser battery */}
        <mesh position={[0, 0.8, -0.1]} castShadow>
          <cylinderGeometry args={[0.2, 0.3, 0.4, 8]} />
          <meshStandardMaterial color="#f43f5e" emissive="#f43f5e" emissiveIntensity={0.8} />
        </mesh>

        {/* Creepy glowing scan-lines / single visor slot */}
        {!dead && (
          <mesh position={[0, 0.5, 0.51]}>
            <boxGeometry args={[0.7, 0.1, 0.05]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>
        )}

        {/* 4 Multi-edged robotic legs bobbing */}
        <group position={[0, 0.2, 0]}>
          <mesh position={[-0.6, legBob.current, 0.4]} rotation={[0, 0, 0.3]}>
            <boxGeometry args={[0.2, 0.5, 0.2]} />
            <meshStandardMaterial color="#334155" metalness={0.8} />
          </mesh>
          <mesh position={[0.6, -legBob.current, 0.4]} rotation={[0, 0, -0.3]}>
            <boxGeometry args={[0.2, 0.5, 0.2]} />
            <meshStandardMaterial color="#334155" metalness={0.8} />
          </mesh>
          <mesh position={[-0.6, -legBob.current, -0.4]} rotation={[0, 0, 0.3]}>
            <boxGeometry args={[0.2, 0.5, 0.2]} />
            <meshStandardMaterial color="#334155" metalness={0.8} />
          </mesh>
          <mesh position={[0.6, legBob.current, -0.4]} rotation={[0, 0, -0.3]}>
            <boxGeometry args={[0.2, 0.5, 0.2]} />
            <meshStandardMaterial color="#334155" metalness={0.8} />
          </mesh>
        </group>
      </group>
    );
  }

  // Boss Big Heavy Cyborg Golem
  if (type === 'boss') {
    return (
      <group rotation={[0, rotationY, 0]} scale={[1.8, 1.8, 1.8]}>
        {/* Massive armored torso */}
        <mesh castShadow position={[0, 0.6, 0]}>
          <boxGeometry args={[1.2, 1.2, 0.8]} />
          <meshStandardMaterial color={dead ? '#475569' : '#0f172a'} roughness={0.3} metalness={0.9} />
        </mesh>
        {/* Giant Heavy shoulder shields */}
        <mesh castShadow position={[-0.7, 0.9, 0]}>
          <boxGeometry args={[0.4, 0.7, 0.6]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.8} />
        </mesh>
        <mesh castShadow position={[0.7, 0.9, 0]}>
          <boxGeometry args={[0.4, 0.7, 0.6]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.8} />
        </mesh>
        {/* Golem head */}
        <mesh position={[0, 1.4, 0]} castShadow>
          <boxGeometry args={[0.6, 0.5, 0.6]} />
          <meshStandardMaterial color="#dc2626" emissive="#7f1d1d" roughness={0.5} />
        </mesh>
        {/* Single glowing central eye */}
        {!dead && (
          <mesh position={[0, 1.4, 0.31]}>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>
        )}
      </group>
    );
  }

  // Standard classic Voxel Zombie
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

// Low Poly Cyber Sports Car Render with tire smoke emission
function NeonSportsCar({ position, rotationY }: { position: THREE.Vector3; rotationY: number }) {
  const wheelRotateRef = useRef<THREE.Group>(null);
  const smokeMeshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state, delta) => {
    if (wheelRotateRef.current && playState.carSpeed !== 0) {
      wheelRotateRef.current.rotation.x += playState.carSpeed * delta * 5;
    }

    // Spawn tire smoke drift particles on turning/speed drift maneuvers!
    if (Math.abs(playState.carSpeed) > 15 && Math.random() < 0.4) {
      playState.carSmoke.push({
        id: Math.random(),
        position: position.clone().add(new THREE.Vector3(
          -Math.sin(rotationY) * 1.5 + (Math.random() - 0.5) * 0.4,
          0.15,
          -Math.cos(rotationY) * 1.5 + (Math.random() - 0.5) * 0.4
        )),
        size: 0.3 + Math.random() * 0.4,
        life: 0.6,
        growth: 1.8 + Math.random() * 2.5
      });
    }

    // Step particles
    if (smokeMeshRef.current) {
      let count = 0;
      for (let i = playState.carSmoke.length - 1; i >= 0; i--) {
        const p = playState.carSmoke[i];
        p.life -= delta;
        p.size += delta * p.growth;
        p.position.y += delta * 1.5;
        if (p.life <= 0) {
          playState.carSmoke.splice(i, 1);
          continue;
        }
        dummy.position.copy(p.position);
        dummy.scale.setScalar(p.size);
        dummy.updateMatrix();
        smokeMeshRef.current.setMatrixAt(count, dummy.matrix);
        count++;
      }
      smokeMeshRef.current.count = count;
      smokeMeshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Lower sleek sports diffuser */}
      <mesh castShadow position={[0, 0.25, 0]}>
        <boxGeometry args={[1.8, 0.38, 3.8]} />
        <meshStandardMaterial color="#06b6d4" roughness={0.15} metalness={0.93} emissive="#083344" />
      </mesh>

      {/* Cyber cabin windshield */}
      <mesh castShadow position={[0, 0.62, -0.1]}>
        <boxGeometry args={[1.34, 0.48, 1.8]} />
        <meshStandardMaterial color="#111827" roughness={0.0} metalness={1.0} envMapIntensity={2.0} />
      </mesh>

      {/* Bright neon cyan headlights */}
      <mesh position={[-0.7, 0.28, -1.91]}>
        <boxGeometry args={[0.3, 0.1, 0.05]} />
        <meshBasicMaterial color="#22d3ee" />
      </mesh>
      <mesh position={[0.7, 0.28, -1.91]}>
        <boxGeometry args={[0.3, 0.1, 0.05]} />
        <meshBasicMaterial color="#22d3ee" />
      </mesh>

      {/* Red glowing tail exhaust band */}
      <mesh position={[0, 0.25, 1.91]}>
        <boxGeometry args={[1.4, 0.1, 0.05]} />
        <meshBasicMaterial color="#f43f5e" />
      </mesh>

      {/* F1 styled neo aerodynamics tail spoiler */}
      <mesh position={[0, 0.8, 1.5]} castShadow>
        <boxGeometry args={[2.0, 0.1, 0.4]} />
        <meshStandardMaterial color="#0891b2" metalness={0.8} />
      </mesh>
      <mesh position={[-0.9, 0.45, 1.5]} castShadow>
        <boxGeometry args={[0.1, 0.6, 0.3]} />
        <meshStandardMaterial color="#0891b2" />
      </mesh>
      <mesh position={[0.9, 0.45, 1.5]} castShadow>
        <boxGeometry args={[0.1, 0.6, 0.3]} />
        <meshStandardMaterial color="#0891b2" />
      </mesh>

      {/* Spinning tires */}
      <group ref={wheelRotateRef}>
        <mesh position={[-1.0, 0.2, -1.1]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.42, 0.42, 0.32, 16]} />
          <meshStandardMaterial color="#0f0e0d" roughness={0.9} />
        </mesh>
        <mesh position={[1.0, 0.2, -1.1]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.42, 0.42, 0.32, 16]} />
          <meshStandardMaterial color="#0f0e0d" roughness={0.9} />
        </mesh>
        <mesh position={[-1.0, 0.2, 1.1]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.42, 0.42, 0.32, 16]} />
          <meshStandardMaterial color="#0f0e0d" roughness={0.9} />
        </mesh>
        <mesh position={[1.0, 0.2, 1.1]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.42, 0.42, 0.32, 16]} />
          <meshStandardMaterial color="#0f0e0d" roughness={0.9} />
        </mesh>
      </group>

      {/* Drift Sparks Smoke instanced container rendering */}
      <instancedMesh ref={smokeMeshRef} args={[undefined, undefined, 120]} frustumCulled={false} position={[0, -position.y, 0]}>
        <sphereGeometry args={[0.8, 5, 5]} />
        <meshBasicMaterial color="#64748b" transparent opacity={0.3} depthWrite={false} />
      </instancedMesh>
    </group>
  );
}

// FP Shooter HUD and Weapon Display with interactive Muzzle Flash Sphere
function PlayerWeapon({ mapProps, template }: any) {
  const { camera } = useThree();
  const group = useRef<THREE.Group>(null);
  const RecoilRef = useRef({ current: 0, target: 0 });
  const [muzzleActive, setMuzzleActive] = useState(false);
  const [currentWpn, setCurrentWpn] = useState('pistol');

  useFrame((state, delta) => {
    if (!group.current) return;
    group.current.position.copy(camera.position);
    group.current.quaternion.copy(camera.quaternion);

    if (playState.currentWeapon !== currentWpn) {
      setCurrentWpn(playState.currentWeapon);
    }

    // Dynamic recoil kicks back gun mesh on shoot
    if (playState.isShooting) {
      RecoilRef.current.target = 0.18;
      setMuzzleActive(true);
      playState.muzzleFlashTime = 0.08; // Flash survives for 0.08 seconds
    }

    if (playState.muzzleFlashTime > 0) {
      playState.muzzleFlashTime -= delta;
      if (playState.muzzleFlashTime <= 0) {
        setMuzzleActive(false);
      }
    }

    RecoilRef.current.current = THREE.MathUtils.lerp(RecoilRef.current.current, RecoilRef.current.target, delta * 15);
    RecoilRef.current.target = THREE.MathUtils.lerp(RecoilRef.current.target, 0, delta * 8);
    
    group.current.translateZ(RecoilRef.current.current);
  });

  return (
    <group ref={group}>
      <group position={[0.26, -0.28, -0.45]}>
         {currentWpn === 'pistol' && (
           <>
             {/* Cyber Laser Pistol */}
             <mesh castShadow>
               <boxGeometry args={[0.08, 0.08, 0.4]} />
               <meshStandardMaterial color="#334155" metalness={0.85} roughness={0.15} />
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
           </>
         )}

         {currentWpn === 'plasma' && (
           <>
             {/* Plasma Heavy Rifle */}
             <mesh castShadow>
               <boxGeometry args={[0.1, 0.12, 0.65]} />
               <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.1} />
             </mesh>
             <mesh position={[0, -0.1, 0.12]} castShadow>
                <boxGeometry args={[0.07, 0.18, 0.1]} />
                <meshStandardMaterial color="#0f172a" />
             </mesh>
             {/* High tech green battery canisters */}
             <mesh position={[0, 0.05, -0.05]} rotation={[0, 0, Math.PI / 2]} castShadow>
                <cylinderGeometry args={[0.03, 0.03, 0.18, 8]} />
                <meshStandardMaterial color="#22c55e" emissive="#15803d" emissiveIntensity={0.8} />
             </mesh>
             {/* Plasma tube barrel glow */}
             <mesh position={[0, 0, -0.33]}>
                <boxGeometry args={[0.05, 0.05, 0.02]} />
                <meshBasicMaterial color="#f97316" />
             </mesh>
           </>
         )}

         {currentWpn === 'shotgun' && (
           <>
             {/* Wide-Barrel Cyber Shotgun */}
             <mesh castShadow>
               <boxGeometry args={[0.18, 0.08, 0.52]} />
               <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.3} />
             </mesh>
             <mesh position={[0, -0.09, 0.1]} castShadow>
                <boxGeometry args={[0.06, 0.15, 0.09]} />
                <meshStandardMaterial color="#1e293b" />
             </mesh>
             {/* Dual barrels */}
             <mesh position={[-0.04, 0, -0.27]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.025, 0.025, 0.08]} />
                <meshStandardMaterial color="#0f172a" metalness={0.9} />
             </mesh>
             <mesh position={[0.04, 0, -0.27]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.025, 0.025, 0.08]} />
                <meshStandardMaterial color="#0f172a" metalness={0.9} />
             </mesh>
             {/* Red power strip heatsinks */}
             <mesh position={[0, 0.04, 0]}>
                <boxGeometry args={[0.12, 0.01, 0.3]} />
                <meshBasicMaterial color="#ef4444" />
             </mesh>
           </>
         )}

         {/* Visual Muzzle Flash Pop */}
         {muzzleActive && (
           <group position={[0, 0, -0.32]}>
             <mesh>
               <sphereGeometry args={[0.18, 8, 8]} />
               <meshBasicMaterial color={currentWpn === 'plasma' ? '#22c55e' : currentWpn === 'shotgun' ? '#f43f5e' : '#f97316'} transparent opacity={0.9} />
             </mesh>
             <pointLight intensity={5.0} distance={15} color={currentWpn === 'plasma' ? '#22c55e' : currentWpn === 'shotgun' ? '#f43f5e' : '#fb923c'} />
           </group>
         )}
      </group>
    </group>
  );
}

// 3D Player / Camera Physical controller
function PlayerController({ spawn, walls, template, mapProps }: any) {
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

    if (((typeof mapProps !== 'undefined' && mapProps?.cameraMode === 'racing') || template === 'Racing 3D')) {
      // 3D CAR CHASE DRIVING SCHEMAS (Third Person Space)
      const maxCarSpeed = 48.0;
      let accelInput = 0;
      let turnInput = 0;

      if (playState.keys['arrowup'] || playState.keys['w']) accelInput = 1.1;
      if (playState.keys['arrowdown'] || playState.keys['s']) accelInput = -0.8;
      if (playState.keys['arrowleft'] || playState.keys['a']) turnInput = 1.1;
      if (playState.keys['arrowright'] || playState.keys['d']) turnInput = -1.1;

      // Joystick bindings
      if (playState.joystick.y !== 0) accelInput = -playState.joystick.y * 1.2;
      if (playState.joystick.x !== 0) turnInput = -playState.joystick.x * 1.2;

      // Acceleration mechanics
      if (accelInput !== 0) {
        playState.carSpeed = THREE.MathUtils.lerp(playState.carSpeed, accelInput * maxCarSpeed, delta * 2.8);
        if (Math.abs(playState.carSpeed) > 10 && Math.random() < 0.25) {
          audio3D.playDrift(); // Play engine/tire synth hums
        }
      } else {
        playState.carSpeed = THREE.MathUtils.lerp(playState.carSpeed, 0, delta * 1.8);
      }

      // Turn mechanics
      if (Math.abs(playState.carSpeed) > 1.5) {
        const turnSpeed = playState.carSpeed > 0 ? 2.8 : -2.8;
        playState.carRotationY += turnInput * turnSpeed * delta;
      }

      // Compute vector step ahead
      const nextPos = playState.carPosition.clone();
      nextPos.x += Math.sin(playState.carRotationY) * playState.carSpeed * delta;
      nextPos.z += Math.cos(playState.carRotationY) * playState.carSpeed * delta;

      // Basic Wall crash clip logic
      let crash = false;
      for (const w of walls) {
        const halfX = w.scale[0] * 0.5;
        const halfZ = w.scale[2] * 0.5;
        if (
          nextPos.x > w.position[0] - halfX - 0.8 &&
          nextPos.x < w.position[0] + halfX + 0.8 &&
          nextPos.z > w.position[2] - halfZ - 0.8 &&
          nextPos.z < w.position[2] + halfZ + 0.8
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
        playState.carSpeed = -playState.carSpeed * 0.45;
        audio3D.playHurt();
      }

      // Position chase follow cam behind neon car
      const camOffset = new THREE.Vector3(
        -Math.sin(playState.carRotationY) * 9.5,
        5.4,
        -Math.cos(playState.carRotationY) * 9.5
      );
      camera.position.copy(playState.carPosition).add(camOffset);
      camera.lookAt(playState.carPosition.clone().add(new THREE.Vector3(0, 1.2, 0)));

    } else if (((typeof mapProps !== 'undefined' && mapProps?.cameraMode === 'platformer') || template === 'Platformer 3D')) {
      // 3D PLATFORMER PLAYER CONTROLS
      const moveSpeed = 9.8;
      let moveX = 0;
      let moveZ = 0;

      if (playState.keys['w'] || playState.keys['arrowup']) moveZ -= 1;
      if (playState.keys['s'] || playState.keys['arrowdown']) moveZ += 1;
      if (playState.keys['a'] || playState.keys['arrowleft']) moveX -= 1;
      if (playState.keys['d'] || playState.keys['arrowright']) moveX += 1;

      if (playState.joystick.x !== 0) moveX = playState.joystick.x;
      if (playState.joystick.y !== 0) moveZ = playState.joystick.y;

      // Gravity acceleration vertical
      playState.playerVel.y -= 22 * delta;

      // Translate player coordinates
      playState.playerPos.x += moveX * moveSpeed * delta;
      playState.playerPos.z += moveZ * moveSpeed * delta;
      playState.playerPos.y += playState.playerVel.y * delta;

      let landed = false;
      if (playState.playerPos.y <= 0.6) {
        playState.playerPos.y = 0.6;
        playState.playerVel.y = 0;
        playState.onGround = true;
        playState.doubleJumpUsed = false;
        landed = true;
      }

      // Platform check
      for (const w of walls) {
        const halfW = w.scale[0] * 0.5;
        const halfH = w.scale[1] * 0.5;
        const halfD = w.scale[2] * 0.5;

        const insideX = playState.playerPos.x > w.position[0] - halfW - 0.5 && playState.playerPos.x < w.position[0] + halfW + 0.5;
        const insideZ = playState.playerPos.z > w.position[2] - halfD - 0.5 && playState.playerPos.z < w.position[2] + halfD + 0.5;

        if (insideX && insideZ) {
          const topSurface = w.position[1] + halfH;
          if (playState.playerPos.y >= topSurface - 0.5 && playState.playerVel.y <= 0) {
            playState.playerPos.y = topSurface + 0.5;
            playState.playerVel.y = 0;
            playState.onGround = true;
            playState.doubleJumpUsed = false;
            landed = true;

            if (w.texture_style === 'lava') {
              playState.health -= 1;
              playState.playerVel.y = 12; // launch up
              audio3D.playHurt();
              if (playState.health <= 0) playState.gameOver = true;
            }
          }
        }
      }

      if (!landed) {
        playState.onGround = false;
      }

      // Void death
      if (playState.playerPos.y < -6) {
        playState.playerPos.copy(playState.checkpointPos);
        playState.playerVel.set(0, 0, 0);
        playState.health -= 1;
        audio3D.playHurt();
        if (playState.health <= 0) playState.gameOver = true;
      }

      // Follow cam
      const camOffset = new THREE.Vector3(0, 4.5, 9.5);
      camera.position.copy(playState.playerPos).add(camOffset);
      camera.lookAt(playState.playerPos.clone().add(new THREE.Vector3(0, 0.6, 0)));

    } else if (template === 'Sandbox 3D') {
      // 3D FREE FLY CAMERA FOR SANDBOX
      const flySpeed = 14.0;
      let fwd = 0;
      let side = 0;

      if (playState.keys['w']) fwd = 1;
      if (playState.keys['s']) fwd = -1;
      if (playState.keys['a']) side = -1;
      if (playState.keys['d']) side = 1;

      if (playState.joystick.y !== 0) fwd = -playState.joystick.y;
      if (playState.joystick.x !== 0) side = playState.joystick.x;

      euler.current.y -= playState.lookDelta.x * 0.005;
      euler.current.x -= playState.lookDelta.y * 0.005;
      euler.current.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, euler.current.x));
      camera.quaternion.setFromEuler(euler.current);

      playState.lookDelta.x *= 0.75;
      playState.lookDelta.y *= 0.75;

      const camDir = new THREE.Vector3();
      camera.getWorldDirection(camDir);
      
      const camRight = new THREE.Vector3();
      camRight.crossVectors(camera.up, camDir).normalize();

      camera.position.addScaledVector(camDir, fwd * flySpeed * delta);
      camera.position.addScaledVector(camRight, -side * flySpeed * delta);

    } else {
      // 3D FIRST PERSON SHOOTER CONTROLLER
      const moveSpeed = ((typeof mapProps !== 'undefined' && mapProps?.cameraMode === 'fps') || template === 'Zombie Survival 3D') ? 10.5 : 9.0;
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
        const halfX = w.scale[0] * 0.5;
        const halfZ = w.scale[2] * 0.5;
        if (
          nextPos.x > w.position[0] - halfX - 0.6 &&
          nextPos.x < w.position[0] + halfX + 0.6 &&
          nextPos.z > w.position[2] - halfZ - 0.6 &&
          nextPos.z < w.position[2] + halfZ + 0.6
        ) {
           hitWall = true;
           break;
        }
      }

      if (!hitWall) {
        playerRef.current.copy(nextPos);
      }
      camera.position.copy(playerRef.current);

      // Shooting controller with multiple weapon parameters and ammo logic!
      if (playState.isShooting) {
        let fireDelay = 250;
        let ammoCost = 1;
        if (playState.currentWeapon === 'plasma') { fireDelay = 110; ammoCost = 1; }
        else if (playState.currentWeapon === 'shotgun') { fireDelay = 650; ammoCost = 3; }

        if (state.clock.elapsedTime * 1000 - playState.lastShot > fireDelay) {
          if (playState.ammo >= ammoCost) {
            playState.ammo -= ammoCost;
            playState.lastShot = state.clock.elapsedTime * 1000;
            
            const camDirCustom = camera.getWorldDirection(new THREE.Vector3());
            const muzzlePos = camera.position.clone().add(camDirCustom.clone().multiplyScalar(0.8));
            
            if (playState.currentWeapon === 'pistol') {
              audio3D.playLaser();
              playState.bullets.push({
                id: Math.random(),
                position: muzzlePos,
                velocity: camDirCustom.clone().multiplyScalar(48),
                life: 1.8,
                color: '#38bdf8',
                damage: 1
              });
            } else if (playState.currentWeapon === 'plasma') {
              audio3D.playPlasma();
              playState.bullets.push({
                id: Math.random(),
                position: muzzlePos,
                velocity: camDirCustom.clone().multiplyScalar(58),
                life: 1.5,
                color: '#22c55e',
                damage: 2
              });
            } else if (playState.currentWeapon === 'shotgun') {
              audio3D.playShotgun();
              // Spawn 3 pellets with angular spread
              const rightDir = new THREE.Vector3().crossVectors(camera.up, camDirCustom).normalize();
              for (let pelletIndex = -1; pelletIndex <= 1; pelletIndex++) {
                const spreadDir = camDirCustom.clone().addScaledVector(rightDir, pelletIndex * 0.15).normalize();
                playState.bullets.push({
                  id: Math.random(),
                  position: muzzlePos.clone(),
                  velocity: spreadDir.multiplyScalar(40),
                  life: 1.0,
                  color: '#f43f5e',
                  damage: 1.5
                });
              }
            }
          } else {
            // Auto reload after click when empty
            audio3D.playDrift(); // mini click
            playState.lastShot = state.clock.elapsedTime * 1000 + 400; // prevent click spam
            // Auto reload!
            setTimeout(() => {
              playState.ammo = playState.maxAmmo;
            }, 1000);
          }
        }
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
          const dmg = b.damage || 1;
          e.hp -= dmg;
          audio3D.playHurt();

          // Spawn floating damage text popup
          playState.damageNumbers.push({
            id: Math.random(),
            text: `-${dmg}`,
            position: e.position.clone().add(new THREE.Vector3(0, 1.8, 0)),
            life: 0.8
          });

          if (e.hp <= 0) {
            e.dead = true;
            playState.score += 150;
            playState.enemiesDefeated += 1;
            audio3D.playExplosion();

            // Spawn floating kill reward popup
            playState.damageNumbers.push({
              id: Math.random(),
              text: `+150 XP`,
              position: e.position.clone().add(new THREE.Vector3(0, 2.4, 0)),
              life: 1.2
            });

            // Spontaneous drop collectible (45% probability)
            if (Math.random() < 0.45) {
              playState.pickups.push({
                id: 'drop_' + Date.now() + Math.random(),
                position: e.position.clone().add(new THREE.Vector3(0, 0.4, 0)),
                collected: false,
                color: Math.random() > 0.6 ? '#86efac' : '#38bdf8', // Emerald Ammo or Blue Health Crystal
                rotationY: 0,
                isDropped: true
              });
            }
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
      
      // Update instance color dynamically based on bullet color property
      if (bulletsRef.current.setColorAt) {
        bulletsRef.current.setColorAt(count, new THREE.Color(b.color || "#38bdf8"));
      }

      count++;
    }
    bulletsRef.current.count = count;
    bulletsRef.current.instanceMatrix.needsUpdate = true;
    if (bulletsRef.current.instanceColor) {
      bulletsRef.current.instanceColor.needsUpdate = true;
    }
  });

  return (
    <instancedMesh ref={bulletsRef} args={[undefined, undefined, 100]} frustumCulled={false}>
      <sphereGeometry args={[0.15, 8, 8]} />
      <meshBasicMaterial color="#ffffff" />
    </instancedMesh>
  );
}

// 3D Zombie / Alien AI managers with multi enemy types support!
function EnemiesManager({ enemiesData, template, mapProps }: any) {
  const { camera } = useThree();
  
  useEffect(() => {
    playState.enemies = enemiesData.map((e: any) => ({
      ...e,
      position: new THREE.Vector3(...e.position),
      hp: e.enemy_type === 'boss' ? 10 : e.enemy_type === 'cyborg' ? 1 : 2,
      dead: false,
      lastAttack: 0,
      rotationY: 0,
      enemy_type: e.enemy_type || (Math.random() > 0.6 ? 'cyborg' : 'zombie')
    }));
  }, [enemiesData]);

  useFrame((state, delta) => {
    if (playState.gameOver || playState.won) return;

    const targetPos = ((typeof mapProps !== 'undefined' && mapProps?.cameraMode === 'racing') || template === 'Racing 3D') ? playState.carPosition : camera.position;

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
      
      // AI movement logic towards player
      const activeSeekDist = ((typeof mapProps !== 'undefined' && mapProps?.cameraMode === 'racing') || template === 'Racing 3D') ? 30 : 35;
      if (dist < activeSeekDist && dist > 1.6) {
         const pathSpeed = e.enemy_type === 'cyborg' ? 5.2 : e.enemy_type === 'boss' ? 1.8 : 3.4;
         e.position.addScaledVector(dir, delta * pathSpeed);
         
         // Ambient growls
         if (e.enemy_type === 'zombie' && Math.random() < 0.003) {
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

    // Wave progression logic for Shooter 3D and Zombie Survival 3D
    const allDead = playState.enemies.length > 0 && playState.enemies.every(e => e.dead || e.position.y <= -2);
    if (allDead && (template === 'Shooter 3D' || ((typeof mapProps !== 'undefined' && mapProps?.cameraMode === 'fps') || template === 'Zombie Survival 3D'))) {
      playState.wave += 1;
      audio3D.playScoreUp();
      
      const newCount = 4 + playState.wave * 3;
      const newEnemies = [];
      for (let i = 0; i < newCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 15 + Math.random() * 20;
        const et = playState.wave >= 3 && Math.random() > 0.8 ? 'boss' : Math.random() > 0.6 ? 'cyborg' : 'zombie';
        const spawnedPos = new THREE.Vector3(Math.cos(angle)*dist, 1.0, Math.sin(angle)*dist);
        newEnemies.push({
          id: `wave_${playState.wave}_e_${i}`,
          position: spawnedPos,
          hp: et === 'boss' ? 12 : et === 'cyborg' ? 2 : 4,
          dead: false,
          lastAttack: 0,
          rotationY: 0,
          enemy_type: et
        });
      }
      playState.enemies = newEnemies;

      // Alert wave floating popup in front of player
      const fwd = new THREE.Vector3();
      camera.getWorldDirection(fwd);
      const wavePos = camera.position.clone().add(fwd.multiplyScalar(4.0));
      wavePos.y += 1.2;
      playState.damageNumbers.push({
        id: Math.random(),
        text: `OLEADA ${playState.wave}`,
        position: wavePos,
        life: 2.2
      });
    }
  });

  return (
    <>
      {playState.enemies.map((e, idx) => (
        <group key={idx} position={e.position}>
          <VoxelZombie dead={e.dead} rotationY={e.rotationY || 0} type={e.enemy_type} />
        </group>
      ))}
    </>
  );
}

// Float floating rotating coins/points pickups
function FloatingPickups({ pickupsData, template, mapProps }: any) {
  useFrame((state, delta) => {
    if (playState.gameOver) return;
    const playerPos = ((typeof mapProps !== 'undefined' && mapProps?.cameraMode === 'racing') || template === 'Racing 3D') ? playState.carPosition : state.camera.position;

    for (let i = playState.pickups.length - 1; i >= 0; i--) {
       const pk = playState.pickups[i];
       if (pk.collected) continue;

       // Spin pickups
       pk.rotationY += delta * 2.5;

       // AABB intersection check distance
       if (pk.position.distanceTo(playerPos) < 2.2) {
         pk.collected = true;
         audio3D.playScoreUp();

         if (pk.color === '#86efac') {
            // Green is Ammo Pack!
            playState.ammo = Math.min(playState.maxAmmo, playState.ammo + 12);
            playState.score += 100;
            playState.damageNumbers.push({
              id: Math.random(),
              text: `+12 MUNICIÓN`,
              position: pk.position.clone().add(new THREE.Vector3(0, 1.5, 0)),
              life: 1.0
            });
         } else if (pk.color === '#38bdf8' && pk.isDropped) {
            // Blue is Health heart drop!
            playState.health = Math.min(3, playState.health + 1);
            playState.score += 100;
            playState.damageNumbers.push({
              id: Math.random(),
              text: `+1 CORAZÓN`,
              position: pk.position.clone().add(new THREE.Vector3(0, 1.5, 0)),
              life: 1.0
            });
         } else if (pk.category?.startsWith('weapon_')) {
            // We unlocked a new shooter weapon!
            const wpn = pk.category.replace('weapon_', '');
            if (!playState.unlockedWeapons.includes(wpn)) {
               playState.unlockedWeapons.push(wpn);
            }
            playState.currentWeapon = wpn as any;
            playState.ammo = playState.maxAmmo;
            playState.score += 500;
            playState.damageNumbers.push({
              id: Math.random(),
              text: `NUEVO: ${wpn.toUpperCase()}`,
              position: pk.position.clone().add(new THREE.Vector3(0, 2.0, 0)),
              life: 2.0
            });
         } else {
            playState.score += 250;
         }

         // Check if racing LAP is complete
         if (((typeof mapProps !== 'undefined' && mapProps?.cameraMode === 'racing') || template === 'Racing 3D')) {
           playState.carCheckpointCount += 1;
           if (playState.carCheckpointCount >= 4) {
             playState.carCheckpointCount = 0;
             playState.lap += 1;
             audio3D.playScoreUp();
             // Spawn a cute celebration chime
             const lapTime = (performance.now() - playState.lapStart) / 1000;
             playState.lapStart = performance.now();
             if (lapTime < playState.bestLapTime) {
               playState.bestLapTime = parseFloat(lapTime.toFixed(2));
             }
           }
         }
       }
    }
  });

  return (
    <>
      {playState.pickups.map((pk, idx) => {
        if (pk.collected) return null;
        return (
          <group key={idx} position={pk.position} rotation={[0, pk.rotationY || 0, 0]}>
             {pk.color === '#86efac' ? (
               /* Green Ammo Box Crate */
               <mesh castShadow>
                 <boxGeometry args={[0.55, 0.45, 0.75]} />
                 <meshStandardMaterial color="#16a34a" roughness={0.3} metalness={0.7} />
               </mesh>
             ) : pk.color === '#38bdf8' && pk.isDropped ? (
               /* Cyber Heart Sphere Glow */
               <mesh castShadow>
                 <sphereGeometry args={[0.38, 12, 12]} />
                 <meshStandardMaterial color="#0ea5e9" emissive="#0284c7" emissiveIntensity={1.2} />
               </mesh>
             ) : pk.category === 'weapon_shotgun' ? (
               /* Shotgun Spawner Rod */
               <mesh castShadow>
                 <boxGeometry args={[0.22, 0.22, 1.25]} />
                 <meshStandardMaterial color="#dc2626" emissive="#991b1b" emissiveIntensity={1.0} />
               </mesh>
             ) : pk.category === 'weapon_plasma' ? (
               /* Plasma Spawner Tube */
               <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
                 <cylinderGeometry args={[0.13, 0.13, 1.15, 8]} />
                 <meshStandardMaterial color="#f97316" emissive="#c2410c" emissiveIntensity={1.2} />
               </mesh>
             ) : (
               /* Standard golden octahedron crystal */
               <mesh castShadow>
                 <octahedronGeometry args={[0.6, 0]} />
                 <meshStandardMaterial color={pk.color || "#fbbf24"} emissive={pk.color || "#fbbf24"} emissiveIntensity={0.8} metalness={0.9} />
               </mesh>
             )}
          </group>
        );
      })}
    </>
  );
}

// Lazy global texture generator to avoid recreation and maintain fast startup times
const textureCache: Record<string, THREE.Texture> = {};

function getProceduralTexture(type: string): THREE.Texture {
  if (textureCache[type]) {
    return textureCache[type];
  }

  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  const createNoise = (opacity: number) => {
    const imgData = ctx.getImageData(0, 0, 128, 128);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * opacity * 255;
      data[i] = Math.max(0, Math.min(255, data[i] + noise));
      data[i+1] = Math.max(0, Math.min(255, data[i+1] + noise));
      data[i+2] = Math.max(0, Math.min(255, data[i+2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);
  };

  if (type === 'grass') {
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 200; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? '#15803d' : '#4ade80';
      ctx.fillRect(Math.random() * 128, Math.random() * 128, 2 + Math.random() * 3, 2 + Math.random() * 5);
    }
    createNoise(0.08);
  } else if (type === 'rock' || type === 'ruins') {
    ctx.fillStyle = '#78716c';
    ctx.fillRect(0, 0, 128, 128);
    ctx.strokeStyle = '#44403c';
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * 128, Math.random() * 128);
      ctx.lineTo(Math.random() * 128, Math.random() * 128);
      ctx.stroke();
    }
    createNoise(0.12);
  } else if (type === 'metal') {
    ctx.fillStyle = '#334155';
    ctx.fillRect(0, 0, 128, 128);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 3;
    ctx.strokeRect(4, 4, 120, 120);
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(25, 25);
    ctx.moveTo(128, 0); ctx.lineTo(103, 25);
    ctx.moveTo(0, 128); ctx.lineTo(25, 103);
    ctx.moveTo(128, 128); ctx.lineTo(103, 103);
    ctx.stroke();
    createNoise(0.06);
  } else if (type === 'grid' || type === 'neon') {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 128, 128);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, 128, 128);
    ctx.beginPath();
    ctx.moveTo(64, 0); ctx.lineTo(64, 128);
    ctx.moveTo(0, 64); ctx.lineTo(128, 64);
    ctx.stroke();
    createNoise(0.04);

  } else if (type === 'dirt') {
    ctx.fillStyle = '#78350f';
    ctx.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 300; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? '#451a03' : '#92400e';
      ctx.fillRect(Math.random() * 128, Math.random() * 128, 2, 2);
    }
    createNoise(0.12);
  } else if (type === 'sand') {
    ctx.fillStyle = '#fde047';
    ctx.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 400; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? '#fef08a' : '#d97706';
      ctx.globalAlpha = 0.5;
      ctx.fillRect(Math.random() * 128, Math.random() * 128, 1.5, 1.5);
    }
    ctx.globalAlpha = 1.0;
    createNoise(0.08);
  } else if (type === 'snow') {
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 128, 128);
    ctx.fillStyle = '#e2e8f0';
    for (let i = 0; i < 50; i++) {
       ctx.beginPath();
       ctx.arc(Math.random() * 128, Math.random() * 128, Math.random() * 15 + 5, 0, Math.PI * 2);
       ctx.fill();
    }
    createNoise(0.05);
  } else if (type === 'concrete') {
    ctx.fillStyle = '#64748b';
    ctx.fillRect(0, 0, 128, 128);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    for (let i = 0; i < 20; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * 128, Math.random() * 128);
      ctx.lineTo(Math.random() * 128, Math.random() * 128);
      ctx.stroke();
    }
    createNoise(0.15);

  } else if (type === 'lava') {
    ctx.fillStyle = '#f97316';
    ctx.fillRect(0, 0, 128, 128);
    const grad = ctx.createRadialGradient(64, 64, 5, 64, 64, 64);
    grad.addColorStop(0, '#facc15');
    grad.addColorStop(0.4, '#ea580c');
    grad.addColorStop(1, '#7c2d12');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 15; i++) {
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(Math.random() * 128, Math.random() * 128);
      ctx.lineTo(Math.random() * 128, Math.random() * 128);
      ctx.stroke();
    }
  } else if (type === 'wood') {
    ctx.fillStyle = '#b45309';
    ctx.fillRect(0, 0, 128, 128);
    for (let y = 0; y < 128; y += 4) {
      ctx.fillStyle = Math.random() > 0.4 ? '#78350f' : '#d97706';
      ctx.fillRect(0, y, 128, 2);
    }
    createNoise(0.05);
  } else if (type === 'road') {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, 128, 128);
    createNoise(0.18);
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 128, 128);
    createNoise(0.1);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1);
  textureCache[type] = texture;
  return texture;
}

// Renders custom mesh geometries (Box, Sphere, Cylinder, Cone, Torus) with styled materials
function DynamicShapeMesh({ obj, selectedId, mode, setSelectedId, updateObject }: any) {
  const meshRef = useRef<THREE.Mesh>(null);
  const shape = obj.shape || 'cube';
  const isLava = obj.texture_style === 'lava';
  const isNeon = obj.texture_style === 'neon';
  const isGrid = obj.texture_style === 'grid';
  const isRuins = obj.texture_style === 'ruins';
  const isMetal = obj.texture_style === 'metal';
  const rot = obj.rotation || [0, 0, 0];

  const textureType = isLava ? 'lava' : isRuins ? 'ruins' : isMetal ? 'metal' : isGrid ? 'grid' : isNeon ? 'neon' : 'grid';
  const baseTexture = getProceduralTexture(textureType);

  const customTexture = useMemo(() => {
    const tex = baseTexture.clone();
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    const sizeX = obj.scale[0] || 1;
    const sizeY = obj.scale[1] || 1;
    tex.repeat.set(Math.max(1, Math.round(sizeX / 1.5)), Math.max(1, Math.round(sizeY / 1.5)));
    tex.needsUpdate = true;
    return tex;
  }, [baseTexture, obj.scale[0], obj.scale[1]]);

  const material = (
    <meshStandardMaterial 
      map={customTexture}
      color={obj.color} 
      roughness={isLava ? 0.9 : isNeon ? 0.05 : isRuins ? 0.8 : 0.2}
      metalness={isRuins ? 0.05 : isNeon ? 0.95 : isMetal ? 0.9 : 0.5}
      emissive={selectedId === obj.id ? '#22d3ee' : (isLava ? '#f97316' : isNeon ? obj.color : '#000000')}
      emissiveIntensity={selectedId === obj.id ? 0.8 : (isLava ? 0.6 : isNeon ? 0.6 : 0)}
    />
  );

  let geom;
  switch (shape) {
    case 'sphere':
      geom = <sphereGeometry args={[0.5, 12, 12]} />;
      break;
    case 'cylinder':
      geom = <cylinderGeometry args={[0.5, 0.5, 1.0, 10]} />;
      break;
    case 'cone':
      geom = <coneGeometry args={[0.5, 1.0, 8]} />;
      break;
    case 'torus':
      geom = <torusGeometry args={[0.4, 0.15, 6, 20]} />;
      break;
    case 'cube':
    default:
      geom = <boxGeometry args={[1, 1, 1]} />;
      break;
  }

  return (
    <>
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
      >
      {geom}
      {material}
      {selectedId === obj.id && mode === 'edit' && (
         <lineSegments>
           <edgesGeometry args={[
             shape === 'sphere' ? new THREE.SphereGeometry(0.53, 8, 8) :
             shape === 'cylinder' ? new THREE.CylinderGeometry(0.53, 0.53, 1.04, 8) :
             shape === 'cone' ? new THREE.ConeGeometry(0.53, 1.04, 8) :
             shape === 'torus' ? new THREE.TorusGeometry(0.42, 0.17, 4, 12) :
             new THREE.BoxGeometry(1.06, 1.06, 1.06)
           ]} />
           <lineBasicMaterial color="#22d3ee" linewidth={4} />
         </lineSegments>
      )}
    </mesh>
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
  </>
  );
}

// Emulates real-time lightweight gravity & bounce simulation for Sandbox shapes
function GameplayPhysicsStep({ template, mapProps }: any) {
  useFrame((state, delta) => {
    if (playState.gameOver || playState.won) return;

    if (template === 'Sandbox 3D' && playState.sandboxBodies.length > 0) {
      for (const b of playState.sandboxBodies) {
        // Gravity force pull
        b.velocity.y -= 15 * delta;
        b.position.addScaledVector(b.velocity, delta);

        // Ground level bounce collision
        const bottomOffset = b.scale[1] * 0.5;
        if (b.position.y < bottomOffset) {
          b.position.y = bottomOffset;
          b.velocity.y = -b.velocity.y * 0.42; // bounce damping restitute
          b.velocity.x *= 0.8;
          b.velocity.z *= 0.8;
        }

        // Limit outer bounds
        if (b.position.x < -130) { b.position.x = -130; b.velocity.x = -b.velocity.x; }
        if (b.position.x >  130) { b.position.x =  130; b.velocity.x = -b.velocity.x; }
        if (b.position.z < -130) { b.position.z = -130; b.velocity.z = -b.velocity.z; }
        if (b.position.z >  130) { b.position.z =  130; b.velocity.z = -b.velocity.z; }

        // Block-to-block simple repulsion check
        for (const other of playState.sandboxBodies) {
          if (other.id === b.id) continue;
          const dist = b.position.distanceTo(other.position);
          const limit = (b.scale[0] + other.scale[0]) * 0.46;
          if (dist < limit) {
             const push = b.position.clone().sub(other.position).normalize();
             b.position.addScaledVector(push, 0.05);
             b.velocity.addScaledVector(push, 2.5);
             other.velocity.addScaledVector(push, -2.5);
          }
        }
      }
    }
  });
  return null;
}

// Evaluates checkpoint coordinates saving and victory torus portal triggers
function GameplayTriggers({ objects, template, mapProps }: any) {
  const { camera } = useThree();
  
  useFrame((state, delta) => {
    if (playState.gameOver || playState.won) return;
    const playerPos = ((typeof mapProps !== 'undefined' && mapProps?.cameraMode === 'platformer') || template === 'Platformer 3D') ? playState.playerPos : (((typeof mapProps !== 'undefined' && mapProps?.cameraMode === 'racing') || template === 'Racing 3D') ? playState.carPosition : camera.position);

    for (const obj of objects) {
      if (obj.type === 'checkpoint') {
        const dist = playerPos.distanceTo(new THREE.Vector3(obj.position[0], obj.position[1], obj.position[2]));
        if (dist < 1.8) {
          const oldCh = playState.checkpointPos.clone();
          playState.checkpointPos.set(obj.position[0], obj.position[1], obj.position[2]);
          // Check if newly activated
          if (oldCh.distanceTo(playState.checkpointPos) > 0.8) {
             audio3D.playScoreUp();
          }
        }
      }

      if (obj.type === 'finish') {
        const dist = playerPos.distanceTo(new THREE.Vector3(obj.position[0], obj.position[1], obj.position[2]));
        if (dist < 2.2) {
           playState.won = true;
           audio3D.playScoreUp();
        }
      }
    }
  });

  return null;
}

function LevelEnvironment({ objects, setObjects, mode, selectedId, setSelectedId, template, mapProps }: any) { 
  const updateObject = (id: string, newProps: any) => {
    if(setObjects) {
       setObjects((prev: any[]) => prev.map(o => o.id === id ? { ...o, ...newProps } : o));
    }
  };
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
    playState.lapStart = performance.now();
    playState.lap = 1;
  }, [objects]);

  // Determine atmospheric styles based on template or mapProps configurations
  const isSurvival = ((typeof mapProps !== 'undefined' && mapProps?.cameraMode === 'fps') || template === 'Zombie Survival 3D');
  const isRacing = ((typeof mapProps !== 'undefined' && mapProps?.cameraMode === 'racing') || template === 'Racing 3D');
  const isPlatformer = ((typeof mapProps !== 'undefined' && mapProps?.cameraMode === 'platformer') || template === 'Platformer 3D');
  const isAdventure = template === 'Adventure 3D';

  const skyPreset = mapProps?.skyPreset || (isSurvival ? 'night' : isRacing ? 'sunset' : isPlatformer ? 'noon' : isAdventure ? 'forest' : 'noon');
  const ambianceColor = mapProps?.ambientColor || (isSurvival ? '#065f46' : isRacing ? '#ffedd5' : isPlatformer ? '#e0f2fe' : isAdventure ? '#14532d' : '#1e1b4b');
  const fogColor = mapProps?.fogColor || (isSurvival ? '#065f46' : isRacing ? '#ffedd5' : isPlatformer ? '#e0f2fe' : isAdventure ? '#14532d' : '#0f172a');
  const fogDensity = mapProps?.fogDensity ?? (isSurvival ? 25 : isRacing ? 35 : isPlatformer ? 15 : isAdventure ? 18 : 20);
  const waterLevel = mapProps?.waterLevel ?? (isAdventure ? -1.0 : -10);

  let skySunPosition: [number, number, number] = [30, 20, 20];
  let turbidity = 6;
  let rayleigh = 2;
  let inclination = 0.15;
  let mieCoefficient = 0.005;

  if (skyPreset === 'sunset') {
    skySunPosition = [25, 3, -20];
    turbidity = 15;
    rayleigh = 5;
    inclination = 0.45;
  } else if (skyPreset === 'night') {
    skySunPosition = [0, -100, 0];
    turbidity = 2;
    rayleigh = 0.1;
    inclination = 0.02;
  } else if (skyPreset === 'forest') {
    skySunPosition = [15, 30, 15];
    turbidity = 4;
    rayleigh = 1.8;
  } else if (skyPreset === 'desert') {
    skySunPosition = [30, 35, -10];
    turbidity = 20;
    rayleigh = 4.5;
  } else if (skyPreset === 'nuclear') {
    skySunPosition = [10, 12, -10];
    turbidity = 50;
    rayleigh = 8;
  } else if (skyPreset === 'void') {
    skySunPosition = [0.01, 0.01, 0.01];
    turbidity = 0.1;
    rayleigh = 0.1;
  }

  const floorTextureType = isSurvival ? 'grass' : isRacing ? 'road' : isPlatformer ? 'grid' : isAdventure ? 'grass' : 'grid';
  const floorBaseTexture = getProceduralTexture(floorTextureType);

  const floorTexture = useMemo(() => {
    const tex = floorBaseTexture.clone();
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(isSurvival ? 120 : isRacing ? 80 : 100, isSurvival ? 120 : isRacing ? 80 : 100);
    tex.needsUpdate = true;
    return tex;
  }, [floorBaseTexture, template]);

  return (
    <>
      {/* Premium environmental atmospheric fog */}
      <fog attach="fog" args={[fogColor, 15, Math.max(20, fogDensity * 4)]} />

      {/* Dynamic sky dome colors matching theme context */}
      <Sky 
        distance={450000} 
        sunPosition={skySunPosition} 
        inclination={inclination} 
        azimuth={0.25} 
        turbidity={turbidity}
        rayleigh={rayleigh}
        mieCoefficient={mieCoefficient}
        mieDirectionalG={0.8}
      />

      {/* Beautiful glowing hemisphere light for real natural color blending */}
      <hemisphereLight 
        color={skyPreset === 'sunset' ? '#ffedd5' : skyPreset === 'night' ? '#1e1b4b' : skyPreset === 'nuclear' ? '#4ade80' : '#f0f9ff'} 
        groundColor={skyPreset === 'forest' ? '#15803d' : '#0f172a'} 
        intensity={skyPreset === 'night' ? 0.25 : 0.8} 
      />

      <ambientLight intensity={skyPreset === 'night' ? 0.2 : 0.75} />

      {/* Advanced Directional Sun Light configured for soft crisp shadows */}
      <directionalLight 
        position={[25, 45, 20]} 
        intensity={skyPreset === 'night' ? 0.3 : 1.7} 
        castShadow 
        shadow-bias={-0.0001}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
        shadow-camera-near={0.1}
        shadow-camera-far={200}
      />

      {/* Cyber Highway Road markers for the Racing mode! (No black space) */}
      {isRacing && (
        <>
          {/* Main Highway center ribbon block and neon edge bands */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, -20]} receiveShadow>
            <planeGeometry args={[14, 110]} />
            <meshStandardMaterial color="#2d2f34" roughness={0.7} metalness={0.4} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[32, -0.005, -20]} receiveShadow>
            <planeGeometry args={[14, 110]} />
            <meshStandardMaterial color="#2d2f34" roughness={0.7} metalness={0.4} />
          </mesh>
          {/* Checkered Start Line */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 1]}>
            <planeGeometry args={[14, 2]} />
            <meshBasicMaterial color="#fefefe" depthWrite={true} />
          </mesh>
        </>
      )}
      
      {/* Terrain Floor with custom procedural texture and lighting */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[400, 400]} />
        <meshStandardMaterial 
          map={floorTexture}
          color={skyPreset === 'forest' ? '#15803d' : skyPreset === 'desert' ? '#eab308' : skyPreset === 'nuclear' ? '#052e16' : skyPreset === 'night' ? '#111827' : '#0284c7'} 
          roughness={0.85} 
          metalness={0.1}
        />
      </mesh>
      
      {/* Interactive animated Water grid plane layer */}
      {waterLevel > -8 && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, waterLevel, 0]}>
          <planeGeometry args={[420, 420]} />
          <meshStandardMaterial 
            color="#0ea5e9" 
            roughness={0.1} 
            metalness={0.9} 
            transparent 
            opacity={0.6} 
            emissive="#0284c7"
            emissiveIntensity={0.2}
          />
        </mesh>
      )}

      {/* Spatial coordinate guide grids */}
      <Grid 
        position={[0, 0.005, 0]} 
        args={[400, 400]} 
        cellSize={1.5} 
        cellThickness={0.8} 
        cellColor={skyPreset === 'nuclear' ? '#22c55e' : skyPreset === 'sunset' ? '#f59e0b' : '#38bdf8'} 
        sectionSize={15} 
        sectionThickness={1.8} 
        sectionColor={skyPreset === 'nuclear' ? '#14532d' : skyPreset === 'sunset' ? '#ea580c' : '#0284c7'} 
        fadeDistance={120} 
        fadeStrength={1.2} 
      />

      {/* If playing Sandbox 3D, draw Simulated Physics Bodies, otherwise draw original walls */}
      {mode === 'play' && template === 'Sandbox 3D' ? (
         playState.sandboxBodies.map((b: any) => (
            <DynamicShapeMesh 
              key={b.id}
              obj={{
                id: b.id,
                type: 'wall',
                position: [b.position.x, b.position.y, b.position.z],
                scale: b.scale,
                color: b.color,
                shape: b.shape,
                texture_style: b.texture_style,
                rotation: b.rotation
              }}
              selectedId={null}
              mode="play"
              setSelectedId={() => {}}
            />
         ))
      ) : (
         objects.map((obj: any) => {
           if (obj.type === 'wall') {
             return (
                <DynamicShapeMesh 
                  key={obj.id} 
                  obj={obj} 
                  selectedId={selectedId} 
                  mode={mode} 
                  setSelectedId={setSelectedId}
                  updateObject={updateObject} 
                />
             );
           }
           if (obj.type === 'checkpoint') {
             return (
                <group key={obj.id} position={obj.position}>
                   {/* Glowing neon green base and flag */}
                   <mesh rotation={[-Math.PI/2, 0, 0]}>
                      <circleGeometry args={[1.2, 16]} />
                      <meshBasicMaterial color="#10b981" transparent opacity={0.6} depthWrite={false} />
                   </mesh>
                   <mesh position={[0, 1.2, 0]}>
                      <cylinderGeometry args={[0.06, 0.06, 2.4, 8]} />
                      <meshStandardMaterial color="#475569" />
                   </mesh>
                   <mesh position={[0, 2.0, 0.2]} rotation={[0, Math.PI/2, 0]}>
                      <coneGeometry args={[0.3, 0.6, 4]} />
                      <meshBasicMaterial color="#10b981" />
                   </mesh>
                </group>
             );
           }
           if (obj.type === 'finish') {
             return (
                <group key={obj.id} position={obj.position}>
                   {/* Glowing swirling portal */}
                   <mesh rotation={[0, Math.sin(performance.now() * 0.0015) * 0.4, 0]} castShadow>
                      <torusGeometry args={[1.5, 0.16, 8, 32]} />
                      <meshStandardMaterial color="#c084fc" emissive="#a855f7" emissiveIntensity={0.8} />
                   </mesh>
                   <pointLight intensity={3.0} color="#e9d5ff" distance={12} />
                </group>
             );
           }
           if (obj.type === 'spawn') {
             return (
                <mesh key={obj.id} position={[obj.position[0], 0.1, obj.position[2]]} rotation={[-Math.PI/2, 0, 0]}>
                  <circleGeometry args={[1.8, 32]} />
                  <meshBasicMaterial color="#22d3ee" transparent opacity={mode === 'play' ? 0.1 : 0.65} />
                </mesh>
             );
           }
           if (obj.type === 'water') {
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
           }
            if (obj.type === 'nature') {
              const natureType = obj.nature_type || 'tree';
              const color = obj.color || (natureType === 'tree' ? '#15803d' : '#64748b');
              return (
                <group key={obj.id} position={obj.position} scale={obj.scale} rotation={obj.rotation || [0,0,0]} onClick={(e) => {
                  if (mode === 'edit') {
                    e.stopPropagation();
                    setSelectedId(obj.id);
                  }
                }}>
                  {natureType === 'tree' ? (
                    <group>
                      <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
                        <cylinderGeometry args={[0.18, 0.25, 1.2, 8]} />
                        <meshStandardMaterial color="#78350f" roughness={0.9} />
                      </mesh>
                      <mesh position={[0, 1.8, 0]} castShadow>
                        <coneGeometry args={[0.92, 1.8, 6]} />
                        <meshStandardMaterial color={color} roughness={0.8} />
                      </mesh>
                      <mesh position={[0, 2.7, 0]} castShadow>
                        <coneGeometry args={[0.65, 1.3, 6]} />
                        <meshStandardMaterial color={color} roughness={0.8} />
                      </mesh>
                    </group>
                  ) : natureType === 'rock' ? (
                    <mesh castShadow receiveShadow>
                      <dodecahedronGeometry args={[0.75, 1]} />
                      <meshStandardMaterial color={color} roughness={0.8} metalness={0.2} flatShading />
                    </mesh>
                  ) : natureType === 'bush' ? (
                    <group>
                      <mesh position={[0, 0.3, 0]} castShadow>
                        <sphereGeometry args={[0.55, 8, 8]} />
                        <meshStandardMaterial color={color} roughness={0.9} />
                      </mesh>
                      <mesh position={[0.35, 0.25, 0.2]} castShadow>
                        <sphereGeometry args={[0.42, 8, 8]} />
                        <meshStandardMaterial color={color} roughness={0.9} />
                      </mesh>
                      <mesh position={[-0.3, 0.2, -0.3]} castShadow>
                        <sphereGeometry args={[0.48, 8, 8]} />
                        <meshStandardMaterial color={color} roughness={0.9} />
                      </mesh>
                    </group>
                  ) : natureType === 'mountain' ? (
                    <group>
                      <mesh position={[0, -0.2, 0]} castShadow receiveShadow>
                        <coneGeometry args={[4, 6, 8]} />
                        <meshStandardMaterial color={color} roughness={0.9} flatShading />
                      </mesh>
                    </group>
                  ) : (
                    <mesh castShadow receiveShadow>
                      <boxGeometry args={[1.2, 1.2, 1.2]} />
                      <meshStandardMaterial color={color} roughness={0.5} metalness={0.15} />
                    </mesh>
                  )}
                  {selectedId === obj.id && mode === 'edit' && (
                    <lineSegments>
                      <edgesGeometry args={[new THREE.BoxGeometry(1.5, 2.5, 1.5)]} />
                      <lineBasicMaterial color="#22d3ee" linewidth={4} />
                    </lineSegments>
                  )}

                  {mode === 'edit' && selectedId === obj.id && (
                     <mesh position={[0, 1.0, 0]}>
                        <boxGeometry args={[1.5, 3.0, 1.5]} />
                        <meshBasicMaterial color="#22d3ee" wireframe transparent opacity={0.6} />
                     </mesh>
                  )}
                </group>
              );
            }
            if (obj.type === 'npc') {
              const color = obj.color || '#f43f5e';
              const name = obj.npc_name || 'Droid';
              return (
                <group key={obj.id} position={obj.position} scale={obj.scale} onClick={(e) => {
                  if (mode === 'edit') {
                    e.stopPropagation();
                    setSelectedId(obj.id);
                  }
                }}>
                  <mesh position={[0, 0.9, 0]} castShadow>
                    <capsuleGeometry args={[0.26, 0.5, 4, 8]} />
                    <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} metalness={0.8} roughness={0.2} />
                  </mesh>
                  <mesh position={[0, 1.1, 0.18]}>
                    <boxGeometry args={[0.35, 0.1, 0.1]} />
                    <meshBasicMaterial color="#22d3ee" />
                  </mesh>
                  <mesh position={[0, 0.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
                    <torusGeometry args={[0.5, 0.06, 6, 16]} />
                    <meshStandardMaterial color="#475569" metalness={0.7} />
                  </mesh>
                  <Text position={[0, 1.7, 0]} fontSize={0.3} color="#ffffff" anchorX="center" anchorY="middle">
                    {name}
                  </Text>
                  {selectedId === obj.id && mode === 'edit' && (
                    <lineSegments>
                      <edgesGeometry args={[new THREE.BoxGeometry(1.2, 1.8, 1.2)]} />
                      <lineBasicMaterial color="#22d3ee" linewidth={4} />
                    </lineSegments>
                  )}
                </group>
              );
            }
            if (obj.type === 'trigger') {
              return (
                <mesh key={obj.id} position={obj.position} scale={obj.scale} onClick={(e) => {
                  if (mode === 'edit') {
                    e.stopPropagation();
                    setSelectedId(obj.id);
                  }
                }}>
                  <boxGeometry args={[1, 1, 1]} />
                  <meshBasicMaterial color="#ec4899" transparent opacity={mode === 'edit' ? 0.35 : 0} wireframe={mode === 'edit'} />
                  {selectedId === obj.id && mode === 'edit' && (
                    <lineSegments>
                      <edgesGeometry args={[new THREE.BoxGeometry(1.05, 1.05, 1.05)]} />
                      <lineBasicMaterial color="#22d3ee" linewidth={4} />
                    </lineSegments>
                  )}
                </mesh>
              );
            }
            return null;
         })
      )}
    </>
  );
}

export function GameStudioEditor3D({ initialTemplate, draftId, onBack }: Editor3DProps) {
  const [mode, setMode] = useState<'edit' | 'play'>('edit');
  const [isPublishing, setIsPublishing] = useState(false);
  const [objects, setObjects] = useState<GameObject3D[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // States for the Visual Game Studio Editor
  const [editorTab, setEditorTab] = useState<'entidades' | 'bioma' | 'scripting' | 'assets' | 'terreno' | 'inspector'>('entidades');
  const [npcDialogueText, setNpcDialogueText] = useState('¡Hola aventurero! Recoge la gema.');
  const [npcNameText, setNpcNameText] = useState('Guía Nexus-7');
  const [cloudinaryAssetUrl, setCloudinaryAssetUrl] = useState('');
  
  const [mapProps, setMapProps] = useState<any>({
    skyPreset: initialTemplate === 'Zombie Survival 3D' ? 'night' : initialTemplate === 'Racing 3D' ? 'sunset' : initialTemplate === 'Platformer 3D' ? 'noon' : initialTemplate === 'Adventure 3D' ? 'forest' : 'noon',
    ambientColor: initialTemplate === 'Zombie Survival 3D' ? '#090d16' : initialTemplate === 'Racing 3D' ? '#450a0a' : '#1e1b4b',
    fogColor: initialTemplate === 'Zombie Survival 3D' ? '#090d16' : initialTemplate === 'Racing 3D' ? '#450a0a' : '#0f172a',
    fogDensity: 18,
    waterLevel: initialTemplate === 'Adventure 3D' ? -1.0 : -10,
    gravity: initialTemplate === 'Platformer 3D' ? 18.0 : 22.0,
    cameraMode: initialTemplate === 'Racing 3D' || initialTemplate === 'Platformer 3D' ? 'third' : 'first',
    rules: [
      { id: 'r1', trigger: 'player_touch_enemy', action: 'take_damage' },
      { id: 'r2', trigger: 'collect_gem', action: 'add_score_200' },
      { id: 'r3', trigger: 'shoot_weapon', action: 'laser_sound' }
    ]
  });

  // States mirroring playState for clean React HUD bindings
  const [uiScore, setUiScore] = useState(0);
  const [uiHealth, setUiHealth] = useState(3);
  const [uiGameOver, setUiGameOver] = useState(false);
  const [uiWave, setUiWave] = useState(1);
  const [uiAmmo, setUiAmmo] = useState(60);
  const [uiWeapon, setUiWeapon] = useState<'pistol' | 'shotgun' | 'plasma'>('pistol');
  const [carModeVisual, setCarModeVisual] = useState(false);
  const [snapToggle, setSnapToggle] = useState(true);

  // Stats for the live Speed HUD
  const [racingHUD, setRacingHUD] = useState({ speed: 0, lap: 1, best: 99.9 });

  useEffect(() => {
     async function loadAll() {
        setCarModeVisual(initialTemplate === 'Racing 3D');

        if (draftId) {
           const drafts = await getGameDrafts();
           const found = drafts.find(d => d.id === draftId);
           if (found && found.objects && found.objects.length > 0) {
              setObjects(found.objects);
              return;
           }
        }

        if (initialTemplate === 'Zombie Survival 3D') {
           const obs: GameObject3D[] = [
              { id: 'spawn', type: 'spawn', position: [0, 0, 0], scale: [1, 1, 1], color: '#22d3ee' },
              // Moonlight ruined walls
              { id: 'ruin1', type: 'wall', position: [-15, 3, -15], scale: [6, 6, 2], color: '#166534', texture_style: 'ruins' },
              { id: 'ruin2', type: 'wall', position: [15, 3, 15], scale: [2, 6, 8], color: '#166534', texture_style: 'ruins' },
              { id: 'ruin3', type: 'wall', position: [-25, 3, 25], scale: [8, 6, 2], color: '#022c22', texture_style: 'lava' },
              { id: 'ruin4', type: 'wall', position: [25, 3, -25], scale: [2, 6, 6], color: '#022c22', texture_style: 'lava' },
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
                 color: '#047857',
                 enemy_type: i > 8 ? 'cyborg' : 'zombie'
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
              { id: 'tr_left', type: 'wall', position: [-8, 2, 0], scale: [1, 4, 80], color: '#111827', texture_style: 'metal' },
              { id: 'tr_right', type: 'wall', position: [8, 2, 0], scale: [1, 4, 80], color: '#111827', texture_style: 'metal' },

              // Hairpin curve walls
              { id: 'tr_curve_in', type: 'wall', position: [16, 2, -40], scale: [32, 4, 1], color: '#a21caf', texture_style: 'neon' },
              { id: 'tr_curve_out', type: 'wall', position: [16, 2, -56], scale: [48, 4, 1], color: '#a21caf', texture_style: 'neon' },

              // Return lane
              { id: 'tr_ret_left', type: 'wall', position: [40, 2, 0], scale: [1, 4, 80], color: '#111827', texture_style: 'metal' },
              { id: 'tr_ret_right', type: 'wall', position: [24, 2, 0], scale: [1, 4, 80], color: '#111827', texture_style: 'metal' },

              // Checkpoint gems
              { id: 'nitro1', type: 'pickup', position: [0, 1.2, -20], scale: [1, 1, 1], color: '#ea580c' },
              { id: 'nitro2', type: 'pickup', position: [16, 1.2, -48], scale: [1, 1, 1], color: '#e11d48' },
              { id: 'nitro3', type: 'pickup', position: [32, 1.2, -20], scale: [1, 1, 1], color: '#ea580c' },
              { id: 'nitro4', type: 'pickup', position: [32, 1.2, 10], scale: [1, 1, 1], color: '#ea580c' },
           ]);
        } else if (initialTemplate === 'Platformer 3D') {
           setObjects([
              { id: 'spawn', type: 'spawn', position: [0, 0, 15], scale: [1, 1, 1], color: '#22d3ee' },
              { id: 'p1', type: 'wall', position: [0, 1, 10], scale: [4, 2, 4], color: '#0ea5e9', texture_style: 'grid', shape: 'cube' },
              { id: 'p2', type: 'wall', position: [0, 3, 3], scale: [3.5, 6, 3.5], color: '#0ea5e9', texture_style: 'grid', shape: 'cube' },
              { id: 'check1', type: 'checkpoint', position: [0, 6.1, 3], scale: [1, 1, 1], color: '#10b981' },
              { id: 'lava_pit', type: 'wall', position: [0, 0.5, -4], scale: [14, 1, 6], color: '#ef4444', texture_style: 'lava', shape: 'cube' },
              { id: 'p3_sphere', type: 'wall', position: [-4, 3.5, -4], scale: [3, 3, 3], color: '#fb923c', texture_style: 'neon', shape: 'sphere' },
              { id: 'p4_cylinder', type: 'wall', position: [4, 4.5, -10], scale: [2.5, 5, 2.5], color: '#a855f7', texture_style: 'metal', shape: 'cylinder' },
              { id: 'p5', type: 'wall', position: [0, 5.5, -18], scale: [4, 11, 4], color: '#0ea5e9', texture_style: 'grid', shape: 'cube' },
              { id: 'check2', type: 'checkpoint', position: [0, 11.1, -18], scale: [1, 1, 1], color: '#10b981' },
              { id: 'p6_goal', type: 'wall', position: [0, 7.5, -28], scale: [5, 15, 5], color: '#ec4899', texture_style: 'neon', shape: 'cube' },
              { id: 'goal_portal', type: 'finish', position: [0, 15.2, -28], scale: [1, 1, 1], color: '#c084fc' },
              { id: 'gem1', type: 'pickup', position: [0, 3.2, 10], scale: [1, 1, 1], color: '#fbbf24' },
              { id: 'gem2', type: 'pickup', position: [-4, 6.2, -4], scale: [1, 1, 1], color: '#fbbf24' },
              { id: 'gem3', type: 'pickup', position: [4, 8.2, -10], scale: [1, 1, 1], color: '#fbbf24' },
              { id: 'gem4', type: 'pickup', position: [0, 12.2, -18], scale: [1, 1, 1], color: '#fbbf24' },
           ]);
        } else if (initialTemplate === 'Sandbox 3D') {
            setObjects([
               { id: 'spawn', type: 'spawn', position: [0, 0, 15], scale: [1, 1, 1], color: '#22d3ee' },
               { id: 's1_cube', type: 'wall', position: [-5, 4, 0], scale: [3, 3, 3], color: '#3b82f6', texture_style: 'neon', shape: 'cube' },
               { id: 's2_sphere', type: 'wall', position: [0, 6, -5], scale: [2.5, 2.5, 2.5], color: '#10b981', texture_style: 'grid', shape: 'sphere' },
               { id: 's3_cylinder', type: 'wall', position: [5, 5, 0], scale: [2, 4, 2], color: '#f59e0b', texture_style: 'metal', shape: 'cylinder' },
               { id: 's4_cone', type: 'wall', position: [-8, 10, -8], scale: [3, 4, 3], color: '#ec4899', texture_style: 'lava', shape: 'cone' },
               { id: 's5_torus', type: 'wall', position: [8, 8, -8], scale: [3.5, 1.5, 3.5], color: '#8b5cf6', texture_style: 'neon', shape: 'torus' },
               { id: 'sb_token', type: 'pickup', position: [0, 2.2, 0], scale: [1, 1, 1], color: '#fbbf24' },
            ]);
         } else if (initialTemplate === 'Adventure 3D') {
            setObjects([
               { id: 'spawn', type: 'spawn', position: [0, 0, 25], scale: [1, 1, 1], color: '#22d3ee' },
               { id: 'pine1', type: 'nature', nature_type: 'tree', position: [-10, 0, -10], scale: [1.2, 1.2, 1.2], color: '#166534' },
               { id: 'pine2', type: 'nature', nature_type: 'tree', position: [10, 0, -15], scale: [1.3, 1.3, 1.3], color: '#15803d' },
               { id: 'pine3', type: 'nature', nature_type: 'tree', position: [-20, 0, 20], scale: [1.4, 1.4, 1.4], color: '#14532d' },
               { id: 'rock1', type: 'nature', nature_type: 'rock', position: [-5, 0, -2], scale: [1.2, 1.2, 1.2], color: '#4b5563' },
               { id: 'rock2', type: 'nature', nature_type: 'rock', position: [12, 0, 8], scale: [1.5, 1.5, 1.5], color: '#374151' },
               { id: 'bush1', type: 'nature', nature_type: 'bush', position: [-3, 0, 4], scale: [1.0, 1.0, 1.0], color: '#10b981' },
               { id: 'bush2', type: 'nature', nature_type: 'bush', position: [8, 0, -4], scale: [1.2, 1.2, 1.2], color: '#059669' },
               { id: 'guide_robot', type: 'npc', npc_name: 'Guía Nexus-7', npc_dialog: '¡Bienvenido a Adventure 3D! Explora el bioma boscoso y cruza el portal.', position: [0, 0, 10], scale: [1, 1, 1], color: '#06b6d4' },
               { id: 'ruin_pillar', type: 'wall', position: [0, 4, -20], scale: [3, 8, 3], color: '#451a03', texture_style: 'ruins', shape: 'cylinder' },
               { id: 'ad_checkpoint', type: 'checkpoint', position: [0, 8.1, -20], scale: [1, 1, 1], color: '#10b981' },
               { id: 'ad_finish', type: 'finish', position: [0, 1.5, -35], scale: [1.2, 1.2, 1.2], color: '#c084fc' },
               { id: 'gem_ad1', type: 'pickup', position: [-12, 1.2, 12], scale: [1, 1, 1], color: '#fbbf24' },
               { id: 'gem_ad2', type: 'pickup', position: [12, 1.2, -12], scale: [1, 1, 1], color: '#fbbf24' },
            ]);
         } else if (initialTemplate === 'Crear desde cero 3D' || initialTemplate === 'Crear desde cero') {
            setObjects([
               { id: 'spawn', type: 'spawn', position: [0, 0, 15], scale: [1, 1, 1], color: '#22d3ee' },
               { id: 'guide_companion', type: 'npc', npc_name: 'Creador Compañero', npc_dialog: 'Haz click en "BIOMA" o "SCRIPTING" en el sidebar para empezar a dar vida visual a tu mapa desde cero.', position: [0, 0, 5], scale: [1, 1, 1], color: '#a21caf' },
               { id: 'starter_wall', type: 'wall', position: [0, 2, -5], scale: [8, 4, 1], color: '#1e293b', texture_style: 'grid', shape: 'cube' },
               { id: 'starter_checkpoint', type: 'checkpoint', position: [5, 0, -5], scale: [1, 1, 1], color: '#10b981' },
            ]);
         } else {
           // Default epic military/high-tech base for Shooter 3D!
           setObjects([
              { id: 'spawn', type: 'spawn', position: [0, 0, 20], scale: [1, 1, 1], color: '#22d3ee' },
              { id: 'corridor_n', type: 'wall', position: [0, 3, -30], scale: [60, 6, 2], color: '#334155', texture_style: 'metal', shape: 'cube' },
              { id: 'corridor_s', type: 'wall', position: [0, 3, 30], scale: [60, 6, 2], color: '#334155', texture_style: 'metal', shape: 'cube' },
              { id: 'corridor_e', type: 'wall', position: [30, 3, 0], scale: [2, 6, 60], color: '#334155', texture_style: 'metal', shape: 'cube' },
              { id: 'corridor_w', type: 'wall', position: [-30, 3, 0], scale: [2, 6, 60], color: '#334155', texture_style: 'metal', shape: 'cube' },
              
              // Tactical columns with neon glowing heads
              { id: 'col1', type: 'wall', position: [-12, 4, -12], scale: [3, 8, 3], color: '#0ea5e9', texture_style: 'neon', shape: 'cylinder' },
              { id: 'col2', type: 'wall', position: [12, 4, -12], scale: [3, 8, 3], color: '#0ea5e9', texture_style: 'neon', shape: 'cylinder' },
              { id: 'col3', type: 'wall', position: [-12, 4, 12], scale: [3, 8, 3], color: '#0ea5e9', texture_style: 'neon', shape: 'cylinder' },
              { id: 'col4', type: 'wall', position: [12, 4, 12], scale: [3, 8, 3], color: '#0ea5e9', texture_style: 'neon', shape: 'cylinder' },

              // Advanced interactive bullet-shields
              { id: 'shield1', type: 'wall', position: [0, 1.5, 8], scale: [10, 3, 1], color: '#22d3ee', texture_style: 'neon', shape: 'cube' },
              { id: 'shield2', type: 'wall', position: [-8, 1.5, -4], scale: [6, 3, 1], color: '#22d3ee', texture_style: 'neon', shape: 'cube' },
              { id: 'shield3', type: 'wall', position: [8, 1.5, -4], scale: [6, 3, 1], color: '#22d3ee', texture_style: 'neon', shape: 'cube' },
              
              // Elevated strategic platforms with loot
              { id: 'plat1', type: 'wall', position: [0, 4, -18], scale: [14, 1, 8], color: '#1e293b', texture_style: 'grid', shape: 'cube' },
              
              // Floating weapons & items pickup spawners
              { id: 'shotgun_item', type: 'pickup', position: [-12, 1.2, 0], scale: [1, 1, 1], color: '#ef4444', category: 'weapon_shotgun' },
              { id: 'plasma_item', type: 'pickup', position: [12, 1.2, 0], scale: [1, 1, 1], color: '#f97316', category: 'weapon_plasma' },
              { id: 'ammo1', type: 'pickup', position: [-22, 1.2, -22], scale: [1, 1, 1], color: '#86efac' },
              { id: 'ammo2', type: 'pickup', position: [22, 1.2, -22], scale: [1, 1, 1], color: '#86efac' },
              
              // Cybernetic enemies
              { id: 'spider1', type: 'enemy', position: [-15, 1, -15], scale: [1.2, 1.2, 1.2], color: '#dc2626', enemy_type: 'cyborg' },
              { id: 'spider2', type: 'enemy', position: [15, 1, -15], scale: [1.2, 1.2, 1.2], color: '#dc2626', enemy_type: 'cyborg' },
              { id: 'droid1', type: 'enemy', position: [-10, 1, 5], scale: [1.4, 2, 1.4], color: '#a21caf', enemy_type: 'zombie' },
              { id: 'droid2', type: 'enemy', position: [10, 1, 5], scale: [1.4, 2, 1.4], color: '#a21caf', enemy_type: 'zombie' },
              { id: 'boss_mecha', type: 'enemy', position: [0, 2, -15], scale: [2.5, 3.5, 2.5], color: '#dc2626', enemy_type: 'boss' },
           ]);
        }
     }
     loadAll();
  }, [initialTemplate, draftId]);

  // Autosave objects and visual map configurations when changed in edit mode!
  useEffect(() => {
    async function triggerAutosave() {
      if (draftId && objects.length > 0) {
        const drafts = await getGameDrafts();
        const found = drafts.find(d => d.id === draftId);
        if (found) {
          const cleanObjects = objects.filter(o => o.type !== "map_config");
          cleanObjects.push({
            id: "global_map_config",
            type: "map_config",
            position: [0, 0, 0],
            scale: [1, 1, 1],
            color: "#000000",
            skyPreset: mapProps.skyPreset,
            ambientColor: mapProps.ambientColor,
            fogColor: mapProps.fogColor,
            fogDensity: mapProps.fogDensity,
            waterLevel: mapProps.waterLevel,
            gravity: mapProps.gravity,
            cameraMode: mapProps.cameraMode,
            rules: mapProps.rules
          });
          found.objects = cleanObjects;
          found.updatedAt = new Date().toISOString();
          await saveGameDraft(found);
        }
      }
    }
    triggerAutosave();
  }, [objects, mapProps, draftId]);

  // Sync state loops for React HUD rendering overlay
  useEffect(() => {
    if (mode === 'play') {
      const interval = setInterval(() => {
        setUiScore(playState.score);
        setUiHealth(playState.health);
        setUiGameOver(playState.gameOver);
        setUiWave(playState.wave);
        setUiAmmo(playState.ammo);
        setUiWeapon(playState.currentWeapon);
        setRacingHUD({
          speed: Math.round(Math.abs(playState.carSpeed) * 4),
          lap: playState.lap,
          best: playState.bestLapTime
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [mode]);

  useEffect(() => {
     const down = (e: KeyboardEvent) => { 
       playState.keys[e.key.toLowerCase()] = true; 
       if (e.code === 'Space') {
         if (initialTemplate === 'Platformer 3D' && mode === 'play') {
           if (playState.onGround) {
             playState.playerVel.y = 11.5;
             playState.onGround = false;
             playState.doubleJumpUsed = false;
             audio3D.playLaser(); // fun jump chirp
           } else if (!playState.doubleJumpUsed) {
             playState.playerVel.y = 10.5;
             playState.doubleJumpUsed = true;
             audio3D.playLaser(); // Double jump!
           }
         } else {
           playState.isShooting = true; 
         }
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
  }, [initialTemplate, mode]);

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
    playState.carCheckpointCount = 0;
    playState.lap = 1;
    playState.bestLapTime = 99.9;
    playState.lapStart = performance.now();

    // Reset platformer player position
    playState.playerPos.set(0, 1.6, 15);
    playState.playerVel.set(0, 0, 0);
    playState.checkpointPos.set(0, 1.6, 15);
    playState.onGround = true;
    playState.doubleJumpUsed = false;

    // Reset sandbox bodies
    if (initialTemplate === 'Sandbox 3D') {
      playState.sandboxBodies = objects
        .filter((o) => o.type === 'wall')
        .map((o) => ({
           id: o.id,
           position: new THREE.Vector3(...o.position),
           velocity: new THREE.Vector3((Math.random() - 0.5) * 8, 4 + Math.random() * 8, (Math.random() - 0.5) * 8),
           scale: o.scale,
           color: o.color,
           shape: o.shape,
           texture_style: o.texture_style,
           rotation: o.rotation
        }));
    } else {
      playState.sandboxBodies = [];
    }

    setUiGameOver(false);
    setUiScore(0);
    setUiHealth(4);
    setMode('play');
  };

  const handleStopPlay = () => {
    playState.score = 0;
    playState.bullets = [];
    playState.enemies = [];
    playState.sandboxBodies = [];
    setMode('edit');
  };

  const cloneSelection = () => {
    if (!selectedId) return;
    const model = objects.find(o => o.id === selectedId);
    if (!model) return;
    const clonedId = 'cloned_' + Math.random().toString(36).substr(2, 9);
    const clonedObj: GameObject3D = {
      ...model,
      id: clonedId,
      position: [model.position[0] + 3, model.position[1], model.position[2] + 3]
    };
    setObjects([...objects, clonedObj]);
    setSelectedId(clonedId);
    audio3D.playScoreUp();
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
            <color 
              attach="background" 
              args={[
                mapProps?.skyPreset === 'night' ? '#090d16' : 
                mapProps?.skyPreset === 'sunset' ? '#ffedd5' : 
                mapProps?.skyPreset === 'forest' ? '#c7d2fe' : 
                mapProps?.skyPreset === 'nuclear' ? '#dcfce7' : 
                mapProps?.skyPreset === 'desert' ? '#fef08a' : 
                '#e0f2fe'
              ]} 
            />
            {mode === 'edit' && <OrbitControls makeDefault />}
            
            <LevelEnvironment 
              objects={objects} 
              setObjects={setObjects}
              mode={mode} 
              selectedId={selectedId} 
              setSelectedId={setSelectedId} 
              template={initialTemplate}
            />

            {mode === 'play' && (
              <>
                <PlayerController 
                  spawn={objects.find((o: any) => o.type === 'spawn')?.position || [0,0,0]} 
                  walls={objects.filter((o: any) => o.type === 'wall')} 
                  template={initialTemplate}
                  mapProps={mapProps}
                />
                
                {!carModeVisual && <PlayerWeapon mapProps={mapProps} template={initialTemplate} />}
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
               <div className="p-6 flex flex-col gap-4 w-full">
                  <div className="flex justify-between items-center">
                     <div className="flex flex-col gap-1">
                        <div className="flex gap-2">
                           {[1, 2, 3, 4].map(i => (
                              <svg key={i} className={`w-8 h-8 ${i <= uiHealth ? 'text-rose-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]' : 'text-gray-800'} transition-colors`} fill="currentColor" viewBox="0 0 24 24">
                                 <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                              </svg>
                           ))}
                        </div>
                        {(initialTemplate === 'Shooter 3D' || initialTemplate === 'Zombie Survival 3D') && (
                           <div className="text-[11px] font-black font-mono text-cyan-400/80 tracking-wider">
                              ESTADO: OLEADA ALIENÍGENA {uiWave}
                           </div>
                        )}
                     </div>

                     {/* WEAPONS & AMMO (Only for Shooters) */}
                     {(!carModeVisual && (initialTemplate === 'Shooter 3D' || initialTemplate === 'Zombie Survival 3D')) && (
                        <div className="flex flex-col items-center bg-black/40 border border-white/5 px-4 py-1.5 rounded-xl backdrop-blur-sm">
                           <span className="text-xl font-black font-mono text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.3)]">{uiAmmo > 0 ? uiAmmo : 'RECARGANDO...'} <span className="text-xs text-gray-400">/ inf</span></span>
                           <span className="text-[9px] font-bold font-mono text-gray-400 uppercase tracking-widest">{uiWeapon}</span>
                        </div>
                     )}

                     <div className="text-3xl font-black font-mono text-cyan-400 drop-shadow-[0_0_12px_rgba(6,182,212,0.4)]">
                        {uiScore.toString().padStart(6, '0')} PTS
                     </div>
                  </div>

                  {/* WEAPONS ROW Touch cycle selector (floating pointer-events-auto overlay) */}
                  {(!carModeVisual && (initialTemplate === 'Shooter 3D' || initialTemplate === 'Zombie Survival 3D')) && (
                     <div className="flex justify-center gap-2 pointer-events-auto">
                        {['pistol', 'shotgun', 'plasma'].map((wName) => {
                           const isUnlocked = playState.unlockedWeapons.includes(wName);
                           const isSelected = uiWeapon === wName;
                           return (
                              <button
                                 key={wName}
                                 onClick={() => {
                                    if (isUnlocked) {
                                       playState.currentWeapon = wName as any;
                                       audio3D.playNitro();
                                    }
                                 }}
                                 disabled={!isUnlocked}
                                 className={`px-3 py-1.5 rounded-lg border font-black text-[10px] tracking-wide font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                                    isSelected 
                                       ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50 shadow-[0_0_10px_rgba(34,211,238,0.25)]' 
                                       : isUnlocked 
                                          ? 'bg-black/60 text-gray-300 border-white/10 hover:border-white/20' 
                                          : 'bg-black/80 text-gray-600 border-dashed border-white/5 opacity-40 cursor-not-allowed'
                                 }`}
                              >
                                 <span className="capitalize">{wName}</span>
                                 {!isUnlocked && (
                                    <svg className="w-3 h-3 text-rose-500" fill="currentColor" viewBox="0 0 24 24">
                                       <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                                    </svg>
                                 )}
                              </button>
                           );
                        })}
                     </div>
                  )}
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
                       <div className="flex flex-col items-end gap-1.5 p-4 rounded-2xl bg-black/60 border border-white/5 backdrop-blur-md text-right pointer-events-none">
                         <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider font-mono">Dashboard Telemetría</span>
                         <span className="text-2xl font-black font-mono text-cyan-400">{racingHUD.speed} KM/H</span>
                         <div className="text-xs text-slate-300 font-semibold font-mono space-y-0.5">
                           <div>VUELTA: <span className="text-emerald-400">{racingHUD.lap}</span></div>
                           <div>MEJOR TIEMPO: <span className="text-yellow-400">{racingHUD.best === 99.9 ? 'N/A' : `${racingHUD.best}s`}</span></div>
                         </div>
                       </div>
                     )}
                   </div>
               </div>
            </div>
          )}

          {/* REALTIME 3D PREMIUM SIDEBAR SYSTEM WITH TABS */}
          {mode === 'edit' && (
            <div className="absolute right-4 top-4 bg-[#090d16]/96 backdrop-blur-md border border-cyan-500/20 p-5 rounded-3xl w-72 shadow-2xl flex flex-col gap-4 max-h-[85vh] overflow-y-auto z-10 select-none shadow-[0_0_30px_rgba(0,0,0,0.6)] border-solid">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <h3 className="text-cyan-400 font-extrabold font-mono text-xs tracking-wider flex items-center gap-1.5"><Settings className="w-4 h-4"/> GAMES STUDIO 3D</h3>
                <button 
                  onClick={() => setSnapToggle(!snapToggle)} 
                  className={snapToggle ? "text-[9px] px-2 py-0.5 rounded font-bold font-mono border transition-all bg-cyan-500/20 text-cyan-300 border-cyan-400/50 shadow-[0_0_8px_rgba(34,211,238,0.2)]" : "text-[9px] px-2 py-0.5 rounded font-bold font-mono border transition-all bg-slate-800 text-slate-500 border-white/5"}
                >
                  SNAP: {snapToggle ? "ON" : "OFF"}
                </button>
              </div>

              {/* Premium Tab Buttons */}
              <div className="flex border-b border-white/10 pb-2 overflow-x-auto gap-2 no-scrollbar scroll-smooth">
                {((["entidades", "bioma", "scripting", "assets", "terreno", "inspector"] as const)).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setEditorTab(tab)}
                    className={editorTab === tab ? "text-[9px] px-2.5 py-1.5 rounded-lg border font-black font-mono tracking-wide uppercase transition-all flex-shrink-0 cursor-pointer bg-cyan-500/20 text-cyan-300 border-cyan-400/40 shadow-[0_0_10px_rgba(34,211,238,0.2)]" : "text-[9px] px-2.5 py-1.5 rounded-lg border font-black font-mono tracking-wide uppercase transition-all flex-shrink-0 cursor-pointer bg-black/30 text-gray-500 border-transparent hover:text-white hover:bg-white/5"}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              
              {/* TAB 1: ADD ENTITIY PAINTERS */}
              {editorTab === "entidades" && (
                <div className="flex flex-col gap-4 text-xs h-[60vh] overflow-y-auto no-scrollbar scroll-smooth">
                  
                  {/* CONSTRUCCION */}
                  <div className="flex flex-col gap-2 mt-1">
                    <div className="text-[9px] text-cyan-300 font-bold tracking-wider mb-0.5 border-b border-cyan-500/20 pb-1">CONSTRUCCIÓN</div>
                    <div className="grid grid-cols-3 gap-2">
                      <button onClick={() => setObjects([...objects, { id: "w_"+Date.now(), type: "wall", shape: "cube", position: [0, 2, 0], scale: [4, 4, 1], color: "#334155", texture_style: "metal", label: "Pared" }])} className="bg-white/5 hover:bg-white/10 p-2 rounded-lg text-white text-[9px] font-mono flex flex-col items-center gap-1 cursor-pointer border border-white/5"><div className="w-6 h-6 bg-slate-500 rounded-sm mb-1"></div>Pared</button>
                      <button onClick={() => setObjects([...objects, { id: "f_"+Date.now(), type: "wall", shape: "cube", position: [0, 0.5, 0], scale: [6, 1, 6], color: "#475569", texture_style: "concrete", label: "Piso" }])} className="bg-white/5 hover:bg-white/10 p-2 rounded-lg text-white text-[9px] font-mono flex flex-col items-center gap-1 cursor-pointer border border-white/5"><div className="w-6 h-2 bg-slate-400 rounded-sm mb-2 mt-2"></div>Piso</button>
                      <button onClick={() => setObjects([...objects, { id: "r_"+Date.now(), type: "wall", shape: "cube", position: [0, 4, 0], scale: [6, 0.5, 6], color: "#1e293b", texture_style: "grid", label: "Techo" }])} className="bg-white/5 hover:bg-white/10 p-2 rounded-lg text-white text-[9px] font-mono flex flex-col items-center gap-1 cursor-pointer border border-white/5"><div className="w-6 h-2 bg-slate-600 rounded-sm mb-1 mt-1"></div>Techo</button>
                      <button onClick={() => setObjects([...objects, { id: "b_"+Date.now(), type: "wall", shape: "cube", position: [0, 1.5, 0], scale: [1, 3, 1], color: "#8b5cf6", texture_style: "neon", label: "Pilar" }])} className="bg-white/5 hover:bg-white/10 p-2 rounded-lg text-white text-[9px] font-mono flex flex-col items-center gap-1 cursor-pointer border border-white/5"><div className="w-2 h-6 bg-violet-500 rounded-sm mb-1"></div>Pilar</button>
                      <button onClick={() => setObjects([...objects, { id: "rs_"+Date.now(), type: "wall", shape: "cylinder", position: [0, 1.5, 0], scale: [1, 3, 1], color: "#fb7185", texture_style: "ruins", label: "Pedestal" }])} className="bg-white/5 hover:bg-white/10 p-2 rounded-lg text-white text-[9px] font-mono flex flex-col items-center gap-1 cursor-pointer border border-white/5"><div className="w-4 h-6 bg-rose-400 rounded-sm mb-1 rounded-t-full"></div>Cilindro</button>
                      <button onClick={() => setObjects([...objects, { id: "lake_"+Date.now(), type: "water", position: [0, 0, 0], scale: [10, 1, 10], color: "#0ea5e9", label: "Cubo de Agua" }])} className="bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 p-2 rounded-lg text-[9px] font-mono flex flex-col items-center gap-1 cursor-pointer border border-sky-500/20"><div className="w-4 h-4 mb-1 bg-sky-500/50 border border-sky-400 rounded-sm"></div> Agua</button>
                    </div>
                  </div>

                  {/* OBJETOS INTERACTIVOS */}
                  <div className="flex flex-col gap-2">
                    <div className="text-[9px] text-amber-300 font-bold tracking-wider mb-0.5 border-b border-amber-500/20 pb-1">GAMEPLAY & LOOT</div>
                    <div className="grid grid-cols-3 gap-2">
                      <button onClick={() => setObjects([...objects, { id: "p_"+Date.now(), type: "pickup", position: [0, 1.5, 0], scale: [1, 1, 1], color: "#fbbf24", label: "Cofre" }])} className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 p-2 rounded-lg text-[9px] font-mono flex flex-col items-center gap-1 cursor-pointer border border-amber-500/20"><Sparkles className="w-4 h-4 mb-1"/> Cofre Loot</button>
                      <button onClick={() => setObjects([...objects, { id: "c_"+Date.now(), type: "checkpoint", position: [0, 0.5, 0], scale: [1, 1, 1], color: "#10b981", label: "Checkpoint" }])} className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 p-2 rounded-lg text-[9px] font-mono flex flex-col items-center gap-1 cursor-pointer border border-emerald-500/20"><MapPin className="w-4 h-4 mb-1"/> Punto Respawn</button>
                      <button onClick={() => setObjects([...objects, { id: "car_"+Date.now(), type: "vehicle", position: [0, 0.5, 0], scale: [1, 1, 1], color: "#ef4444", label: "Vehículo", rotation: [0,0,0] }])} className="bg-red-500/10 hover:bg-red-500/20 text-red-400 p-2 rounded-lg text-[9px] font-mono flex flex-col items-center gap-1 cursor-pointer border border-red-500/20"><Zap className="w-4 h-4 mb-1"/> Auto</button>
                    </div>
                  </div>

                  {/* NATURALEZA Y PROPS */}
                  <div className="flex flex-col gap-2">
                    <div className="text-[9px] text-emerald-300 font-bold tracking-wider mb-0.5 border-b border-emerald-500/20 pb-1">NATURALEZA</div>
                    <div className="grid grid-cols-3 gap-2">
                      <button onClick={() => setObjects([...objects, { id: "n_"+Date.now(), type: "nature", nature_type: "tree", position: [0, 0, 0], scale: [1.2, 1.2, 1.2], color: "#166534", label: "Árbol Pino" }])} className="bg-white/5 hover:bg-white/10 p-2 rounded-lg text-white text-[9px] font-mono flex flex-col items-center gap-1 cursor-pointer border border-white/5"><Info className="w-4 h-4 mb-1 text-emerald-500"/> Pino</button>
                      <button onClick={() => setObjects([...objects, { id: "nr_"+Date.now(), type: "nature", nature_type: "rock", position: [0, 0, 0], scale: [2, 2, 2], color: "#475569", label: "Roca Gigante" }])} className="bg-white/5 hover:bg-white/10 p-2 rounded-lg text-white text-[9px] font-mono flex flex-col items-center gap-1 cursor-pointer border border-white/5"><div className="w-4 h-4 mb-1 bg-slate-500 rounded-full"></div> Roca</button>
                      <button onClick={() => setObjects([...objects, { id: "nb_"+Date.now(), type: "nature", nature_type: "bush", position: [0, 0, 0], scale: [1, 1, 1], color: "#15803d", label: "Arbusto" }])} className="bg-white/5 hover:bg-white/10 p-2 rounded-lg text-white text-[9px] font-mono flex flex-col items-center gap-1 cursor-pointer border border-white/5"><div className="w-4 h-4 mb-1 bg-green-600 rounded-full"></div> Arbusto</button>
                    </div>
                  </div>

                  {/* IA Y ENEMIGOS */}
                  <div className="flex flex-col gap-2 border-t border-fuchsia-500/20 pt-2 pb-4">
                    <div className="text-[9px] text-fuchsia-300 font-bold tracking-wider mb-0.5 border-b border-fuchsia-500/20 pb-1">PERSONAJES E IA</div>
                    <div className="grid grid-cols-3 gap-2">
                      <button onClick={() => setObjects([...objects, { id: "e_"+Date.now(), type: "enemy", position: [0, 1.2, 0], scale: [1, 1, 1], color: "#047857", enemy_type: "zombie", label: "Zombie" }])} className="bg-red-500/5 hover:bg-red-500/15 text-red-400 p-2 rounded-lg text-[9px] font-mono flex flex-col items-center gap-1 cursor-pointer border border-red-500/10"><Eye className="w-4 h-4 mb-1"/> Enemigo Base</button>
                      <button onClick={() => setObjects([...objects, { id: "eb_"+Date.now(), type: "enemy", position: [0, 2, 0], scale: [1.5, 1.5, 1.5], color: "#b91c1c", enemy_type: "boss", label: "Jefe Final" }])} className="bg-red-500/5 hover:bg-red-500/15 text-red-500 p-2 rounded-lg text-[9px] font-mono flex flex-col items-center gap-1 cursor-pointer border border-red-500/10"><Shield className="w-4 h-4 mb-1"/> Mega Boss</button>
                      <button onClick={() => setObjects([...objects, { id: "npc_"+Date.now(), type: "npc", npc_name: "Aldeano Nuevo", npc_dialog: "Presiona para hablar.", position: [0, 1.2, 0], scale: [1, 1, 1], color: "#c084fc", label: "NPC Fijo" }])} className="bg-fuchsia-500/5 hover:bg-fuchsia-500/15 text-fuchsia-400 p-2 rounded-lg text-[9px] font-mono flex flex-col items-center gap-1 cursor-pointer border border-fuchsia-500/10"><UserCircle className="w-4 h-4 mb-1"/> NPC Diálogo</button>
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 2: ATMOSPHERES, BIOME AND PHYSICS */}
              {editorTab === "bioma" && (
                <div className="flex flex-col gap-3 text-xs">
                  <div className="text-[10px] text-cyan-300/60 font-mono uppercase tracking-wider mb-0.5">Atmosfera, Clima y Gravedad</div>
                  
                  <div>
                    <label className="text-[10px] text-gray-500 font-bold block mb-1">PRESET CIELO Y BIOMA</label>
                    <select 
                      value={mapProps.skyPreset} 
                      onChange={(e) => setMapProps({ ...mapProps, skyPreset: e.target.value })}
                      className="w-full bg-slate-900 border border-white/10 text-white px-3 py-2 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    >
                      <option value="noon">DIA NITIDO</option>
                      <option value="sunset">ATARDECER CALIDO</option>
                      <option value="night">NOCHE LUNAR OSCURA</option>
                      <option value="forest">BIOMA BOSQUEDAL VERDE</option>
                      <option value="nuclear">PARAMO NUCLEAR VERDECINO</option>
                      <option value="desert">DESIERTO DE AZUFRE AMARILLENTO</option>
                    </select>
                  </div>

                  <div>
                     <label className="text-[10px] text-gray-500 font-bold block mb-1">DENSIDAD NIEBLA (PROG)</label>
                     <input 
                       type="range" 
                       min={5} 
                       max={40} 
                       value={mapProps.fogDensity} 
                       onChange={(e) => setMapProps({ ...mapProps, fogDensity: parseInt(e.target.value) })}
                       className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
                     />
                     <div className="text-[10px] text-slate-400 font-mono text-right">{mapProps.fogDensity + "m Visibilidad"}</div>
                  </div>

                  <div>
                     <label className="text-[10px] text-gray-500 font-bold block mb-1">ALTURA AGUA INTERACTIVA</label>
                     <input 
                       type="range" 
                       min={-12} 
                       max={4} 
                       step={0.5}
                       value={mapProps.waterLevel} 
                       onChange={(e) => setMapProps({ ...mapProps, waterLevel: parseFloat(e.target.value) })}
                       className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
                     />
                     <div className="text-[10px] text-slate-400 font-mono text-right">{mapProps.waterLevel <= -8 ? "DESACTIVADA" : mapProps.waterLevel + "m Altitud"}</div>
                  </div>

                  <div>
                     <label className="text-[10px] text-gray-500 font-bold block mb-1">CONSTANTE DE GRAVEDAD</label>
                     <input 
                       type="range" 
                       min={5} 
                       max={40} 
                       value={mapProps.gravity} 
                       onChange={(e) => setMapProps({ ...mapProps, gravity: parseInt(e.target.value) })}
                       className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
                     />
                     <div className="text-[10px] text-slate-400 font-mono text-right">{mapProps.gravity + " m/s²"}</div>
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-500 font-bold block mb-1">CAMARA DE JUEGO (PERSPECTIVA)</label>
                    <select 
                      value={mapProps.cameraMode} 
                      onChange={(e) => setMapProps({ ...mapProps, cameraMode: e.target.value })}
                      className="w-full bg-slate-900 border border-white/10 text-white px-3 py-2 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    >
                      <option value="first">FPP (Cámara de Primera Persona)</option>
                      <option value="third">TPP (Cámara Móvil Trasera de Tercera Persona)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* TAB 3: VISUAL SCRIPTING CONDITIONS */}
              {editorTab === "scripting" && (
                <div className="flex flex-col gap-3 text-xs">
                  <div className="text-[10px] text-cyan-300/60 font-mono uppercase tracking-wider mb-0.5">Scripting Tactil Inteligente</div>
                  
                  <div className="bg-cyan-500/5 border border-cyan-500/10 p-3 rounded-2xl text-[10.5px] leading-relaxed text-slate-300 font-mono">
                     <span className="text-cyan-400 font-bold">REGLAS ACTIVAS:</span>
                     <ul className="list-disc pl-4 space-y-1 mt-1.5 text-slate-400">
                       <li>Contacto Monstruo → <span className="text-yellow-400">Resta Vida</span></li>
                       <li>Capturar Gema → <span className="text-emerald-400">Añado 200 pts</span></li>
                       <li>Disparar Arma → <span className="text-cyan-400">Sonido Rayo Laser</span></li>
                     </ul>
                  </div>

                  <div className="space-y-2">
                    <div className="text-[10px] text-gray-500 font-bold uppercase font-mono">Configuracion NARRATIVA Dialogo NPC</div>
                    <div>
                       <label className="text-[9px] text-gray-500 font-mono">Nombre del Guia NPC</label>
                       <input 
                         type="text" 
                         value={npcNameText} 
                         onChange={(e) => {
                           setNpcNameText(e.target.value);
                           setObjects(objects.map(o => o.type==="npc" ? {...o, npc_name: e.target.value} : o));
                         }}
                         className="w-full bg-slate-900 border border-white/10 text-white px-2.5 py-1.5 rounded-lg text-xs font-mono"
                       />
                    </div>
                    <div>
                       <label className="text-[9px] text-gray-500 font-mono">Lineas de Guion / Dialogo</label>
                       <textarea 
                         rows={2}
                         value={npcDialogueText} 
                         onChange={(e) => {
                           setNpcDialogueText(e.target.value);
                           setObjects(objects.map(o => o.type==="npc" ? {...o, npc_dialog: e.target.value} : o));
                         }}
                         className="w-full bg-slate-900 border border-white/10 text-white px-2.5 py-1.5 rounded-lg text-xs font-mono resize-none focus:outline-none"
                       />
                    </div>
                  </div>
                </div>
              )}

              
              {/* TAB: TERRENO ESTRUCTURAL */}
              {editorTab === "terreno" && (
                <div className="flex flex-col gap-3 text-xs">
                  <div className="text-[10px] text-cyan-300/60 font-mono uppercase tracking-wider mb-0.5">Editor de Terreno Real</div>
                  
                  <div className="bg-white/5 border border-white/10 p-3 rounded-2xl text-[10.5px] leading-relaxed text-slate-300 font-mono">
                     Selecciona herramientas para esculpir el terreno o utiliza la construcción modular. (Deslizadores para escalar montañas próximamente).
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-2">
                     <button onClick={() => setObjects([...objects, { id: "n_"+Date.now(), type: "nature", nature_type: "mountain", position: [0, 0, 0], scale: [8, 8, 8], color: "#475569", label: "Montaña Rocosa" }])} className="bg-white/5 hover:bg-white/10 p-2.5 rounded-xl text-white text-[10px] font-mono flex flex-col items-center gap-1 cursor-pointer border border-white/5">Montañas +</button>
                     <button onClick={() => setObjects(objects.filter(o => o.nature_type !== 'mountain'))} className="bg-white/5 hover:bg-white/10 p-2.5 rounded-xl text-white text-[10px] font-mono flex flex-col items-center gap-1 cursor-pointer border border-white/5">Aplanar -</button>
                  </div>
                  
                  <div className="mt-4">
                     <label className="text-[10px] text-gray-500 font-bold block mb-1 font-mono">TEXTURAS DE TERRENO (GLOBAL)</label>
                     <select 
                       value={mapProps?.floorTexture || 'grid'} 
                       onChange={(e) => setMapProps({...mapProps, floorTexture: e.target.value})}
                       className="w-full bg-slate-900 border border-white/10 text-white px-3 py-2 rounded-lg font-mono focus:outline-none"
                     >
                       <option value="grass">Hierba Real</option>
                       <option value="dirt">Tierra</option>
                       <option value="sand">Arena</option>
                       <option value="snow">Nieve</option>
                       <option value="concrete">Concreto Urbano</option>
                       <option value="grid">Grid (Development)</option>
                     </select>
                  </div>
                </div>
              )}

              {/* TAB: INSPECTOR / JERARQUIA */}
              {editorTab === "inspector" && (
                <div className="flex flex-col gap-3 text-xs">
                  <div className="text-[10px] text-cyan-300/60 font-mono uppercase tracking-wider mb-0.5">Jerarquía de la Escena (Real)</div>
                  
                  <div className="bg-black/40 border border-white/10 p-2 rounded-xl text-[10px] font-mono max-h-48 overflow-y-auto">
                     {objects.map(o => (
                       <div 
                         key={o.id} 
                         onClick={() => setSelectedId(o.id)}
                         className={`p-1.5 flex justify-between items-center rounded cursor-pointer ${selectedId === o.id ? 'bg-cyan-500/20 text-cyan-300' : 'hover:bg-white/5 text-gray-400'}`}
                       >
                         <span>{o.type.toUpperCase()} ({o.id.split('_').pop()})</span>
                         <button onClick={(e) => { e.stopPropagation(); setObjects(objects.filter(x => x.id !== o.id)); }} className="text-red-400 hover:text-red-300"><Trash2 className="w-3 h-3"/></button>
                       </div>
                     ))}
                  </div>
                  <div className="mt-2 flex gap-2">
                     <button onClick={() => setObjects([])} className="flex-1 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded font-bold uppercase cursor-pointer">Limpiar Mapa</button>
                  </div>
                </div>
              )}


              {/* TAB 4: EXTERNAL CLOUDINARY TEXTURES AND CDN STORES */}
              {editorTab === "assets" && (
                <div className="flex flex-col gap-3 text-xs">
                  <div className="text-[10px] text-cyan-300/60 font-mono uppercase tracking-wider mb-0.5">Importar Modelos y Texturas CDN</div>
                  
                  <div>
                    <label className="text-[10px] text-gray-500 font-bold block mb-1 font-mono">SERVIDORES DE ASSETS DISPONIBLES</label>
                    <select className="w-full bg-slate-900 border border-white/10 text-white px-3 py-2 rounded-lg font-mono focus:outline-none">
                      <option>Cloudinary Asset Store API</option>
                      <option>IndexedDB Cache Local de Assets</option>
                    </select>
                  </div>

                  <div>
                     <label className="text-[10px] text-gray-500 font-bold block mb-1 font-mono">ENLACE URL DE RECURSO (PNG/JPG)</label>
                     <input 
                       type="text" 
                       placeholder="https://cloudinary.com/user/asset.png"
                       value={cloudinaryAssetUrl} 
                       onChange={(e) => setCloudinaryAssetUrl(e.target.value)}
                       className="w-full bg-slate-900 border border-white/10 text-gray-400 px-3 py-1.5 rounded-lg text-[10px] font-mono focus:outline-none"
                     />
                     <div className="text-[9px] text-slate-500 font-mono mt-1 leading-relaxed">Puedes pegar URLs de Cloudinary externas para aplicar a texturas mapeadas.</div>
                     <button
                       onClick={() => {
                         if (selectedId && cloudinaryAssetUrl) {
                           setObjects(objects.map(o => o.id === selectedId ? {...o, texture_style: "custom_cdn", color: "#ffffff"} : o));
                           alert("¡Textura vinculada con éxito!");
                         } else {
                           alert("Selecciona un objeto primero.");
                         }
                       }} 
                       className="w-full mt-2 py-1.5 bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-extrabold text-[10px] uppercase rounded-lg cursor-pointer font-mono"
                     >
                       Vincular Textura CDN
                     </button>
                  </div>
                </div>
              )}

              {/* SELECTION INSPECTOR */}
              {selectedId && (
                <div className="border-t border-white/10 pt-4 space-y-4">
                   <div className="flex items-center justify-between">
                     <h4 className="text-white font-black text-xs font-mono text-cyan-300">INSPECTOR</h4>
                     <button onClick={cloneSelection} className="text-[9px] px-2 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 font-extrabold font-mono rounded cursor-pointer">DUPLICAR</button>
                   </div>
                   {objects.filter(o => o.id === selectedId).map(obj => (
                      <div key={obj.id} className="space-y-3.5 text-xs">
                         <div>
                            <label className="text-[10px] text-gray-500 font-bold block mb-1">POSICION X</label>
                            <input 
                              type="number" 
                              step={snapToggle ? 1 : 0.1}
                              value={obj.position[0]} 
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                const snapVal = snapToggle ? Math.round(val) : val;
                                setObjects(objects.map(o => o.id===obj.id ? {...o, position: [snapVal, o.position[1], o.position[2]]} : o))
                              }} 
                              className="w-full bg-slate-900 border border-white/10 text-white px-3 py-1.5 rounded-lg text-xs font-mono" 
                            />
                         </div>
                         <div>
                            <label className="text-[10px] text-gray-500 font-bold block mb-1">POSICION Z</label>
                            <input 
                              type="number" 
                              step={snapToggle ? 1 : 0.1}
                              value={obj.position[2]} 
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                const snapVal = snapToggle ? Math.round(val) : val;
                                setObjects(objects.map(o => o.id===obj.id ? {...o, position: [o.position[0], o.position[1], snapVal]} : o))
                              }} 
                              className="w-full bg-slate-900 border border-white/10 text-white px-3 py-1.5 rounded-lg text-xs font-mono" 
                            />
                         </div>
                         <div>
                            <label className="text-[10px] text-gray-500 font-bold block mb-1">ALTURA (Y)</label>
                            <input 
                              type="number" 
                              step={0.1}
                              value={obj.position[1]} 
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setObjects(objects.map(o => o.id===obj.id ? {...o, position: [o.position[0], val, o.position[2]]} : o))
                              }} 
                              className="w-full bg-slate-900 border border-white/10 text-white px-3 py-1.5 rounded-lg text-xs font-mono" 
                            />
                         </div>
                         
                         {(obj.type === "wall" || obj.type === "nature") && (
                              <>
                              <div>
                                 <label className="text-[10px] text-gray-500 font-bold block mb-1">ANCHO (X)</label>
                                 <input 
                                   type="number" 
                                   step={snapToggle ? 1 : 0.1}
                                   value={obj.scale[0]} 
                                   onChange={(e) => {
                                     const val = parseFloat(e.target.value) || 1;
                                     const snapVal = snapToggle ? Math.round(val) : val;
                                     setObjects(objects.map(o => o.id===obj.id ? {...o, scale: [snapVal, o.scale[1], o.scale[2]]} : o))
                                   }} 
                                   className="w-full bg-slate-900 border border-white/10 text-white px-3 py-1.5 rounded-lg text-xs font-mono" 
                                 />
                              </div>
                              <div>
                                 <label className="text-[10px] text-gray-500 font-bold block mb-1">ALTO (Y)</label>
                                 <input 
                                   type="number" 
                                   step={snapToggle ? 1 : 0.1}
                                   value={obj.scale[1]} 
                                   onChange={(e) => {
                                     const val = parseFloat(e.target.value) || 1;
                                     const snapVal = snapToggle ? Math.round(val) : val;
                                     setObjects(objects.map(o => o.id===obj.id ? {...o, scale: [o.scale[0], snapVal, o.scale[2]]} : o))
                                   }} 
                                   className="w-full bg-slate-900 border border-white/10 text-white px-3 py-1.5 rounded-lg text-xs font-mono" 
                                 />
                              </div>
                              <div>
                                 <label className="text-[10px] text-gray-500 font-bold block mb-1">PROG (Z)</label>
                                 <input 
                                   type="number" 
                                   step={snapToggle ? 1 : 0.1}
                                   value={obj.scale[2]} 
                                   onChange={(e) => {
                                     const val = parseFloat(e.target.value) || 1;
                                     const snapVal = snapToggle ? Math.round(val) : val;
                                     setObjects(objects.map(o => o.id===obj.id ? {...o, scale: [o.scale[0], o.scale[1], snapVal]} : o))
                                   }} 
                                   className="w-full bg-slate-900 border border-white/10 text-white px-3 py-1.5 rounded-lg text-xs font-mono" 
                                 />
                              </div>
                              <div>
                                 <label className="text-[10px] text-gray-500 font-bold block mb-1">ROTACION (GRADOS Y)</label>
                                 <input 
                                   type="range" 
                                   min={0}
                                   max={360}
                                   value={Math.round((obj.rotation?.[1] || 0) * (180 / Math.PI))} 
                                   onChange={(e) => {
                                     const degrees = parseInt(e.target.value);
                                     const radians = degrees * (Math.PI / 180);
                                     setObjects(objects.map(o => o.id===obj.id ? {...o, rotation: [0, radians, 0]} : o))
                                   }} 
                                   className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none" 
                                 />
                              </div>
                              {obj.type === "wall" && (
                              <div>
                                 <label className="text-[10px] text-gray-500 font-bold block mb-1">TEXTURA</label>
                                 <select 
                                   value={obj.texture_style || "neon"} 
                                   onChange={(e) => setObjects(objects.map(o => o.id===obj.id ? {...o, texture_style: e.target.value} : o))}
                                   className="w-full bg-slate-900 border border-white/10 text-white px-3 py-2 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-cyan-500 select-none"
                                 >
                                   <option value="neon">NEON SHIELD</option>
                                   <option value="grid">VECTOR MATRIX</option>
                                   <option value="metal">CHUNDER METAL</option>
                                   <option value="lava">MOLTEN LAVA</option>
                                   <option value="ruins">ANCIENT STONE</option>
                                 </select>
                              </div>
                              )}
                              {obj.type === "nature" && (
                              <div>
                                 <label className="text-[10px] text-gray-500 font-bold block mb-1">BIOMA VEGETAL</label>
                                 <select 
                                   value={obj.nature_type || "tree"} 
                                   onChange={(e) => setObjects(objects.map(o => o.id===obj.id ? {...o, nature_type: e.target.value, color: e.target.value === "tree" ? "#15803d" : "#64748b"} : o))}
                                   className="w-full bg-slate-900 border border-white/10 text-white px-3 py-2 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-cyan-500"
                                 >
                                   <option value="tree">ARBOL PINO FRONDOSO</option>
                                   <option value="rock">ROCA SOLIDA GRISACEA</option>
                                   <option value="bush">ARBUSTO FRUTAL SILVESTRE</option>
                                   <option value="crate">CAJA DE MADERA TACTICA</option>
                                 </select>
                              </div>
                              )}
                              </>
                          )}

                          {obj.type === "enemy" && (
                              <div>
                                 <label className="text-[10px] text-gray-500 font-bold block mb-1">TIPO DE HOSTIL</label>
                                 <select 
                                   value={obj.enemy_type || "zombie"} 
                                   onChange={(e) => {
                                     const type = e.target.value;
                                     setObjects(objects.map(o => o.id===obj.id ? {...o, enemy_type: type, color: type==="cyborg"?"#111827":type==="boss"?"#0f172a":"#047857"} : o))
                                   }}
                                   className="w-full bg-slate-900 border border-white/10 text-white px-3 py-2 rounded-lg text-xs"
                                 >
                                   <option value="zombie">VOXEL ZOMBIE</option>
                                   <option value="cyborg">Robo-Cyborg Spider</option>
                                   <option value="boss">HEAVY GOLEM BOSS</option>
                                 </select>
                              </div>
                          )}

                          {obj.type === "npc" && (
                              <div className="space-y-2">
                                 <div>
                                   <label className="text-[10px] text-gray-500 font-bold block">EDITAR NOMBRE NPC</label>
                                   <input 
                                     type="text" 
                                     value={obj.npc_name || "Guia Robot"} 
                                     onChange={(e) => setObjects(objects.map(o => o.id===obj.id ? {...o, npc_name: e.target.value} : o))}
                                     className="w-full bg-slate-900 border border-white/10 text-white px-3 py-1.5 rounded-lg text-xs font-mono"
                                   />
                                 </div>
                                 <div>
                                   <label className="text-[10px] text-gray-500 font-bold block">MENSAJE DIALOGO</label>
                                   <textarea 
                                     rows={3}
                                     value={obj.npc_dialog || "¡Hola!"} 
                                     onChange={(e) => setObjects(objects.map(o => o.id===obj.id ? {...o, npc_dialog: e.target.value} : o))}
                                     className="w-full bg-slate-900 border border-white/10 text-white px-3 py-1.5 rounded-lg text-xs font-mono resize-none focus:outline-none"
                                   />
                                 </div>
                              </div>
                          )}
                          
                          <div>
                             <label className="text-[10px] text-gray-500 font-bold block mb-1.5">COLOR DE MALLA</label>
                             <div className="flex gap-1.5 flex-wrap">
                               {["#0f172a", "#1e1b4b", "#1e293b", "#047857", "#fbbf24", "#06b6d4", "#dc2626", "#a21caf"].map(c => (
                                 <button 
                                   key={c} 
                                   onClick={() => setObjects(objects.map(o => o.id===obj.id ? {...o, color: c} : o))}
                                   className="w-5 h-5 rounded-full border border-white/10 cursor-pointer transition-all hover:scale-110" 
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

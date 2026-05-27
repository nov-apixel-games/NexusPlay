import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Play, Square, Save, Upload, RotateCcw, Check, Move, MousePointer2, PlusCircle, Settings, ChevronLeft, Globe, RefreshCcw, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { saveGameDraft } from '../../lib/offlineDb';

interface GameStudioEditorProps {
  initialTemplate: string;
  onBack: () => void;
}

interface GameObject {
  id: string;
  type: 'player' | 'platform' | 'enemy' | 'coin' | 'bullet' | 'obstacle' | 'checkpoint';
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  isStatic?: boolean;
  velocityX?: number;
  velocityY?: number;
  hp?: number;
  owner?: 'player' | 'enemy';
  spriteUrl?: string;
  isPatrolling?: boolean;
  patrolMinX?: number;
  patrolMaxX?: number;
  points?: number;
}

interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  text?: string;
}

// Global lightweight Web Audio helper for Game Synth sounds
class WebAudioSynth {
  ctx: AudioContext | null = null;

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  playJump() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(450, this.ctx.currentTime + 0.12);
    
    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }

  playCoin() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now); // A5
    osc.frequency.setValueAtTime(1200, now + 0.08); // D6
    
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
    
    osc.start();
    osc.stop(now + 0.25);
  }

  playShoot() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.14);
    
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.14);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.14);
  }

  playHurt() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(40, this.ctx.currentTime + 0.22);
    
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.22);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.22);
  }

  playExplosion() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(10, this.ctx.currentTime + 0.35);
    
    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.35);
  }

  playClick() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(300, this.ctx.currentTime);
    osc.frequency.setValueAtTime(500, this.ctx.currentTime + 0.05);
    
    gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }
}

const synth = new WebAudioSynth();
const imageCache: Record<string, HTMLImageElement> = {};

export function GameStudioEditor({ initialTemplate, onBack }: GameStudioEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [mode, setMode] = useState<'edit' | 'play'>('edit');
  const [objects, setObjects] = useState<GameObject[]>([]);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [gameScore, setGameScore] = useState(0);
  const [gameLives, setGameLives] = useState(3);
  const [cameraX, setCameraX] = useState(0);

  // Particle engine state
  const particles = useRef<Particle[]>([]);

  // Auto-save local draft
  useEffect(() => {
    let active = true;
    const triggerSave = async () => {
      try {
        if (!active || objects.length === 0) return;
        const draftId = `draft_${initialTemplate.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
        await saveGameDraft({
          id: draftId,
          title: `${initialTemplate} Game Studio`,
          objects: objects,
          updatedAt: new Date().toISOString()
        });
      } catch (err) {
        console.warn('[Offline AutoSave] Error guardando borrador:', err);
      }
    };
    const timer = setTimeout(triggerSave, 1500);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [objects, initialTemplate]);

  // Main gameplay states inside mutable ref for optimal 60Hz loop
  const playState = useRef({
    objects: [] as GameObject[],
    playerVelY: 0,
    playerVelX: 0,
    score: 0,
    lives: 3,
    gameOver: false,
    keys: {} as Record<string, boolean>,
    lastShot: 0,
    runDistance: 0,
    spawnTimer: 0,
    cameraX: 0,
    doubleJumpUsed: false
  });

  const editState = useRef({
    isDragging: false,
    dragOffset: { x: 0, y: 0 }
  });

  const getCanvasSize = () => {
    if (!containerRef.current) return { width: 800, height: 480 };
    return {
      width: containerRef.current.clientWidth,
      height: Math.min(480, window.innerHeight * 0.55)
    };
  };

  const canvasSize = getCanvasSize();

  const spawnParticles = (x: number, y: number, color: string, count: number, text?: string) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 150 + 50;
      particles.current.push({
        id: 'p_' + Math.random(),
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (text ? 80 : 20),
        color,
        size: text ? 14 : Math.random() * 4 + 2,
        life: 0.6,
        maxLife: 0.6,
        text: i === 0 ? text : undefined
      });
    }
  };

  // Build responsive templates on mount
  useEffect(() => {
    if (initialTemplate === 'Platformer') {
      setObjects([
        // Floor and walls
        { id: 'ground1', type: 'platform', x: 0, y: 400, width: 900, height: 80, color: '#0369a1', isStatic: true },
        { id: 'ground2', type: 'platform', x: 1000, y: 350, width: 800, height: 130, color: '#0284c7', isStatic: true },
        { id: 'ground3', type: 'platform', x: 1900, y: 400, width: 1000, height: 80, color: '#0369a1', isStatic: true },
        
        // Floating platforms
        { id: 'plat1', type: 'platform', x: 250, y: 280, width: 140, height: 20, color: '#38bdf8', isStatic: true },
        { id: 'plat2', type: 'platform', x: 450, y: 200, width: 140, height: 20, color: '#38bdf8', isStatic: true },
        { id: 'plat3', type: 'platform', x: 700, y: 240, width: 160, height: 20, color: '#38bdf8', isStatic: true },
        { id: 'plat4', type: 'platform', x: 1200, y: 220, width: 180, height: 20, color: '#0284c7', isStatic: true },
        
        // Player
        { id: 'p1', type: 'player', x: 80, y: 250, width: 44, height: 44, color: '#22d3ee', isStatic: false },
        
        // Coins (IndexedDB ready)
        { id: 'c1', type: 'coin', x: 300, y: 230, width: 18, height: 18, color: '#fbbf24' },
        { id: 'c2', type: 'coin', x: 500, y: 150, width: 18, height: 18, color: '#fbbf24' },
        { id: 'c3', type: 'coin', x: 750, y: 190, width: 18, height: 18, color: '#fbbf24' },
        { id: 'c4', type: 'coin', x: 1250, y: 160, width: 18, height: 18, color: '#fbbf24' },
        { id: 'c5', type: 'coin', x: 1300, y: 160, width: 18, height: 18, color: '#fbbf24' },
        { id: 'c6', type: 'coin', x: 1350, y: 160, width: 18, height: 18, color: '#fbbf24' },
        
        // Enemies (Real dynamics)
        { id: 'e1', type: 'enemy', x: 500, y: 356, width: 44, height: 44, color: '#f43f5e', isPatrolling: true, patrolMinX: 400, patrolMaxX: 650 },
        { id: 'e2', type: 'enemy', x: 1350, y: 306, width: 44, height: 44, color: '#f43f5e', isPatrolling: true, patrolMinX: 1100, patrolMaxX: 1600 },
        
        // Goals
        { id: 'checkpoint1', type: 'checkpoint', x: 2600, y: 320, width: 40, height: 80, color: '#10b981' }
      ]);
    } else if (initialTemplate === 'Endless Runner') {
      setObjects([
        { id: 'runner_ground', type: 'platform', x: 0, y: 400, width: 2500, height: 100, color: '#4f46e5', isStatic: true },
        { id: 'p1', type: 'player', x: 100, y: 250, width: 40, height: 40, color: '#22d3ee' },
        { id: 'obs1', type: 'obstacle', x: 800, y: 350, width: 40, height: 50, color: '#ec4899' },
        { id: 'obs2', type: 'obstacle', x: 1400, y: 350, width: 40, height: 50, color: '#ec4899' },
        { id: 'obs3', type: 'obstacle', x: 2000, y: 350, width: 40, height: 50, color: '#ec4899' },
        { id: 'coin1', type: 'coin', x: 550, y: 280, width: 18, height: 18, color: '#fbbf24' },
        { id: 'coin2', type: 'coin', x: 1100, y: 240, width: 18, height: 18, color: '#fbbf24' },
        { id: 'coin3', type: 'coin', x: 1750, y: 280, width: 18, height: 18, color: '#fbbf24' },
      ]);
    } else if (initialTemplate === 'Clicker / Idle') {
      setObjects([
        { id: 'coin_mega', type: 'coin', x: canvasSize.width/2 - 90, y: canvasSize.height/2 - 100, width: 180, height: 180, color: '#fbbf24' }
      ]);
    } else {
      // Arcade Space Shooter
      setObjects([
        { id: 'p1', type: 'player', x: 380, y: 380, width: 48, height: 48, color: '#22d3ee', hp: 3 },
        { id: 'enemy1', type: 'enemy', x: 150, y: 80, width: 40, height: 40, color: '#f43f5e', hp: 1 },
        { id: 'enemy2', type: 'enemy', x: 380, y: 60, width: 40, height: 40, color: '#f43f5e', hp: 1 },
        { id: 'enemy3', type: 'enemy', x: 600, y: 80, width: 40, height: 40, color: '#f43f5e', hp: 1 },
      ]);
    }
  }, [initialTemplate]);

  // Game Loop Renderer / Physic Step
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let lastTime = performance.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      playState.current.keys[e.key.toLowerCase()] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      playState.current.keys[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const step = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1); // Clamp physics frame drop
      lastTime = time;

      // Clear Canvas
      ctx.fillStyle = '#060814';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Render aesthetic sci-fi matrix grid layout
      ctx.save();
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.05)';
      ctx.lineWidth = 1;
      const stepGrid = 40;
      const scrollOffset = mode === 'play' ? playState.current.cameraX % stepGrid : 0;
      for (let x = -scrollOffset; x < canvas.width; x += stepGrid) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += stepGrid) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
      ctx.restore();

      // GAMEPLAY ACTIVE MODE
      if (mode === 'play') {
        const pState = playState.current;

        if (!pState.gameOver) {
          const pIdx = pState.objects.findIndex(o => o.type === 'player');
          
          if (pIdx !== -1) {
            const player = pState.objects[pIdx];

            // Setup camera boundaries
            if (initialTemplate === 'Platformer' || initialTemplate === 'Endless Runner') {
              pState.cameraX = Math.max(0, player.x - canvas.width / 3);
            } else {
              pState.cameraX = 0; // Space shooter is static screen
            }

            // INPUT CONTROLS / ACCELERATION
            if (initialTemplate === 'Endless Runner') {
              // Endless automatic speed scroll
              pState.runDistance += dt * 10;
              pState.score = Math.floor(pState.runDistance);
              setGameScore(pState.score);
              
              player.x += (250 + pState.runDistance * 0.4) * dt; // Progressive acceleration
              
              if (pState.keys['arrowup'] || pState.keys['w'] || pState.keys[' ']) {
                if (pState.playerVelY === 0) {
                  pState.playerVelY = -480;
                  synth.playJump();
                  pState.doubleJumpUsed = false;
                  pState.keys['arrowup'] = false; // Reset to avoid auto hover
                } else if (!pState.doubleJumpUsed) {
                  // Real double-jump!
                  pState.playerVelY = -400;
                  pState.doubleJumpUsed = true;
                  synth.playJump();
                  spawnParticles(player.x - pState.cameraX + player.width/2, player.y + player.height, '#22d3ee', 12);
                  pState.keys['arrowup'] = false;
                }
              }

              // Gravity
              pState.playerVelY += 1300 * dt;
              player.y += pState.playerVelY * dt;

              // Generate procedural obstacles smoothly
              pState.spawnTimer += dt;
              if (pState.spawnTimer > 2.2) {
                const spawnX = player.x + canvas.width + Math.random() * 300;
                // Alternate spikes or floating block
                const isSpike = Math.random() > 0.4;
                pState.objects.push({
                  id: 'obs_' + Math.random(),
                  type: isSpike ? 'obstacle' : 'platform',
                  x: spawnX,
                  y: isSpike ? 350 : 220,
                  width: isSpike ? 40 : 120,
                  height: isSpike ? 50 : 20,
                  color: isSpike ? '#ec4899' : '#312e81'
                });
                
                // Spawn bonus coins above spikes
                pState.objects.push({
                  id: 'coin_' + Math.random(),
                  type: 'coin',
                  x: spawnX + 10,
                  y: isSpike ? 240 : 160,
                  width: 18,
                  height: 18,
                  color: '#fbbf24'
                });

                pState.spawnTimer = 0;
              }

              // Filter out screens objects behind player to optimize low-poly Androids
              pState.objects = pState.objects.filter(o => o.type === 'player' || o.x > player.x - 300);

            } else if (initialTemplate === 'Arcade Shooter') {
              // Space Shooter movement limits
              if (pState.keys['arrowright'] || pState.keys['d']) pState.playerVelX = 300;
              else if (pState.keys['arrowleft'] || pState.keys['a']) pState.playerVelX = -300;
              else pState.playerVelX = 0;

              if (pState.keys['arrowup'] || pState.keys['w']) pState.playerVelY = -300;
              else if (pState.keys['arrowdown'] || pState.keys['s']) pState.playerVelY = 300;
              else pState.playerVelY = 0;

              player.x += pState.playerVelX * dt;
              player.y += pState.playerVelY * dt;

              // Auto-clamp boundaries
              if (player.x < 0) player.x = 0;
              if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
              if (player.y < 200) player.y = 200; // Stay in bottom arena half
              if (player.y + player.height > canvas.height) player.y = canvas.height - player.height;

              // Shooting setup
              if ((pState.keys[' '] || pState.keys['spacebar']) && time - pState.lastShot > 180) {
                pState.objects.push({
                  id: 'bullet_' + Math.random(),
                  type: 'bullet',
                  x: player.x + player.width/2 - 4,
                  y: player.y - 12,
                  width: 8,
                  height: 18,
                  color: '#fbbf24',
                  velocityY: -600,
                  owner: 'player'
                });
                synth.playShoot();
                pState.lastShot = time;
              }

              // Random spawns of space enemies
              if (Math.random() < 0.02) {
                pState.objects.push({
                  id: 'e_' + Math.random(),
                  type: 'enemy',
                  x: 40 + Math.random() * (canvas.width - 80),
                  y: -40,
                  width: 40,
                  height: 40,
                  color: '#ea580c',
                  hp: 1,
                  isPatrolling: true,
                  patrolMinX: 0,
                  patrolMaxX: canvas.width
                });
              }

            } else if (initialTemplate === 'Platformer') {
              // Traditional Platformer control set
              if (pState.keys['arrowright'] || pState.keys['d']) pState.playerVelX = 240;
              else if (pState.keys['arrowleft'] || pState.keys['a']) pState.playerVelX = -240;
              else pState.playerVelX = 0;

              if ((pState.keys['arrowup'] || pState.keys['w'] || pState.keys[' ']) && pState.playerVelY === 0) {
                pState.playerVelY = -460;
                synth.playJump();
              }

              // Gravity step
              pState.playerVelY += 1200 * dt;
              player.x += pState.playerVelX * dt;
              player.y += pState.playerVelY * dt;

              if (player.x < 0) player.x = 0;

              // Safe bottom trap
              if (player.y > canvas.height + 60) {
                synth.playHurt();
                pState.lives -= 1;
                setGameLives(pState.lives);
                if (pState.lives <= 0) {
                  pState.gameOver = true;
                } else {
                  // Respawn smoothly
                  player.x = 80;
                  player.y = 150;
                  pState.playerVelY = 0;
                  pState.playerVelX = 0;
                }
              }
            }

            // PATROLLING ENEMIES IN PLATFORMER OR SHOOTER
            for (let i = 0; i < pState.objects.length; i++) {
              const o = pState.objects[i];
              if (o.type === 'enemy' && o.isPatrolling) {
                if (!o.velocityX) o.velocityX = 90;
                o.x += o.velocityX * dt;

                // Alternate bounds
                if (o.patrolMinX !== undefined && o.x < o.patrolMinX) {
                  o.x = o.patrolMinX;
                  o.velocityX = -o.velocityX;
                } else if (o.patrolMaxX !== undefined && o.x > o.patrolMaxX) {
                  o.x = o.patrolMaxX;
                  o.velocityX = -o.velocityX;
                }
              }

              // Moving bullets
              if (o.type === 'bullet') {
                if (o.velocityY) o.y += o.velocityY * dt;
                
                // Bullet and Enemy colliders
                if (o.owner === 'player') {
                  for (let j = pState.objects.length - 1; j >= 0; j--) {
                    const possibleEnemy = pState.objects[j];
                    if (possibleEnemy.type === 'enemy') {
                      const hit = (
                        o.x < possibleEnemy.x + possibleEnemy.width &&
                        o.x + o.width > possibleEnemy.x &&
                        o.y < possibleEnemy.y + possibleEnemy.height &&
                        o.y + o.height > possibleEnemy.y
                      );
                      if (hit) {
                        synth.playExplosion();
                        spawnParticles(possibleEnemy.x + possibleEnemy.width/2, possibleEnemy.y + possibleEnemy.height/2, possibleEnemy.color, 18, '+50 EXP');
                        
                        pState.score += 50;
                        setGameScore(pState.score);
                        
                        pState.objects.splice(j, 1);
                        pState.objects.splice(pState.objects.indexOf(o), 1);
                        break;
                      }
                    }
                  }
                }
              }
            }

            // COLLISION DETERMINATION (AABB BOXES)
            let isOnFloor = false;
            for (let i = 0; i < pState.objects.length; i++) {
              const o = pState.objects[i];
              if (o.id === player.id || o.type === 'bullet') continue;

              const isColliding = (
                player.x < o.x + o.width &&
                player.x + player.width > o.x &&
                player.y < o.y + o.height &&
                player.y + player.height > o.y
              );

              if (isColliding) {
                if (o.type === 'platform') {
                  // Standard platform clip top response
                  if (pState.playerVelY > 0 && player.y + player.height - pState.playerVelY * dt <= o.y + 12) {
                    player.y = o.y - player.height;
                    pState.playerVelY = 0;
                    isOnFloor = true;
                  }
                } else if (o.type === 'coin') {
                  synth.playCoin();
                  spawnParticles(o.x + o.width/2, o.y + o.height/2, '#fbbf24', 8, '+1 Coin');
                  pState.score += 10;
                  setGameScore(pState.score);
                  pState.objects.splice(i, 1);
                  i--;
                } else if (o.type === 'obstacle') {
                  // Direct hurt response on spikes or hazard boxes
                  synth.playHurt();
                  pState.lives -= 1;
                  setGameLives(pState.lives);
                  spawnParticles(player.x + player.width/2, player.y + player.height/2, '#ef4444', 15);
                  
                  if (pState.lives <= 0) {
                    pState.gameOver = true;
                  } else {
                    // knock back slightly
                    player.x -= 120;
                    player.y = 150;
                  }
                } else if (o.type === 'enemy') {
                  // Check if we hit the head of the patrolling enemy (Sonic / Mario crush logic)
                  if (player.y + player.height - pState.playerVelY * dt <= o.y + 15 && pState.playerVelY > 0) {
                    synth.playExplosion();
                    spawnParticles(o.x + o.width/2, o.y + o.height/2, '#ef4444', 16, 'CRUSHED!');
                    pState.playerVelY = -350; // bounce
                    pState.score += 100;
                    setGameScore(pState.score);
                    pState.objects.splice(i, 1);
                    i--;
                  } else {
                    // standard damage
                    synth.playHurt();
                    pState.lives -= 1;
                    setGameLives(pState.lives);
                    spawnParticles(player.x + player.width/2, player.y + player.height/2, '#ef4444', 18);
                    
                    if (pState.lives <= 0) {
                      pState.gameOver = true;
                    } else {
                      player.x -= 150;
                      player.y = 100;
                    }
                  }
                } else if (o.type === 'checkpoint') {
                  // WIN SCENE TRIGGER!
                  synth.playCoin();
                  synth.playJump();
                  spawnParticles(o.x + o.width/2, o.y + o.height/2, '#10b981', 30, 'LEVEL COMPLETED!');
                  pState.score += 1000;
                  setGameScore(pState.score);
                  pState.gameOver = true;
                }
              }
            }
          }
        }

        // Apply particle dynamics
        for (let i = particles.current.length - 1; i >= 0; i--) {
          const p = particles.current[i];
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.life -= dt;
          if (p.life <= 0) {
            particles.current.splice(i, 1);
          }
        }

        setCameraX(pState.cameraX);
      }

      // DRAW GAME WORLD (With Camera View Offset)
      const finalCamX = mode === 'play' ? playState.current.cameraX : 0;

      // Filter to objects within rendering bounds
      const objectsToDraw = mode === 'play' ? playState.current.objects : objects;

      objectsToDraw.forEach(obj => {
        // Offset coords
        const screenX = obj.x - finalCamX;
        const screenY = obj.y;

        // Skip off-screen elements to save CPU processing
        if (screenX + obj.width < -100 || screenX > canvas.width + 100) return;

        ctx.fillStyle = obj.color;

        if (obj.type === 'coin') {
          // Draw nice real-time glittering spinning golden coin
          ctx.beginPath();
          ctx.arc(screenX + obj.width/2, screenY + obj.height/2, obj.width/2, 0, Math.PI * 2);
          ctx.fillStyle = '#fbbf24';
          ctx.fill();
          ctx.strokeStyle = '#d97706';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Sparkle star core
          ctx.beginPath();
          ctx.arc(screenX + obj.width/2, screenY + obj.height/2, obj.width/4, 0, Math.PI * 2);
          ctx.fillStyle = '#fef08a';
          ctx.fill();
        } else if (obj.type === 'player') {
          // Character with detailed stylized armor and animated thrusters
          ctx.fillStyle = obj.color;
          ctx.fillRect(screenX, screenY, obj.width, obj.height);

          // Visor helmet
          ctx.fillStyle = '#1e1b4b';
          ctx.fillRect(screenX + 8, screenY + 8, obj.width - 16, 12);
          
          ctx.fillStyle = '#22d3ee';
          ctx.fillRect(screenX + 12, screenY + 10, obj.width - 24, 6);

          // Under boots style
          ctx.fillStyle = '#111827';
          ctx.fillRect(screenX + 4, screenY + obj.height - 4, 10, 4);
          ctx.fillRect(screenX + obj.width - 14, screenY + obj.height - 4, 10, 4);
          
          // Subtle shield halo
          ctx.strokeStyle = 'rgba(34, 211, 238, 0.4)';
          ctx.lineWidth = 2;
          ctx.strokeRect(screenX - 4, screenY - 4, obj.width + 8, obj.height + 8);
        } else if (obj.type === 'enemy') {
          // Stylized creepy alien / robotic crab
          ctx.fillStyle = obj.color;
          ctx.fillRect(screenX, screenY, obj.width, obj.height);
          
          // Angry eyes
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(screenX + 6, screenY + 10, 10, 6);
          ctx.fillRect(screenX + obj.width - 16, screenY + 10, 10, 6);
          ctx.fillStyle = '#111827';
          ctx.fillRect(screenX + 10, screenY + 12, 4, 4);
          ctx.fillRect(screenX + obj.width - 12, screenY + 12, 4, 4);

          // Robot hazard lines
          ctx.fillStyle = 'rgba(0,0,0,0.2)';
          ctx.fillRect(screenX, screenY + obj.height - 10, obj.width, 4);
        } else if (obj.type === 'obstacle') {
          // Dangerous pink crystalline spikes
          ctx.beginPath();
          ctx.moveTo(screenX + obj.width/2, screenY);
          ctx.lineTo(screenX + obj.width, screenY + obj.height);
          ctx.lineTo(screenX, screenY + obj.height);
          ctx.closePath();
          ctx.fillStyle = '#db2777';
          ctx.fill();
          
          ctx.strokeStyle = '#f472b6';
          ctx.lineWidth = 1;
          ctx.stroke();
        } else if (obj.type === 'checkpoint') {
          // Emerald glowing portal/gate to complete level
          ctx.fillStyle = '#064e3b';
          ctx.fillRect(screenX, screenY, obj.width, obj.height);

          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 3;
          ctx.strokeRect(screenX + 4, screenY + 4, obj.width - 8, obj.height - 8);

          // Energy core
          const alphaPulse = Math.abs(Math.sin(time * 0.005));
          ctx.fillStyle = `rgba(16, 185, 129, ${0.2 + alphaPulse * 0.4})`;
          ctx.fillRect(screenX + 6, screenY + 6, obj.width - 12, obj.height - 12);
        } else {
          // Standard structural platform with retro wireframe
          ctx.fillStyle = obj.color;
          ctx.fillRect(screenX, screenY, obj.width, obj.height);

          // Platform glowing top border outline
          ctx.fillStyle = 'rgba(255,255,255,0.15)';
          ctx.fillRect(screenX, screenY, obj.width, 3);
        }
      });

      // Render Active Particles System
      particles.current.forEach(p => {
        const screenX = p.x - finalCamX;
        if (p.text) {
          ctx.fillStyle = '#22d3ee';
          ctx.font = 'black 14px monospace';
          ctx.fillText(p.text, screenX, p.y);
        } else {
          ctx.fillStyle = p.color;
          ctx.fillRect(screenX, p.y, p.size, p.size);
        }
      });

      // EDITOR WIREFRAMES & MARGINS
      if (mode === 'edit') {
        objects.forEach(obj => {
          if (selectedObjectId === obj.id) {
            ctx.strokeStyle = '#22d3ee';
            ctx.lineWidth = 2.5;
            ctx.strokeRect(obj.x - 3, obj.y - 3, obj.width + 6, obj.height + 6);
            
            // Draw interactive anchor dragging point handle
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(obj.x + obj.width - 6, obj.y + obj.height - 6, 12, 12);
            ctx.strokeStyle = '#22d3ee';
            ctx.strokeRect(obj.x + obj.width - 6, obj.y + obj.height - 6, 12, 12);
          }
        });
      }

      animId = requestAnimationFrame(step);
    };

    animId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [mode, objects, selectedObjectId, canvasSize]);


  const startPlayMode = () => {
    synth.init();
    synth.playClick();
    
    playState.current = {
      objects: JSON.parse(JSON.stringify(objects)),
      playerVelY: 0,
      playerVelX: 0,
      score: 0,
      lives: initialTemplate === 'Arcade Shooter' ? 3 : 5,
      gameOver: false,
      keys: {},
      lastShot: 0,
      runDistance: 0,
      spawnTimer: 0,
      cameraX: 0,
      doubleJumpUsed: false
    };

    setGameScore(0);
    setGameLives(playState.current.lives);
    setMode('play');
  };

  const stopPlayMode = () => {
    synth.playClick();
    setMode('edit');
    setGameScore(0);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (mode === 'play') {
      if (playState.current.gameOver) {
        startPlayMode();
        return;
      }

      if (initialTemplate === 'Clicker / Idle') {
        playState.current.objects.forEach(obj => {
          if (obj.type === 'coin') {
            const isInside = x >= obj.x && x <= obj.x + obj.width && y >= obj.y && y <= obj.y + obj.height;
            if (isInside) {
              synth.playClick();
              playState.current.score += 1;
              setGameScore(playState.current.score);
              spawnParticles(x, y, '#22d3ee', 5, '+$1 GOLD');

              // Pop squish animation
              const origW = obj.width;
              obj.width = origW * 0.9;
              obj.x += origW * 0.05;
              setTimeout(() => {
                obj.width = origW;
                obj.x -= origW * 0.05;
              }, 120);
            }
          }
        });
      } else {
        // Tap screen simulates primary jump trigger
        playState.current.keys['w'] = true;
        setTimeout(() => {
          playState.current.keys['w'] = false;
        }, 120);
      }
      return;
    }

    // EDITOR DETECT CLICK SELECTION
    let clickedAny = false;
    for (let i = objects.length - 1; i >= 0; i--) {
      const obj = objects[i];
      if (x >= obj.x && x <= obj.x + obj.width && y >= obj.y && y <= obj.y + obj.height) {
        setSelectedObjectId(obj.id);
        editState.current.isDragging = true;
        editState.current.dragOffset = { x: x - obj.x, y: y - obj.y };
        clickedAny = true;
        break;
      }
    }

    if (!clickedAny) {
      setSelectedObjectId(null);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (mode === 'play' || !editState.current.isDragging || !selectedObjectId) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setObjects(prev => prev.map(obj => {
      if (obj.id === selectedObjectId) {
        // Grid snap alignment for neat platform layout designs
        const alignGrid = playState.current.keys['shift'] ? 1 : 20;
        const targetX = Math.round((x - editState.current.dragOffset.x) / alignGrid) * alignGrid;
        const targetY = Math.round((y - editState.current.dragOffset.y) / alignGrid) * alignGrid;
        return {
          ...obj,
          x: Math.max(0, Math.min(canvas.width * 4, targetX)),
          y: Math.max(0, Math.min(canvas.height - 40, targetY))
        };
      }
      return obj;
    }));
  };

  const handlePointerUp = () => {
    editState.current.isDragging = false;
  };

  const addNewObject = (type: GameObject['type']) => {
    const id = 'obj_' + Math.random().toString(36).substr(2, 9);
    const newObj: GameObject = {
      id,
      type,
      x: 100 + Math.random() * 200,
      y: 120 + Math.random() * 100,
      width: type === 'platform' ? 120 : type === 'checkpoint' ? 40 : 40,
      height: type === 'platform' ? 20 : type === 'checkpoint' ? 80 : 40,
      color: type === 'player' ? '#22d3ee' : type === 'enemy' ? '#f43f5e' : type === 'coin' ? '#fbbf24' : '#0284c7'
    };
    if (type === 'obstacle') {
      newObj.color = '#db2777';
      newObj.width = 40;
      newObj.height = 50;
    }
    setObjects([...objects, newObj]);
    setSelectedObjectId(id);
    synth.playClick();
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] bg-[#02040a] flex flex-col w-screen h-screen m-0 p-0 left-0 top-0 overflow-hidden">
      
      {/* Dynamic Header */}
      <div className="bg-[#090d16] border-b border-white/5 py-4 pt-8 sm:pt-4 px-6 flex items-center justify-between z-[100] shrink-0 shadow-lg">
         <div className="flex items-center gap-4">
           <button onClick={onBack} className="p-3 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-all cursor-pointer">
              <ChevronLeft className="w-5 h-5 animate-pulse" />
           </button>
           <div>
             <h2 className="text-white font-black text-lg tracking-tight flex items-center gap-2">
               Games Studio <span className="text-[10px] px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-bold uppercase tracking-widest font-mono">2D ENGINE</span>
             </h2>
             <span className="text-xs text-slate-400 font-bold font-mono tracking-wide">{initialTemplate}</span>
           </div>
         </div>
         
         <div className="flex items-center gap-3">
           {mode === 'edit' ? (
             <button onClick={startPlayMode} className="flex items-center gap-2 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black px-5 py-2.5 rounded-xl font-bold font-mono shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all transform hover:scale-105 active:scale-95 cursor-pointer">
               <Play className="w-4.5 h-4.5 fill-black" /> PROBAR JUEGO
             </button>
           ) : (
             <button onClick={stopPlayMode} className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-5 py-2.5 rounded-xl font-bold font-mono shadow-[0_0_20px_rgba(244,63,94,0.4)] transition-all transform hover:scale-105 active:scale-95 cursor-pointer">
               <Square className="w-4.5 h-4.5 fill-white" /> PARAR EDITOR
             </button>
           )}
           <button 
             onClick={() => { 
               setIsPublishing(true); 
               synth.playCoin();
               setTimeout(() => {
                 setIsPublishing(false); 
                 onBack();
               }, 1400); 
             }}
             className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-white/10 text-white px-4 py-2.5 rounded-xl text-sm font-bold font-mono transition-all cursor-pointer"
           >
             {isPublishing ? <Check className="w-4 h-4 text-emerald-400" /> : <Upload className="w-4 h-4" />} 
             {isPublishing ? 'PUBLICADO!' : 'PUBLICAR'}
           </button>
         </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        
        {/* LEFT TOOLBAR */}
        {mode === 'edit' && (
          <div className="w-full md:w-20 bg-[#060810] border-b md:border-b-0 md:border-r border-white/5 flex md:flex-col items-center py-4 px-2 gap-4 shrink-0 overflow-x-auto overflow-y-hidden md:overflow-y-auto no-scrollbar">
             <div className="text-[10px] text-gray-500 font-black tracking-widest uppercase hidden md:block">ENTIDADES</div>
             <ToolbarBtn icon={Move} label="Plataforma" onClick={() => addNewObject('platform')} color="text-sky-400" />
             <ToolbarBtn icon={Check} label="Spawn Jugador" onClick={() => addNewObject('player')} color="text-cyan-400" />
             <ToolbarBtn icon={Globe} label="Moneda de Oro" onClick={() => addNewObject('coin')} color="text-yellow-400" />
             <ToolbarBtn icon={PlusCircle} label="Enemigo Robot" onClick={() => addNewObject('enemy')} color="text-rose-400" />
             <ToolbarBtn icon={Sparkles} label="Obstáculo Spikes" onClick={() => addNewObject('obstacle')} color="text-pink-400" />
             <ToolbarBtn icon={Save} label="Portal Checkpoint" onClick={() => addNewObject('checkpoint')} color="text-emerald-400" />
          </div>
        )}

        {/* WORKSPACE PREVIEW CAMERA CANVAS */}
        <div className="flex-1 bg-[#090b14] flex flex-col items-center justify-center p-4 relative" ref={containerRef}>
            
            <div className={`relative shadow-2xl rounded-2xl overflow-hidden ring-1 ring-white/10 ${mode === 'play' ? 'ring-cyan-500/50 shadow-[0_0_40px_rgba(34,211,238,0.25)]' : ''}`}>
               <canvas
                 ref={canvasRef}
                 width={canvasSize.width}
                 height={canvasSize.height}
                 onPointerDown={handlePointerDown}
                 onPointerMove={handlePointerMove}
                 onPointerUp={handlePointerUp}
                 onPointerLeave={handlePointerUp}
                 className="block bg-[#05060c] touch-none"
                 style={{ cursor: mode === 'play' ? 'pointer' : editState.current.isDragging ? 'grabbing' : selectedObjectId ? 'move' : 'default' }}
               />
               
               {/* TOP HUD STATUS BAR */}
               {mode === 'play' && (
                 <div className="absolute top-4 left-4 right-4 flex justify-between items-center pointer-events-none">
                    <div className="flex items-center gap-3 bg-black/60 backdrop-blur-md px-4 py-2 border border-white/10 rounded-xl">
                       <span className="text-rose-500 font-bold font-mono flex items-center gap-1">
                         {'❤'.repeat(gameLives)}
                       </span>
                    </div>
                    
                    <div className="bg-black/60 backdrop-blur-md px-4 py-2 border border-white/10 rounded-xl font-black font-mono text-cyan-400 text-lg flex items-center gap-2">
                       <Globe className="w-5 h-5 text-yellow-400 animate-spin" style={{ animationDuration: '4s' }} /> {gameScore} PTS
                    </div>
                 </div>
               )}

               {/* GAME OVER DIALOG OVERLAY */}
               {mode === 'play' && playState.current.gameOver && (
                  <div className="absolute inset-0 bg-black/90 pointer-events-auto backdrop-blur-md flex flex-col items-center justify-center text-center p-6">
                     <h2 className="text-4xl sm:text-5xl font-black text-rose-500 tracking-tighter uppercase drop-shadow-[0_0_15px_rgba(239,68,68,0.6)] animate-bounce mb-3">
                       FIN DEL JUEGO
                     </h2>
                     <p className="text-gray-400 text-sm sm:text-base font-mono mb-8">Puntuación Lograda: {gameScore} Puntos</p>
                     
                     <button
                       onClick={startPlayMode}
                       className="px-8 py-3 bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-black uppercase tracking-wider rounded-xl transition-all transform hover:scale-105 cursor-pointer"
                     >
                       Reintentar Partida
                     </button>
                  </div>
               )}
            </div>

            {/* TOUCH CONTROLS OVERLAYS FOR MOBILE PHONES & APK WEBVIEWS */}
            {mode === 'play' && initialTemplate !== 'Clicker / Idle' && (
               <div className="absolute bottom-6 left-0 w-full px-6 flex justify-between items-end md:hidden pointer-events-none">
                  {initialTemplate === 'Arcade Shooter' ? (
                    <div className="grid grid-cols-3 gap-2 pointer-events-auto">
                      <div />
                      <button className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 flex items-center justify-center active:bg-cyan-500/30 active:scale-95 transition-all text-white font-bold"
                        onTouchStart={(e) => { e.preventDefault(); playState.current.keys['w'] = true; }}
                        onTouchEnd={(e) => { e.preventDefault(); playState.current.keys['w'] = false; }}
                      >▲</button>
                      <div />
                      <button className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 flex items-center justify-center active:bg-cyan-500/30 active:scale-95 transition-all text-white font-bold"
                        onTouchStart={(e) => { e.preventDefault(); playState.current.keys['a'] = true; }}
                        onTouchEnd={(e) => { e.preventDefault(); playState.current.keys['a'] = false; }}
                      >◀</button>
                      <button className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 flex items-center justify-center active:bg-cyan-500/30 active:scale-95 transition-all text-white font-bold"
                        onTouchStart={(e) => { e.preventDefault(); playState.current.keys['s'] = true; }}
                        onTouchEnd={(e) => { e.preventDefault(); playState.current.keys['s'] = false; }}
                      >▼</button>
                      <button className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 flex items-center justify-center active:bg-cyan-500/30 active:scale-95 transition-all text-white font-bold"
                        onTouchStart={(e) => { e.preventDefault(); playState.current.keys['d'] = true; }}
                        onTouchEnd={(e) => { e.preventDefault(); playState.current.keys['d'] = false; }}
                      >▶</button>
                    </div>
                  ) : (
                    <div className="flex gap-4 pointer-events-auto">
                      <button className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-full border border-white/10 flex items-center justify-center active:bg-cyan-500/30 active:scale-95 text-white text-lg font-bold"
                        onTouchStart={(e) => { e.preventDefault(); playState.current.keys['a'] = true; }}
                        onTouchEnd={(e) => { e.preventDefault(); playState.current.keys['a'] = false; }}
                      >◀</button>
                      <button className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-full border border-white/10 flex items-center justify-center active:bg-cyan-500/30 active:scale-95 text-white text-lg font-bold"
                        onTouchStart={(e) => { e.preventDefault(); playState.current.keys['d'] = true; }}
                        onTouchEnd={(e) => { e.preventDefault(); playState.current.keys['d'] = false; }}
                      >▶</button>
                    </div>
                  )}

                  <div className="flex gap-4 pointer-events-auto">
                    {initialTemplate === 'Arcade Shooter' && (
                      <button className="w-16 h-16 bg-yellow-500/20 backdrop-blur-md rounded-full border border-yellow-500/50 flex items-center justify-center active:bg-yellow-500/60 active:scale-95 shadow-[0_0_15px_rgba(250,204,21,0.3)] text-white text-md font-black"
                        onTouchStart={(e) => { e.preventDefault(); playState.current.keys[' '] = true; }}
                        onTouchEnd={(e) => { e.preventDefault(); playState.current.keys[' '] = false; }}
                      >DISPARO</button>
                    )}
                    <button className="w-16 h-16 bg-cyan-500/20 backdrop-blur-md rounded-full border border-cyan-500/50 flex items-center justify-center active:bg-cyan-500/60 active:scale-95 shadow-[0_0_15px_rgba(34,211,238,0.3)] text-white text-lg font-black"
                      onTouchStart={(e) => { e.preventDefault(); playState.current.keys['w'] = true; }}
                      onTouchEnd={(e) => { e.preventDefault(); playState.current.keys['w'] = false; }}
                    >SALTO</button>
                  </div>
               </div>
            )}
        </div>

        {/* RIGHT ENGINE PROPERTIES DETAILED INSPECTOR */}
        {mode === 'edit' && selectedObjectId && (
          <motion.div 
             initial={{ opacity: 0, x: 25 }} animate={{ opacity: 1, x: 0 }}
             className="w-full md:w-72 bg-[#060810] border-t md:border-t-0 md:border-l border-white/5 p-6 shrink-0 overflow-y-auto"
          >
             <h3 className="text-white font-black font-mono text-sm mb-6 flex items-center gap-2 text-cyan-400">
               <Settings className="w-4 h-4" /> INSPECTOR ENTIDAD
             </h3>
             
             {objects.filter(o => o.id === selectedObjectId).map(obj => (
               <div key={obj.id} className="space-y-5">
                 <div>
                   <label className="text-[10px] text-gray-500 font-black tracking-wider uppercase mb-1.5 block">Tipo Objeto</label>
                   <div className="bg-white/5 border border-white/10 px-3.5 py-2.5 rounded-xl text-white font-mono text-xs uppercase">{obj.type}</div>
                 </div>

                 <div className="grid grid-cols-2 gap-3">
                   <div>
                     <label className="text-[10px] text-gray-500 font-black tracking-wider uppercase mb-1.5 block">Coord X</label>
                     <input 
                       type="number" 
                       value={Math.round(obj.x)} 
                       onChange={(e) => setObjects(prev => prev.map(o => o.id === obj.id ? { ...o, x: Number(e.target.value) } : o))}
                       className="w-full bg-slate-900 border border-white/10 px-3 py-2 rounded-xl text-white text-xs font-mono" 
                     />
                   </div>
                   <div>
                     <label className="text-[10px] text-gray-500 font-black tracking-wider uppercase mb-1.5 block">Coord Y</label>
                     <input 
                       type="number" 
                       value={Math.round(obj.y)} 
                       onChange={(e) => setObjects(prev => prev.map(o => o.id === obj.id ? { ...o, y: Number(e.target.value) } : o))}
                       className="w-full bg-slate-900 border border-white/10 px-3 py-2 rounded-xl text-white text-xs font-mono" 
                     />
                   </div>
                 </div>

                 <div className="grid grid-cols-2 gap-3">
                   <div>
                     <label className="text-[10px] text-gray-500 font-black tracking-wider uppercase mb-1.5 block">Ancho (W)</label>
                     <input 
                       type="number" 
                       value={obj.width} 
                       onChange={e => setObjects(prev => prev.map(o => o.id === obj.id ? {...o, width: Number(e.target.value)} : o))} 
                       className="w-full bg-slate-900 border border-white/10 px-3 py-2 rounded-xl text-white text-xs font-mono" 
                     />
                   </div>
                   <div>
                     <label className="text-[10px] text-gray-500 font-black tracking-wider uppercase mb-1.5 block">Alto (H)</label>
                     <input 
                       type="number" 
                       value={obj.height} 
                       onChange={e => setObjects(prev => prev.map(o => o.id === obj.id ? {...o, height: Number(e.target.value)} : o))} 
                       className="w-full bg-slate-900 border border-white/10 px-3 py-2 rounded-xl text-white text-xs font-mono" 
                     />
                   </div>
                 </div>

                 <div>
                    <label className="text-[10px] text-gray-500 font-black tracking-wider uppercase mb-1.5 block">Paleta Color</label>
                    <div className="flex gap-2">
                      {['#22d3ee', '#fbbf24', '#f43f5e', '#38bdf8', '#0284c7', '#db2777'].map(col => (
                        <button 
                          key={col} 
                          onClick={() => setObjects(prev => prev.map(o => o.id === obj.id ? { ...o, color: col } : o))}
                          className="w-6 h-6 rounded-full border border-white/15 cursor-pointer" 
                          style={{ backgroundColor: col }}
                        />
                      ))}
                    </div>
                 </div>

                 <button 
                   onClick={() => {
                     setObjects(prev => prev.filter(o => o.id !== obj.id));
                     setSelectedObjectId(null);
                     synth.playHurt();
                   }}
                   className="w-full mt-4 bg-red-600/10 hover:bg-red-600/20 text-red-500 font-black text-xs py-3 rounded-xl border border-red-500/20 transition-all uppercase tracking-widest font-mono cursor-pointer"
                 >
                   Eliminar Entidad
                 </button>
               </div>
             ))}
          </motion.div>
        )}
      </div>
    </div>,
    document.body
  );
}

function ToolbarBtn({ icon: Icon, label, onClick, color = "text-white", active }: any) {
  return (
    <button 
      onClick={onClick}
      className={`w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center flex-col gap-1 transition-all group cursor-pointer ${active ? 'bg-white/10 border border-white/20' : 'bg-transparent hover:bg-white/5 border border-transparent'}`}
      title={label}
    >
      <Icon className={`w-5.5 h-5.5 ${color} group-hover:scale-110 transition-transform`} />
    </button>
  );
}

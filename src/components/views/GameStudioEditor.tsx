import React, { useState, useRef, useEffect } from 'react';
import { Play, Square, Save, Upload, RotateCcw, Check, Move, MousePointer2, PlusCircle, Settings, ChevronLeft, Globe } from 'lucide-react';
import { motion } from 'motion/react';

interface GameStudioEditorProps {
  initialTemplate: string;
  onBack: () => void;
}

interface GameObject {
  id: string;
  type: 'player' | 'platform' | 'enemy' | 'coin';
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  isStatic?: boolean;
}

export function GameStudioEditor({ initialTemplate, onBack }: GameStudioEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [mode, setMode] = useState<'edit' | 'play'>('edit');
  const [objects, setObjects] = useState<GameObject[]>([
    { id: 'ground', type: 'platform', x: 0, y: 400, width: 800, height: 100, color: '#374151', isStatic: true },
    { id: 'p1', type: 'player', x: 100, y: 300, width: 40, height: 40, color: '#22d3ee', isStatic: false }
  ]);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [gameScore, setGameScore] = useState(0);

  // Play mode state refs
  const playState = useRef({
    objects: [] as GameObject[],
    playerVelY: 0,
    playerVelX: 0,
    score: 0,
    gameOver: false,
    keys: {} as Record<string, boolean>
  });

  // Editor interaction state
  const editState = useRef({
    isDragging: false,
    dragOffset: { x: 0, y: 0 }
  });

  const getCanvasSize = () => {
    if (!containerRef.current) return { width: 800, height: 500 };
    return {
      width: containerRef.current.clientWidth,
      height: Math.min(500, window.innerHeight * 0.6)
    };
  };

  const canvasSize = getCanvasSize();

  useEffect(() => {
    // Generate initial objects based on template
    if (initialTemplate === 'Platformer') {
      setObjects([
        { id: 'ground', type: 'platform', x: 0, y: 400, width: 800, height: 100, color: '#1e293b', isStatic: true },
        { id: 'plat1', type: 'platform', x: 300, y: 300, width: 150, height: 20, color: '#334155', isStatic: true },
        { id: 'plat2', type: 'platform', x: 550, y: 200, width: 100, height: 20, color: '#334155', isStatic: true },
        { id: 'p1', type: 'player', x: 50, y: 300, width: 40, height: 40, color: '#22d3ee', isStatic: false },
        { id: 'coin1', type: 'coin', x: 350, y: 250, width: 20, height: 20, color: '#eab308' },
        { id: 'coin2', type: 'coin', x: 590, y: 150, width: 20, height: 20, color: '#eab308' },
        { id: 'enemy1', type: 'enemy', x: 450, y: 360, width: 40, height: 40, color: '#ef4444' }
      ]);
    } else if (initialTemplate === 'Clicker / Idle') {
      setObjects([
        { id: 'coin_mega', type: 'coin', x: 300, y: 200, width: 150, height: 150, color: '#eab308' }
      ]);
    }
  }, [initialTemplate]);

  // Handle Play Mode Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime = performance.now();

    const handleKeyDown = (e: KeyboardEvent) => { playState.current.keys[e.key] = true; }
    const handleKeyUp = (e: KeyboardEvent) => { playState.current.keys[e.key] = false; }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const gameLoop = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      // Clear canvas
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (mode === 'play') {
        const state = playState.current;
        if (!state.gameOver) {
          const playerIdx = state.objects.findIndex(o => o.type === 'player');
          if (playerIdx !== -1) {
            const player = state.objects[playerIdx];
            
            // Movement logic
            if (state.keys['ArrowRight'] || state.keys['d']) state.playerVelX = 200;
            else if (state.keys['ArrowLeft'] || state.keys['a']) state.playerVelX = -200;
            else state.playerVelX = 0;

            if ((state.keys['ArrowUp'] || state.keys['w']) && state.playerVelY === 0) {
              state.playerVelY = -400; // Jump
            }

            // Gravity
            state.playerVelY += 1000 * dt;

            // Apply vel
            player.x += state.playerVelX * dt;
            player.y += state.playerVelY * dt;

            // Floor boundary collision (canvas bounds)
            if (player.y + player.height > canvas.height) {
              player.y = canvas.height - player.height;
              state.playerVelY = 0;
            }
            if (player.x < 0) player.x = 0;
            if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

            // Check AABB Collisions
            let isGrounded = false;
            for (let i = 0; i < state.objects.length; i++) {
              if (i === playerIdx) continue;
              const o = state.objects[i];
              
              const isColliding = (
                player.x < o.x + o.width && 
                player.x + player.width > o.x && 
                player.y < o.y + o.height && 
                player.y + player.height > o.y
              );

              if (isColliding) {
                if (o.type === 'platform') {
                  // Basic resolution (very simplified)
                  if (state.playerVelY > 0 && player.y + player.height - state.playerVelY * dt <= o.y + 10) {
                    player.y = o.y - player.height;
                    state.playerVelY = 0;
                    isGrounded = true;
                  }
                } else if (o.type === 'coin') {
                  state.score += 10;
                  setGameScore(state.score);
                  state.objects.splice(i, 1);
                  i--;
                } else if (o.type === 'enemy') {
                  state.gameOver = true;
                }
              }
            }
          }
        }
        
        // Draw play state
        state.objects.forEach(obj => {
          ctx.fillStyle = obj.color;
          if (obj.type === 'coin') {
            ctx.beginPath();
            ctx.arc(obj.x + obj.width/2, obj.y + obj.height/2, obj.width/2, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
          }
        });

        if (state.gameOver) {
          ctx.fillStyle = 'rgba(239, 68, 68, 0.8)';
          ctx.font = 'bold 36px Inter';
          ctx.textAlign = 'center';
          ctx.fillText('Game Over', canvas.width/2, canvas.height/2);
        }
      } else {
        // Draw edit state
        objects.forEach(obj => {
          ctx.fillStyle = obj.color;
          
          if (obj.type === 'coin') {
            ctx.beginPath();
            ctx.arc(obj.x + obj.width/2, obj.y + obj.height/2, obj.width/2, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
          }

          if (selectedObjectId === obj.id) {
            ctx.strokeStyle = '#22d3ee';
            ctx.lineWidth = 2;
            ctx.strokeRect(obj.x - 2, obj.y - 2, obj.width + 4, obj.height + 4);
            
            // Handles
            ctx.fillStyle = '#fff';
            ctx.fillRect(obj.x + obj.width - 4, obj.y + obj.height - 4, 8, 8);
          }
        });
      }

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [mode, objects, selectedObjectId, canvasSize]);


  const startPlayMode = () => {
    playState.current = {
      objects: JSON.parse(JSON.stringify(objects)), // Deep copy
      playerVelY: 0,
      playerVelX: 0,
      score: 0,
      gameOver: false,
      keys: {}
    };
    setGameScore(0);
    setMode('play');
  };

  const stopPlayMode = () => {
    setMode('edit');
    setGameScore(0);
  };

  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (mode === 'play') {
      if (initialTemplate === 'Clicker / Idle' && playState.current) {
        const rect = canvasRef.current!.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        playState.current.objects.forEach((obj, i) => {
          if (obj.type === 'coin') {
            const isClick = x >= obj.x && x <= obj.x + obj.width && y >= obj.y && y <= obj.y + obj.height;
            if (isClick) {
              playState.current.score += 1;
              setGameScore(playState.current.score);
              // Simple effect
              obj.width = obj.width * 0.95;
              obj.height = obj.height * 0.95;
              obj.x = obj.x + (obj.width * 0.025);
              obj.y = obj.y + (obj.height * 0.025);
              setTimeout(() => {
                obj.width = obj.width / 0.95;
                obj.height = obj.height / 0.95;
                obj.x = obj.x - (obj.width * 0.025);
                obj.y = obj.y - (obj.height * 0.025);
              }, 100);
            }
          }
        });
      } else {
        // Mobile tap jump simulation
        playState.current.keys['w'] = true;
      }
      return;
    }

    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check hit reverse order (top first)
    let hit = false;
    for (let i = objects.length - 1; i >= 0; i--) {
      const obj = objects[i];
      if (x >= obj.x && x <= obj.x + obj.width && y >= obj.y && y <= obj.y + obj.height) {
        setSelectedObjectId(obj.id);
        editState.current.isDragging = true;
        editState.current.dragOffset = { x: x - obj.x, y: y - obj.y };
        hit = true;
        break;
      }
    }
    if (!hit) setSelectedObjectId(null);
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (mode === 'play') return;
    if (!editState.current.isDragging || !selectedObjectId) return;

    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setObjects(prev => prev.map(obj => 
      obj.id === selectedObjectId 
        ? { ...obj, x: x - editState.current.dragOffset.x, y: y - editState.current.dragOffset.y }
        : obj
    ));
  };

  const handleCanvasPointerUp = () => {
    if (mode === 'play') {
       playState.current.keys['w'] = false;
       return;
    }
    editState.current.isDragging = false;
  };

  const addObject = (type: GameObject['type']) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newObj: GameObject = {
      id, type, x: 50, y: 50, width: 40, height: 40, 
      color: type === 'player' ? '#22d3ee' : type === 'enemy' ? '#ef4444' : type === 'coin' ? '#eab308' : '#334155'
    };
    if (type === 'platform') { newObj.width = 100; newObj.height = 20; }
    setObjects([...objects, newObj]);
    setSelectedObjectId(id);
  };

  return (
    <div className="min-h-screen bg-[#0a0c10] flex flex-col pt-[72px]">
      <div className="bg-[#12141c] border-b border-white/5 py-4 px-6 flex items-center justify-between z-10 shrink-0 shadow-lg">
         <div className="flex items-center gap-4">
           <button onClick={onBack} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors">
              <ChevronLeft className="w-5 h-5" />
           </button>
           <div>
             <h2 className="text-white font-black text-lg tracking-tight">Game Studio</h2>
             <span className="text-xs text-cyan-400 font-bold uppercase tracking-widest">{initialTemplate}</span>
           </div>
         </div>
         
         <div className="flex items-center gap-3">
           {mode === 'edit' ? (
             <button onClick={startPlayMode} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-2 rounded-xl font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all">
               <Play className="w-4 h-4" /> Probar
             </button>
           ) : (
             <button onClick={stopPlayMode} className="flex items-center gap-2 bg-red-500 hover:bg-red-400 text-white px-4 py-2 rounded-xl font-bold shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all">
               <Square className="w-4 h-4" /> Detener
             </button>
           )}
           <button 
             onClick={() => { setIsPublishing(true); setTimeout(() => {setIsPublishing(false); onBack();}, 1500) }}
             className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl font-bold border border-white/10 transition-all"
           >
             {isPublishing ? <Check className="w-4 h-4 text-emerald-400" /> : <Upload className="w-4 h-4" />} 
             {isPublishing ? 'Publicado' : 'Publicar'}
           </button>
         </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Toolbar */}
        <div className="w-full md:w-20 bg-[#0d0f17] border-b md:border-b-0 md:border-r border-white/5 flex md:flex-col items-center py-4 px-2 gap-4 shrink-0 overflow-x-auto overflow-y-hidden md:overflow-y-auto no-scrollbar">
           <ToolbarBtn icon={MousePointer2} label="Select" active={true} />
           <div className="w-px h-6 md:w-8 md:h-px bg-white/10 shrink-0"></div>
           <ToolbarBtn icon={Move} label="Plataforma" onClick={() => addObject('platform')} color="text-slate-400" />
           <ToolbarBtn icon={Check} label="Jugador" onClick={() => addObject('player')} color="text-cyan-400" />
           <ToolbarBtn icon={Globe} label="Moneda" onClick={() => addObject('coin')} color="text-yellow-400" />
           <ToolbarBtn icon={PlusCircle} label="Enemigo" onClick={() => addObject('enemy')} color="text-red-400" />
        </div>

        {/* Canvas Area */}
        <div className="flex-1 bg-[#1a1c24] flex items-center justify-center p-4 relative" ref={containerRef}>
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px'}}></div>
            
            <div className={`relative shadow-2xl rounded-xl overflow-hidden ring-1 ring-white/10 ${mode === 'play' ? 'ring-cyan-500/50 shadow-[0_0_30px_rgba(34,211,238,0.2)]' : ''}`}>
               <canvas
                 ref={canvasRef}
                 width={canvasSize.width}
                 height={canvasSize.height}
                 onPointerDown={handleCanvasPointerDown}
                 onPointerMove={handleCanvasPointerMove}
                 onPointerUp={handleCanvasPointerUp}
                 onPointerLeave={handleCanvasPointerUp}
                 className="block bg-[#0f172a] touch-none"
                 style={{ cursor: mode === 'play' ? 'pointer' : editState.current.isDragging ? 'grabbing' : selectedObjectId ? 'move' : 'default' }}
               />
               
               {mode === 'play' && (
                 <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-4 py-2 border border-white/10 rounded-xl font-black text-white text-xl flex items-center gap-2">
                    <Globe className="w-5 h-5 text-yellow-400" /> {gameScore}
                 </div>
               )}
            </div>

            {/* Mobile overlay for Play Mode (Controls) */}
            {mode === 'play' && initialTemplate !== 'Clicker / Idle' && (
               <div className="absolute bottom-10 left-0 w-full px-8 flex justify-between md:hidden pointer-events-none">
                 <div className="flex gap-4">
                   <button className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full pointer-events-auto border border-white/10 flex items-center justify-center active:bg-white/30"
                     onTouchStart={() => { playState.current.keys['a'] = true; }}
                     onTouchEnd={() => { playState.current.keys['a'] = false; }}
                   ><ChevronLeft className="w-8 h-8 text-white" /></button>
                   <button className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full pointer-events-auto border border-white/10 flex items-center justify-center active:bg-white/30"
                     onTouchStart={() => { playState.current.keys['d'] = true; }}
                     onTouchEnd={() => { playState.current.keys['d'] = false; }}
                   ><ChevronLeft className="w-8 h-8 text-white rotate-180" /></button>
                 </div>
                 <button className="w-16 h-16 bg-cyan-500/40 backdrop-blur-md rounded-full pointer-events-auto border border-cyan-400/50 flex items-center justify-center active:bg-cyan-500/60 shadow-[0_0_15px_rgba(34,211,238,0.5)]"
                   onTouchStart={() => { playState.current.keys['w'] = true; }}
                   onTouchEnd={() => { playState.current.keys['w'] = false; }}
                 ><PlusCircle className="w-8 h-8 text-white" /></button>
               </div>
            )}
        </div>

        {/* Properties Panel (Desktop only or floating mobile) */}
        {mode === 'edit' && selectedObjectId && (
          <motion.div 
             initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
             className="w-full md:w-64 bg-[#12141c] border-t md:border-t-0 md:border-l border-white/5 p-5 shrink-0 overflow-y-auto"
          >
             <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Settings className="w-4 h-4 text-cyan-400" /> Propiedades</h3>
             
             {objects.filter(o => o.id === selectedObjectId).map(obj => (
               <div key={obj.id} className="space-y-4">
                 <div>
                   <label className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1 block">Tipo</label>
                   <div className="bg-white/5 border border-white/10 px-3 py-2 rounded-lg text-white font-medium capitalize">{obj.type}</div>
                 </div>
                 <div className="grid grid-cols-2 gap-3">
                   <div>
                     <label className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1 block">X</label>
                     <input type="number" readOnly value={Math.round(obj.x)} className="w-full bg-white/5 border border-white/10 px-3 py-2 rounded-lg text-white text-sm" />
                   </div>
                   <div>
                     <label className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1 block">Y</label>
                     <input type="number" readOnly value={Math.round(obj.y)} className="w-full bg-white/5 border border-white/10 px-3 py-2 rounded-lg text-white text-sm" />
                   </div>
                 </div>
                 <div className="grid grid-cols-2 gap-3">
                   <div>
                     <label className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1 block">Ancho</label>
                     <input type="number" value={obj.width} onChange={e => setObjects(prev => prev.map(o => o.id === obj.id ? {...o, width: Number(e.target.value)} : o))} className="w-full bg-black/40 border border-white/10 px-3 py-2 rounded-lg text-white text-sm focus:border-cyan-500 outline-none" />
                   </div>
                   <div>
                     <label className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1 block">Alto</label>
                     <input type="number" value={obj.height} onChange={e => setObjects(prev => prev.map(o => o.id === obj.id ? {...o, height: Number(e.target.value)} : o))} className="w-full bg-black/40 border border-white/10 px-3 py-2 rounded-lg text-white text-sm focus:border-cyan-500 outline-none" />
                   </div>
                 </div>
                 <button 
                   onClick={() => {
                     setObjects(prev => prev.filter(o => o.id !== obj.id));
                     setSelectedObjectId(null);
                   }}
                   className="w-full mt-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold py-2.5 rounded-lg border border-red-500/20 transition-all text-sm uppercase tracking-wider"
                 >
                   Eliminar Objeto
                 </button>
               </div>
             ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}

function ToolbarBtn({ icon: Icon, label, onClick, color = "text-white", active }: any) {
  return (
    <button 
      onClick={onClick}
      className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center flex-col gap-1 transition-all group ${active ? 'bg-white/10 border border-white/20' : 'bg-transparent hover:bg-white/5 border border-transparent'}`}
      title={label}
    >
      <Icon className={`w-5 h-5 ${color} group-hover:scale-110 transition-transform`} />
    </button>
  );
}

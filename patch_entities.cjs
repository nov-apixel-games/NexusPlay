const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'views', 'GameStudioEditor3D.tsx');
let code = fs.readFileSync(filePath, 'utf8');

// Replacements for the `entidades` tab
const entitiesTabMarker = `{/* TAB 1: ADD ENTITIY PAINTERS */}
              {editorTab === "entidades" && (
                <div className="flex flex-col gap-2.5">
                  <div className="text-[10px] text-cyan-300/60 font-mono uppercase tracking-wider mb-0.5">Estanteria de Elementos</div>
                  <div className="grid grid-cols-2 gap-2">
                     <button onClick={() => setObjects([...objects, { id: "w_"+Date.now(), type: "wall", position: [0, 2, 0], scale: [4, 4, 4], color: "#334155", texture_style: "neon" }])} className="bg-white/5 hover:bg-white/10 p-2.5 rounded-xl text-white text-[10px] font-mono flex flex-col items-center gap-1 cursor-pointer border border-white/5"><Move className="w-3.5 h-3.5 text-cyan-400"/> + Muro</button>
                     <button onClick={() => setObjects([...objects, { id: "e_"+Date.now(), type: "enemy", position: [0, 1.2, 0], scale: [1.3, 2, 1.3], color: "#047857", enemy_type: "zombie" }])} className="bg-emerald-500/5 hover:bg-emerald-500/15 text-emerald-400 p-2.5 rounded-xl text-[10px] font-mono flex flex-col items-center gap-1 cursor-pointer border border-emerald-500/10"><PlusCircle className="w-3.5 h-3.5"/> + Zombie</button>
                     <button onClick={() => setObjects([...objects, { id: "c_"+Date.now(), type: "checkpoint", position: [0, 1, 0], scale: [1, 1, 1], color: "#38bdf8" }])} className="bg-white/5 hover:bg-white/10 p-2.5 rounded-xl text-white text-[10px] font-mono flex flex-col items-center gap-1 cursor-pointer border border-white/5"><MapPin className="w-3.5 h-3.5 text-cyan-400"/> + Checkpoint</button>
                     <button onClick={() => setObjects([...objects, { id: "p_"+Date.now(), type: "pickup", position: [0, 2, 0], scale: [1, 1, 1], color: "#fbbf24" }])} className="bg-amber-500/5 hover:bg-amber-500/15 text-amber-400 p-2.5 rounded-xl text-[10px] font-mono flex flex-col items-center gap-1 cursor-pointer border border-amber-500/10"><Sparkles className="w-3.5 h-3.5"/> + Botín Gema</button>
                     <button onClick={() => setObjects([...objects, { id: "n_"+Date.now(), type: "nature", nature_type: "tree", position: [0, 0, 0], scale: [1, 1, 1], color: "#166534" }])} className="bg-white/5 hover:bg-white/10 p-2.5 rounded-xl text-white text-[10px] font-mono flex flex-col items-center gap-1 cursor-pointer border border-white/5"><Info className="w-3.5 h-3.5 text-cyan-400"/> + Árbol WebGL</button>
                     <button onClick={() => setObjects([...objects, { id: "npc_"+Date.now(), type: "npc", npc_name: "Aldeano Nuevo", npc_dialog: "Hola...", position: [0, 1.2, 0], scale: [1, 1, 1], color: "#d946ef" }])} className="bg-fuchsia-500/5 hover:bg-fuchsia-500/15 text-fuchsia-400 p-2.5 rounded-xl text-[10px] font-mono flex flex-col items-center gap-1 cursor-pointer border border-fuchsia-500/10"><Eye className="w-3.5 h-3.5"/> + NPC Fijo</button>
                  </div>
                </div>
              )}`;

const newEntitiesTab = `{/* TAB 1: ADD ENTITIY PAINTERS */}
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
              )}`;

code = code.replace(entitiesTabMarker, newEntitiesTab);

// Add missing lucide import (UserCircle)
if (!code.includes("UserCircle")) {
  code = code.replace(/Info \}/, "Info, UserCircle }");
}

fs.writeFileSync(filePath, code, 'utf8');
console.log("Updated entidades tab!");

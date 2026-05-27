const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'views', 'GameStudioEditor3D.tsx');
let code = fs.readFileSync(filePath, 'utf8');

// Add "terreno" and "inspector" to editorTab
code = code.replace(
  /const \[editorTab, setEditorTab\] = useState<'entidades' \| 'bioma' \| 'scripting' \| 'assets'>\('entidades'\);/,
  "const [editorTab, setEditorTab] = useState<'entidades' | 'bioma' | 'scripting' | 'assets' | 'terreno' | 'inspector'>('entidades');"
);

code = code.replace(
  /\(\["entidades", "bioma", "scripting", "assets"\] as const\)\.map/g,
  '((["entidades", "bioma", "scripting", "assets", "terreno", "inspector"] as const)).map'
);


// Insert UI for 'terreno'
const terrenoUI = `
              {/* TAB: TERRENO ESTRUCTURAL */}
              {editorTab === "terreno" && (
                <div className="flex flex-col gap-3 text-xs">
                  <div className="text-[10px] text-cyan-300/60 font-mono uppercase tracking-wider mb-0.5">Editor de Terreno Real</div>
                  
                  <div className="bg-white/5 border border-white/10 p-3 rounded-2xl text-[10.5px] leading-relaxed text-slate-300 font-mono">
                     Selecciona herramientas para esculpir el terreno o utiliza la construcción modular. (Deslizadores para escalar montañas próximamente).
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-2">
                     <button onClick={() => alert("Función de elevar terreno webgl en desarrollo.")} className="bg-white/5 hover:bg-white/10 p-2.5 rounded-xl text-white text-[10px] font-mono flex flex-col items-center gap-1 cursor-pointer border border-white/5">Montañas +</button>
                     <button onClick={() => alert("Función de suavizar terreno webgl en desarrollo.")} className="bg-white/5 hover:bg-white/10 p-2.5 rounded-xl text-white text-[10px] font-mono flex flex-col items-center gap-1 cursor-pointer border border-white/5">Aplanar -</button>
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
                         className={\`p-1.5 flex justify-between items-center rounded cursor-pointer \${selectedId === o.id ? 'bg-cyan-500/20 text-cyan-300' : 'hover:bg-white/5 text-gray-400'}\`}
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
`;

code = code.replace(/\{\/\* TAB 4: EXTERNAL CLOUDINARY/, terrenoUI + "\n\n              {/* TAB 4: EXTERNAL CLOUDINARY");

fs.writeFileSync(filePath, code, 'utf8');
console.log("Tab added");

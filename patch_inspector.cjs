const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'views', 'GameStudioEditor3D.tsx');
let code = fs.readFileSync(filePath, 'utf8');

// Update GameObject3D to include rotation and label
code = code.replace(
  "color: string;",
  "color: string;\n  rotation?: [number, number, number];\n  label?: string;\n  shape?: string;\n  texture_style?: string;"
);

// Update Inspector UI to allow editing rotation
const posTarget = `                            <input 
                              type="number" 
                              step={snapToggle ? 1 : 0.1}
                              value={obj.position[0]} 
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setObjects(objects.map(o => o.id === obj.id ? { ...o, position: [val, obj.position[1], obj.position[2]] } : o));
                              }}
                              className="w-full bg-slate-900 border border-white/10 text-white px-2 py-1.5 rounded-lg text-xs font-mono focus:outline-none"
                            />`;

const rotAndPropTarget = `                           {obj.type === 'trigger' && (
                             <div>
                                <label className="text-[10px] text-pink-500 font-bold block mb-1">TRIGGER ACTION</label>`;

const rotationUI = `
                             <div>
                                <label className="text-[10px] text-gray-500 font-bold block mb-1">ROTACIÓN (Y)</label>
                                <input 
                                  type="number" 
                                  step={15}
                                  value={(obj.rotation?.[1] || 0) * (180/Math.PI)} 
                                  onChange={(e) => {
                                    const val = (parseFloat(e.target.value) || 0) * (Math.PI/180);
                                    setObjects(objects.map(o => o.id === obj.id ? { ...o, rotation: [0, val, 0] } : o));
                                  }}
                                  className="w-full bg-slate-900 border border-white/10 text-white px-2 py-1.5 rounded-lg text-xs font-mono focus:outline-none"
                                />
                             </div>
                           {obj.type === 'trigger' && (
                             <div>
                                <label className="text-[10px] text-pink-500 font-bold block mb-1">TRIGGER ACTION</label>`;

code = code.replace(rotAndPropTarget, rotationUI);

fs.writeFileSync(filePath, code, 'utf8');
console.log("Inspector rotation added!");

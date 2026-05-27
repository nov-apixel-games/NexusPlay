const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'views', 'GameStudioEditor3D.tsx');
let code = fs.readFileSync(filePath, 'utf8');

// Update mapProps definition
const defaultProps = `const [mapProps, setMapProps] = useState({ skyPreset: 'noon', fogDensity: 15, waterLevel: -10, gravity: 22 });`;
const newProps = `const [mapProps, setMapProps] = useState({ skyPreset: 'noon', fogDensity: 15, waterLevel: -10, gravity: 22, cameraMode: initialTemplate === 'Racing 3D' ? 'racing' : initialTemplate === 'Platformer 3D' ? 'platformer' : 'fps' });`;

code = code.replace(defaultProps, newProps);

// We won't rewrite all the physics engine `template === XXX` refs to avoid breaking standard flow, 
// but we will ADD the UI to toggle the global camera mode so they can switch engines ON THE FLY per request!

code = code.replace(
  /<option value="desert">DESIERTO DE AZUFRE AMARILLENTO<\/option>\n                      <\/select>\n                    <\/div>/,
  `<option value="desert">DESIERTO DE AZUFRE AMARILLENTO</option>
                      </select>
                    </div>

                  <div>
                     <label className="text-[10px] text-gray-500 font-bold block mb-1">NÚCLEO MOTOR (GLOBAL)</label>
                     <select 
                       value={mapProps.cameraMode || 'fps'} 
                       onChange={(e) => setMapProps({ ...mapProps, cameraMode: e.target.value })}
                       className="w-full bg-slate-900 border border-white/10 text-white px-3 py-2 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500"
                     >
                       <option value="fps">FPS SHOOTER / SURVIVAL</option>
                       <option value="platformer">PLATAFORMERO LIBRE</option>
                       <option value="racing">VEHÍCULOS (RACING)</option>
                     </select>
                  </div>`
);

// Switch physics logic
code = code.replace(/template === 'Racing 3D'/g, `(mapProps?.cameraMode === 'racing' || template === 'Racing 3D')`);
code = code.replace(/template === 'Platformer 3D'/g, `(mapProps?.cameraMode === 'platformer' || template === 'Platformer 3D')`);
code = code.replace(/template === 'Zombie Survival 3D'/g, `(mapProps?.cameraMode === 'fps' || template === 'Zombie Survival 3D')`);


fs.writeFileSync(filePath, code, 'utf8');
console.log("Unified engine via cameraMode");

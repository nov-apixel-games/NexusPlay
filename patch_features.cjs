const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'views', 'GameStudioEditor3D.tsx');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Update the tabs type and initial list
code = code.replace(
  /const \[editorTab, setEditorTab\] = useState<'entidades' \| 'bioma' \| 'scripting' \| 'assets'>\('entidades'\);/,
  "const [editorTab, setEditorTab] = useState<'entidades' | 'bioma' | 'scripting' | 'assets' | 'inspector' | 'terreno'>('entidades');"
);

code = code.replace(
  /\(\["entidades", "bioma", "scripting", "assets"\] as const\)\.map/,
  '((["entidades", "inspector", "terreno", "bioma", "scripting", "assets"] as const)).map'
);

// 2. Add Inspector and Terrain tabs HTML
const assetsTabRegex = /\{\/\* TAB 4: EXTERNAL CLOUDINARY TEXTURES AND CDN STORES \*\/\}\s*\{editorTab === "assets" && \([\s\S]*?\}\)\]\}\s*\}\)\}\s*className="bg-white\/5 hover:bg-white\/10 text-white p-2\.5 rounded-xl text-\[10px\] font-mono flex flex-col items-center gap-1 cursor-pointer border border-white\/5"\>\n\s*\<PlusCircle className="w-3\.5 h-3\.5 text-cyan-400"\/\> Cargar CDN Textura\n\s*\<\/button\>\n\s*\<\/div\>\n\s*\<\/div\>\n\s*\)\}/;

// Oh wait, the `assetsTabRegex` might be tricky. Let's just find `editorTab === "assets"` and inject after it.
// Let's use a simpler marker. 

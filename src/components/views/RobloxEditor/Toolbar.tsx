import React, { useState } from 'react';
import { 
  Move, 
  RotateCw, 
  Scaling, 
  Save, 
  FolderOpen, 
  Box, 
  Trees, 
  Car, 
  Home, 
  User, 
  Mountain,
  MousePointer2,
  Trash2,
  Copy,
  Sparkles
} from 'lucide-react';
import { useEditorStore } from './store';
import { saveToSupabase, loadFromSupabase } from './supabaseSync';
import { v4 as uuidv4 } from 'uuid';
import { ObjectType } from './editorTypes';

export const Toolbar = ({ projectId, onExit }: { projectId?: string | null, onExit: () => void }) => {
  const { transformMode, setTransformMode, addObject, removeObject, duplicateObject, selectedId, objects, loadProject } = useEditorStore();
  const [loading, setLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');

  const handleSave = async () => {
    setLoading(true);
    await saveToSupabase(projectId || 'default_project', objects);
    setLoading(false);
    alert('Proyecto guardado en la nube!');
  };

  const handleLoad = async () => {
    setLoading(true);
    const data = await loadFromSupabase(projectId || 'default_project');
    if (data) {
      loadProject(data);
      alert('Proyecto cargado de la nube!');
    }
    setLoading(false);
  };

  const exportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(objects, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "roblox_studio_project.json");
    dlAnchorElem.click();
  };

  const spawnObject = (type: any, name: string) => {
    addObject({
      type,
      name,
      position: { x: 0, y: 0.5, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: type === 'terrain' ? { x: 50, y: 1, z: 50 } : { x: 1, y: 1, z: 1 },
      color: type === 'box' ? '#3b82f6' : type === 'sphere' ? '#ef4444' : '#10b981',
      visible: true
    });
  };

  const generateAI = async () => {
    if(!aiPrompt.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/nexus-3d-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      
      // Extract JSON if it is wrapped in markdown
      let jsonStr = data.text;
      const match = data.text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      if (match) {
         jsonStr = match[1];
      }
      
      const parsed = JSON.parse(jsonStr);

      const items = Array.isArray(parsed) ? parsed : [];
      let mappedObjects = items.map((item: any) => {
        let type: ObjectType = 'box';
        // Map the server logic to our ObjectType
        if(item.type === 'nature' || item.prop_type?.includes('tree') || item.nature_type === 'tree') type = 'tree';
        else if(item.type === 'vehicle' || item.prop_type?.includes('car')) type = 'vehicle';
        else if(item.prop_type?.includes('building') || item.prop_type?.includes('house') || item.label?.toLowerCase().includes('casa')) type = 'house';
        else if(item.shape === 'sphere') type = 'sphere';
        else if(item.shape === 'cylinder') type = 'cylinder';

        let pos = item.position || [0, 0, 0];
        let rot = item.rotation || [0, 0, 0];
        let scl = item.scale || [1, 1, 1];

        return {
          id: item.id || uuidv4(),
          type,
          name: item.label || 'Objeto IA',
          position: { x: pos[0], y: pos[1], z: pos[2] },
          rotation: { x: rot[0], y: rot[1], z: rot[2] },
          scale: { x: scl[0], y: scl[1], z: scl[2] },
          color: item.color || '#888888',
          visible: true
        };
      });
      
      // Merge with current objects
      console.log('Mapped objects generated:', mappedObjects);
      loadProject([...objects, ...mappedObjects]);

      setAiPrompt('');
    } catch(err: any) {
      console.error("AI Generation Error: ", err);
      alert('Error generando con IA: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4 text-gray-300 gap-4 overflow-x-auto shrink-0 z-10 w-full relative">
      <div className="flex items-center gap-2">
        <button onClick={onExit} className="p-2 hover:bg-gray-800 rounded text-red-400 font-bold mr-2 shrink-0">
          Salir
        </button>

        <div className="h-8 w-px bg-gray-700 mx-1 shrink-0"></div>

        <button 
          onClick={() => setTransformMode('translate')} 
          className={`p-2 rounded shrink-0 ${transformMode === 'translate' ? 'bg-blue-600 text-white' : 'hover:bg-gray-800'}`} title="Mover"
        >
          <Move size={18} />
        </button>
        <button 
          onClick={() => setTransformMode('rotate')} 
          className={`p-2 rounded shrink-0 ${transformMode === 'rotate' ? 'bg-blue-600 text-white' : 'hover:bg-gray-800'}`} title="Rotar"
        >
          <RotateCw size={18} />
        </button>
        <button 
          onClick={() => setTransformMode('scale')} 
          className={`p-2 rounded shrink-0 ${transformMode === 'scale' ? 'bg-blue-600 text-white' : 'hover:bg-gray-800'}`} title="Escalar"
        >
          <Scaling size={18} />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={() => spawnObject('box', 'Bloque')} className="p-2 hover:bg-gray-800 rounded flex gap-2 items-center text-sm shrink-0" title="Insertar Bloque">
          <Box size={18} /> <span className="hidden xl:inline">Bloque</span>
        </button>
        <button onClick={() => spawnObject('terrain', 'Terreno Bosque')} className="p-2 hover:bg-gray-800 rounded flex gap-2 items-center text-sm text-green-400 shrink-0" title="Terreno">
          <Mountain size={18} /> <span className="hidden xl:inline">Terreno</span>
        </button>
        <button onClick={() => spawnObject('tree', 'Árbol')} className="p-2 hover:bg-gray-800 rounded flex gap-2 items-center text-green-500 text-sm shrink-0" title="Arbol">
          <Trees size={18} /> <span className="hidden xl:inline">Árbol</span>
        </button>
        <button onClick={() => spawnObject('house', 'Casa')} className="p-2 hover:bg-gray-800 rounded flex gap-2 items-center text-amber-500 text-sm shrink-0" title="Casa">
          <Home size={18} /> <span className="hidden xl:inline">Casa</span>
        </button>
        <button onClick={() => spawnObject('vehicle', 'Vehículo')} className="p-2 hover:bg-gray-800 rounded flex gap-2 items-center text-cyan-400 text-sm shrink-0" title="Vehículo">
          <Car size={18} /> <span className="hidden xl:inline">Vehículo</span>
        </button>
        <button onClick={() => spawnObject('character', 'Jugador')} className="p-2 hover:bg-gray-800 rounded flex gap-2 items-center text-purple-400 text-sm shrink-0" title="Personaje">
          <User size={18} /> <span className="hidden xl:inline">Jugador</span>
        </button>

        {selectedId && (
          <>
            <button onClick={() => duplicateObject(selectedId)} className="p-2 hover:bg-green-900/50 rounded flex gap-2 items-center text-green-500 text-sm ml-2 shrink-0" title="Duplicar Seleccionado">
              <Copy size={18} />
            </button>
            <button onClick={() => removeObject(selectedId)} className="p-2 hover:bg-red-900/50 rounded flex gap-2 items-center text-red-500 text-sm shrink-0" title="Eliminar Seleccionado">
              <Trash2 size={18} />
            </button>
          </>
        )}
      </div>

      <div className="flex items-center gap-2 ml-4">
         <input 
            type="text"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="Ej: ciudad moderna"
            className="bg-gray-950 border border-gray-800 rounded px-3 py-1 text-xs text-white focus:outline-none focus:border-blue-500 w-32 md:w-48 xl:w-64"
            onKeyDown={(e) => e.key === 'Enter' && generateAI()}
         />
         <button disabled={loading} onClick={generateAI} className="p-1.5 bg-fuchsia-600/20 text-fuchsia-400 hover:bg-fuchsia-600 hover:text-white rounded flex items-center justify-center shrink-0 disabled:opacity-50 transition-all">
           <Sparkles size={16} />
         </button>
      </div>

      <div className="flex items-center gap-2 border-l border-gray-700 pl-4 h-full py-2 shrink-0">
        <button onClick={handleSave} disabled={loading} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm flex items-center gap-2 disabled:opacity-50">
          <Save size={16} /> <span className="hidden md:inline">Guardar Nube</span>
        </button>
        <button onClick={handleLoad} disabled={loading} className="p-2 hover:bg-gray-800 rounded text-sm text-gray-300 flex items-center gap-2">
          <FolderOpen size={16} />
        </button>
      </div>
    </div>
  );
};

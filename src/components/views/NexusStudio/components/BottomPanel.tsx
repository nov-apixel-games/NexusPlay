import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Terminal, Code, Sparkles, Loader2, FolderOpen, Upload } from 'lucide-react';
import { useStudioStore } from '../store/useStudioStore';

export const BottomPanel = () => {
  const [activeTab, setActiveTab] = useState<'console' | 'scripts' | 'ai' | 'assets'>('assets');
  const [assets, setAssets] = useState<{name: string, url: string}[]>([]);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const { addEntity, setEngineMode } = useStudioStore();

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setMessages(prev => [...prev, `Usuario: ${prompt}`]);
    
    try {
      const res = await fetch('/api/nexus-3d-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      
      const rawResponse = await res.text();
      let data;
      try {
        data = JSON.parse(rawResponse);
      } catch (err) {
        throw new Error("El servidor no devolvió JSON válido.");
      }

      if (!data.success) throw new Error(data.error || 'Error desconocido');
      
      let jsonStr = data.text;
      const match = data.text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      if (match) jsonStr = match[1];
      
      const parsed = JSON.parse(jsonStr);
      const items = Array.isArray(parsed) ? parsed : [];
      
      setEngineMode('3D');
      items.forEach((item: any) => {
        addEntity({
          name: item.label || 'Objeto IA',
          type: item.shape === 'cube' ? 'cube' : 'sphere',
          is3D: true,
          position: item.position || [0, 0, 0],
          rotation: item.rotation || [0, 0, 0],
          scale: item.scale || [1, 1, 1],
          color: item.color || '#cccccc',
          visible: true,
          locked: false
        });
      });
      
      setMessages(prev => [...prev, `Nexus AI: ${items.length} objetos generados e insertados en la escena 3D.`]);
    } catch(err: any) {
      setMessages(prev => [...prev, `Nexus AI Error: ${err.message}`]);
    } finally {
      setIsLoading(false);
      setPrompt('');
    }
  };

  return (
    <div className="h-64 bg-neutral-900 border-t border-neutral-800 flex flex-col text-neutral-300">
      <div className="flex items-center gap-1 p-1 border-b border-neutral-800 text-sm">
        <button 
          onClick={() => setActiveTab('assets')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded ${activeTab === 'assets' ? 'bg-neutral-800 text-white' : 'hover:bg-neutral-800 text-neutral-500'}`}
        >
          <FolderOpen size={14} /> Assets
        </button>
        <button 
          onClick={() => setActiveTab('console')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded ${activeTab === 'console' ? 'bg-neutral-800 text-white' : 'hover:bg-neutral-800 text-neutral-500'}`}
        >
          <Terminal size={14} /> Consola
        </button>
        <button 
          onClick={() => setActiveTab('scripts')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded ${activeTab === 'scripts' ? 'bg-neutral-800 text-white' : 'hover:bg-neutral-800 text-neutral-500'}`}
        >
          <Code size={14} /> Scripts
        </button>
        <button 
          onClick={() => setActiveTab('ai')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded ${activeTab === 'ai' ? 'bg-blue-600/20 text-blue-400 font-bold' : 'hover:bg-neutral-800 text-blue-500'}`}
        >
          <Sparkles size={14} /> Nexus AI
        </button>
      </div>
      
      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'assets' && (
          <div className="p-4 flex flex-col h-full overflow-hidden">
             <div className="flex justify-between items-center mb-4">
               <span className="text-sm font-bold text-white">Archivos del Proyecto</span>
               <label className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded text-sm cursor-pointer flex items-center gap-2">
                 <Upload size={14} /> Subir Asset
                 <input type="file" className="hidden" accept=".png,.jpg,.jpeg,.webp,.gif,.mp3,.wav,.ogg,.glb,.gltf,.fbx,.obj,.zip" multiple onChange={(e) => {
                   if (e.target.files) {
                     const newAssets = Array.from(e.target.files).map(f => ({
                       name: f.name,
                       url: URL.createObjectURL(f)
                     }));
                     setAssets(prev => [...prev, ...newAssets]);
                   }
                 }} />
               </label>
             </div>
             <div className="flex-1 overflow-y-auto grid grid-cols-6 gap-4">
               {assets.map((asset, i) => (
                 <div key={i} className="bg-neutral-800 border border-neutral-700 rounded p-2 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-blue-500">
                    {asset.name.endsWith('.png') || asset.name.endsWith('.jpg') || asset.name.endsWith('.webp') ? (
                      <img src={asset.url} alt={asset.name} className="w-12 h-12 object-cover rounded" />
                    ) : (
                      <FolderOpen size={24} className="text-blue-400" />
                    )}
                    <span className="text-xs truncate w-full text-center text-neutral-400">{asset.name}</span>
                 </div>
               ))}
               {assets.length === 0 && (
                 <div className="col-span-6 flex flex-col items-center justify-center py-8 text-neutral-500 text-sm border-2 border-dashed border-neutral-700 rounded">
                    <FolderOpen size={32} className="mb-2 opacity-50" />
                    Arrastra archivos aquí o haz clic en Subir Asset
                 </div>
               )}
             </div>
          </div>
        )}

        {activeTab === 'console' && (
          <div className="p-4 font-mono text-xs text-neutral-400">
            <div>[Nexus Studio] Motor inicializado correctamente.</div>
            <div>[Nexus Studio] Cargando assets...</div>
            <div className="text-green-400">[Nexus Studio] Listo para usar.</div>
          </div>
        )}
        
        {activeTab === 'scripts' && (
          <Editor 
            height="100%" 
            defaultLanguage="javascript" 
            theme="vs-dark" 
            value={useStudioStore(s => s.scripts)}
            onChange={(val) => useStudioStore.getState().setScripts(val || '')}
            options={{ minimap: { enabled: false }, fontSize: 12 }} 
          />
        )}

        {activeTab === 'ai' && (
           <div className="p-4 flex flex-col h-full">
             <div className="flex-1 overflow-y-auto mb-2 text-sm text-neutral-400 flex flex-col gap-2">
                <div className="bg-blue-900/20 text-blue-300 p-3 rounded border border-blue-800/30">
                  Hola, soy Nexus AI. Puedo generar mundos 3D, mapas 2D, scripts de lógica o responder preguntas sobre la API del motor. ¿Qué deseas crear hoy?
                </div>
                {messages.map((msg, i) => (
                  <div key={i} className={`p-3 rounded ${msg.startsWith('User') ? 'bg-neutral-800 text-white' : msg.includes('Error') ? 'bg-red-900/20 text-red-400 border border-red-800/30' : 'bg-blue-900/20 text-blue-300 border border-blue-800/30'}`}>
                    {msg}
                  </div>
                ))}
             </div>
             <div className="flex gap-2">
               <input 
                 type="text" 
                 value={prompt}
                 onChange={e => setPrompt(e.target.value)}
                 onKeyDown={e => e.key === 'Enter' && handleGenerate()}
                 placeholder="Ej: Genera una ciudad postapocalíptica..." 
                 className="flex-1 bg-neutral-800 border border-neutral-700 rounded px-3 py-2 text-sm outline-none focus:border-blue-500 text-white"
               />
               <button 
                 onClick={handleGenerate}
                 disabled={isLoading}
                 className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-4 py-2 rounded font-bold text-sm flex items-center gap-2"
               >
                 {isLoading ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />} Generar
               </button>
             </div>
           </div>
        )}
      </div>
    </div>
  );
};

import React, { useEffect } from 'react';
import { ExplorerPanel } from './components/ExplorerPanel';
import { InspectorPanel } from './components/InspectorPanel';
import { BottomPanel } from './components/BottomPanel';
import { Viewport } from './components/Viewport';
import { useStudioStore } from './store/useStudioStore';
import { Menu, Play, Square, Settings, Layers, Code, FolderOpen, X, Download, Save, Box, Image as ImageIcon, Plus } from 'lucide-react';

interface NexusStudioProps {
  onBack: () => void;
}

export const NexusStudio: React.FC<NexusStudioProps> = ({ onBack }) => {
  const { appState, setAppState, activeMobilePanel, setActiveMobilePanel, setEngineMode, engineMode, projectName } = useStudioStore();

  useEffect(() => {
    useStudioStore.getState().loadLocal();
    const interval = setInterval(() => {
      useStudioStore.getState().saveLocal();
    }, 30000); // autosave every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <div 
      className="fixed inset-0 z-[99999] bg-nexus-card flex flex-col w-screen h-screen m-0 p-0 overflow-hidden font-sans"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >
      
      {/* Unified Top Bar (Mobile + Desktop) */}
      <div className="flex items-center justify-between bg-neutral-900 border-b border-neutral-800 p-2 z-20 shrink-0 h-14">
        <div className="flex items-center gap-2">
          <button onClick={() => setActiveMobilePanel('menu')} className="p-2 text-nexus-text hover:bg-neutral-800 rounded min-h-[40px] min-w-[40px] flex items-center justify-center">
            <Menu size={24} />
          </button>
          <div className="font-bold text-nexus-text flex items-center gap-2 px-2">
             <span className="text-blue-500 hidden sm:inline">NEXUS</span>
             <span className="text-neutral-400 font-normal text-sm">{projectName}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Engine Indicator, hidden on very small screens */}
          <div className="hidden sm:flex px-3 py-1.5 bg-neutral-800 rounded text-xs text-neutral-400 font-bold uppercase mr-2">
            {engineMode}
          </div>

          <button onClick={appState === 'play' ? () => setAppState('edit') : () => setAppState('play')} className={`p-2 rounded min-h-[40px] min-w-[40px] flex items-center justify-center ${appState === 'play' ? 'bg-red-600' : 'bg-green-600'} text-nexus-text`}>
            {appState === 'play' ? <Square size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
          </button>
          <button onClick={onBack} className="bg-red-900/30 text-red-500 hover:bg-red-900 hover:text-nexus-text p-2 rounded min-h-[40px] px-4 flex items-center justify-center font-bold text-xs transition-colors" type="button" >
            Salir
          </button>
        </div>
      </div>
      
      <div className="flex-1 flex overflow-hidden relative">
        {/* Desktop Panels */}
        <div className="hidden lg:flex flex-col h-full z-10 w-64 shrink-0 transition-all">
          <ExplorerPanel />
        </div>
        
        {/* Viewport & Bottom Panel Container */}
        <div className="flex-1 flex flex-col min-w-0 h-full relative z-0">
          <Viewport />
          <div className="hidden lg:block shrink-0">
            <BottomPanel />
          </div>
        </div>

        {/* Desktop Inspector */}
        <div className="hidden lg:flex flex-col h-full z-10 w-72 shrink-0 transition-all">
          <InspectorPanel />
        </div>

        {/* Mobile / Tablet Floating Action Buttons */}
        <div className="lg:hidden absolute bottom-4 right-4 flex flex-col gap-3 z-10">
          <button onClick={() => setActiveMobilePanel('inspector')} className="bg-neutral-800 text-nexus-text p-3 rounded-full shadow-lg border border-neutral-700 min-h-[56px] min-w-[56px] flex items-center justify-center active:scale-95 transition-transform">
            <Settings size={28} />
          </button>
          <button onClick={() => setActiveMobilePanel('explorer')} className="bg-neutral-800 text-nexus-text p-3 rounded-full shadow-lg border border-neutral-700 min-h-[56px] min-w-[56px] flex items-center justify-center active:scale-95 transition-transform">
            <Layers size={28} />
          </button>
          <button onClick={() => setActiveMobilePanel('assets')} className="bg-neutral-800 text-nexus-text p-3 rounded-full shadow-lg border border-neutral-700 min-h-[56px] min-w-[56px] flex items-center justify-center active:scale-95 transition-transform">
            <FolderOpen size={28} />
          </button>
          <button onClick={() => setActiveMobilePanel('scripts')} className="bg-neutral-800 text-nexus-text p-3 rounded-full shadow-lg border border-neutral-700 min-h-[56px] min-w-[56px] flex items-center justify-center active:scale-95 transition-transform">
            <Code size={28} />
          </button>
        </div>

        {/* Drawers / Modals (Mobile + Tablet) */}
        {activeMobilePanel === 'explorer' && (
          <div className="lg:hidden absolute inset-y-0 left-0 w-80 max-w-[85vw] bg-neutral-900 border-r border-neutral-800 z-50 flex flex-col shadow-2xl">
            <div className="flex justify-between items-center p-3 border-b border-neutral-800">
              <span className="text-nexus-text font-bold">Explorador</span>
              <button onClick={() => setActiveMobilePanel(null)} className="p-2 text-neutral-400 hover:text-nexus-text min-h-[48px] min-w-[48px] flex items-center justify-center"><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-hidden">
               <ExplorerPanel mobile />
            </div>
          </div>
        )}

        {activeMobilePanel === 'inspector' && (
          <div className="lg:hidden absolute bottom-0 left-0 right-0 h-[65vh] bg-neutral-900 border-t border-neutral-800 z-50 flex flex-col shadow-2xl rounded-t-2xl">
            <div className="flex justify-between items-center p-3 border-b border-neutral-800">
              <span className="text-nexus-text font-bold">Inspector</span>
              <button onClick={() => setActiveMobilePanel(null)} className="p-2 text-neutral-400 hover:text-nexus-text min-h-[48px] min-w-[48px] flex items-center justify-center"><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto">
               <InspectorPanel mobile />
            </div>
          </div>
        )}

        {/* Assets & Scripts use BottomPanel fullscreen on small screens */}
        {(activeMobilePanel === 'assets' || activeMobilePanel === 'scripts') && (
          <div className="lg:hidden absolute inset-0 bg-neutral-900 z-50 flex flex-col">
            <div className="flex justify-between items-center p-3 border-b border-neutral-800 bg-black h-14 shrink-0">
              <span className="text-nexus-text font-bold text-lg">{activeMobilePanel === 'assets' ? 'Assets' : 'Scripts'}</span>
              <button onClick={() => setActiveMobilePanel(null)} className="p-2 text-neutral-400 hover:text-nexus-text min-h-[48px] min-w-[48px] flex items-center justify-center"><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-hidden flex flex-col pt-0">
               <BottomPanel forcedTab={activeMobilePanel} mobile />
            </div>
          </div>
        )}

        {/* Main Menu Modal (Universal) */}
        {activeMobilePanel === 'menu' && (
          <div className="absolute inset-0 bg-nexus-overlay backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setActiveMobilePanel(null); }}>
            <div className="bg-neutral-900 w-full max-w-sm rounded-xl border border-neutral-800 overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">
               <div className="flex justify-between items-center p-4 border-b border-neutral-800 bg-neutral-950">
                  <span className="text-nexus-text font-bold text-lg">Menú Principal</span>
                  <button onClick={() => setActiveMobilePanel(null)} className="p-2 text-neutral-400 hover:text-nexus-text min-h-[48px] min-w-[48px] flex items-center justify-center"><X size={24} /></button>
               </div>
               <div className="p-2 flex flex-col gap-2 overflow-y-auto max-h-[70vh]">
                  <button className="flex items-center gap-3 p-4 text-nexus-text bg-neutral-800 hover:bg-neutral-700 rounded min-h-[56px] transition-colors" onClick={() => { setActiveMobilePanel(null); }}>
                    <Plus size={20} /> Nuevo Proyecto
                  </button>
                  <button className="flex items-center gap-3 p-4 text-nexus-text bg-neutral-800 hover:bg-neutral-700 rounded min-h-[56px] transition-colors" onClick={() => { useStudioStore.getState().saveLocal(); setActiveMobilePanel(null); }}>
                    <Save size={20} /> Guardar
                  </button>
                  <button className="flex items-center gap-3 p-4 text-nexus-text bg-neutral-800 hover:bg-neutral-700 rounded min-h-[56px] transition-colors" onClick={() => { useStudioStore.getState().exportProject(); setActiveMobilePanel(null); }}>
                    <Download size={20} /> Exportar como JSON
                  </button>
                  
                  <div className="h-px bg-neutral-800 my-2" />
                  <span className="px-4 text-xs font-bold text-neutral-500 uppercase">Configuración de Motor</span>
                  
                  <button 
                    className={`flex items-center gap-3 p-4 text-nexus-text rounded min-h-[56px] transition-colors ${engineMode === '3D' ? 'bg-blue-600' : 'bg-neutral-800 hover:bg-neutral-700'}`} 
                    onClick={() => { setEngineMode('3D'); setActiveMobilePanel(null); }}
                  >
                    <Box size={20} /> Modo 3D (Three.js)
                  </button>
                  <button 
                    className={`flex items-center gap-3 p-4 text-nexus-text rounded min-h-[56px] transition-colors ${engineMode === '2D' ? 'bg-blue-600' : 'bg-neutral-800 hover:bg-neutral-700'}`} 
                    onClick={() => { setEngineMode('2D'); setActiveMobilePanel(null); }}
                  >
                    <ImageIcon size={20} /> Modo 2D (Phaser)
                  </button>
               </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default NexusStudio;

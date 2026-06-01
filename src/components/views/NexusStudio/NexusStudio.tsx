import React, { useEffect } from 'react';
import { MenuBar } from './components/MenuBar';
import { Toolbar } from './components/Toolbar';
import { ExplorerPanel } from './components/ExplorerPanel';
import { InspectorPanel } from './components/InspectorPanel';
import { BottomPanel } from './components/BottomPanel';
import { Viewport } from './components/Viewport';
import { useStudioStore } from './store/useStudioStore';

interface NexusStudioProps {
  onBack: () => void;
}

export const NexusStudio: React.FC<NexusStudioProps> = ({ onBack }) => {
  useEffect(() => {
    useStudioStore.getState().loadLocal();
    const interval = setInterval(() => {
      useStudioStore.getState().saveLocal();
    }, 30000); // autosave every 30s
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="fixed inset-0 z-[99999] bg-[#02040a] flex flex-col w-screen h-screen m-0 p-0 overflow-hidden font-sans">
      <MenuBar />
      <Toolbar />
      
      <div className="flex-1 flex overflow-hidden">
        <ExplorerPanel />
        <div className="flex-1 flex flex-col min-w-0">
          <Viewport />
          <BottomPanel />
        </div>
        <InspectorPanel />
      </div>

      {/* Botón temporal de salir inyectado por encima del engine bar para volver al hub */}
      <button 
        onClick={onBack}
        className="absolute top-2 right-4 bg-red-600 hover:bg-red-500 text-white px-3 py-1 text-xs rounded font-bold z-50 cursor-pointer"
      >
        Salir al Hub
      </button>
    </div>
  );
};

export default NexusStudio;

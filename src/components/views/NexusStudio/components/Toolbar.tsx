import React from 'react';
import { Play, Square, Save, Download, MousePointer2, Move, RotateCcw, Maximize2 } from 'lucide-react';
import { useStudioStore } from '../store/useStudioStore';

export const Toolbar = () => {
  const { appState, setAppState, toolMode, setToolMode, engineMode, setEngineMode } = useStudioStore();

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-neutral-900 border-b border-neutral-800 text-neutral-300">
      <div className="flex items-center gap-2">
        <div className="flex bg-neutral-800 rounded p-1">
          <button 
            className={`p-1.5 rounded ${toolMode === 'select' ? 'bg-neutral-700 text-nexus-text' : 'hover:bg-neutral-700'}`}
            onClick={() => setToolMode('select')} title="Select">
            <MousePointer2 size={16} />
          </button>
          <button 
            className={`p-1.5 rounded ${toolMode === 'translate' ? 'bg-neutral-700 text-nexus-text' : 'hover:bg-neutral-700'}`}
            onClick={() => setToolMode('translate')} title="Translate">
            <Move size={16} />
          </button>
          <button 
            className={`p-1.5 rounded ${toolMode === 'rotate' ? 'bg-neutral-700 text-nexus-text' : 'hover:bg-neutral-700'}`}
            onClick={() => setToolMode('rotate')} title="Rotate">
            <RotateCcw size={16} />
          </button>
          <button 
            className={`p-1.5 rounded ${toolMode === 'scale' ? 'bg-neutral-700 text-nexus-text' : 'hover:bg-neutral-700'}`}
            onClick={() => setToolMode('scale')} title="Scale">
            <Maximize2 size={16} />
          </button>
        </div>
        <div className="w-px h-6 bg-neutral-700 mx-2" />
        <select 
          className="bg-neutral-800 text-sm border-none rounded px-2 py-1 outline-none cursor-pointer"
          value={engineMode}
          onChange={(e) => setEngineMode(e.target.value as '2D' | '3D')}
        >
          <option value="3D">Motor 3D (Three.js)</option>
          <option value="2D">Motor 2D (Phaser)</option>
        </select>
        <button className="flex items-center gap-1 hover:text-nexus-text px-2 py-1" onClick={() => useStudioStore.getState().saveLocal()}>
          <Save size={16} /> Guardar
        </button>
        <button className="flex items-center gap-1 hover:text-nexus-text px-2 py-1" onClick={() => useStudioStore.getState().exportProject()}>
          <Download size={16} /> Exportar
        </button>
      </div>

      <div className="flex items-center gap-4">
        {appState === 'edit' ? (
          <button 
            onClick={() => setAppState('play')}
            className="flex items-center gap-2 px-6 py-1.5 bg-green-600 hover:bg-green-500 text-nexus-text rounded font-bold text-sm">
            <Play size={16} fill="currentColor" /> EJECUTAR
          </button>
        ) : (
          <button 
            onClick={() => setAppState('edit')}
            className="flex items-center gap-2 px-6 py-1.5 bg-red-600 hover:bg-red-500 text-nexus-text rounded font-bold text-sm">
            <Square size={16} fill="currentColor" /> DETENER
          </button>
        )}
      </div>
    </div>
  );
};

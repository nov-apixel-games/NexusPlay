import React from 'react';
import { useStudioStore, Entity } from '../store/useStudioStore';
import { Box, Circle, Hexagon, Image as ImageIcon, Type, Trash2, Copy } from 'lucide-react';

export const ExplorerPanel = () => {
  const { engineMode, entities, addEntity, removeEntity, selectedEntityId, selectEntity } = useStudioStore();

  const handleAdd3D = (type: string) => {
    addEntity({
      name: `New ${type}`,
      type,
      is3D: true,
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      visible: true,
      locked: false,
      color: '#aaaaaa'
    });
  };

  const handleAdd2D = (type: string) => {
    addEntity({
      name: `New ${type}`,
      type,
      is3D: false,
      x: 400,
      y: 300,
      width: 100,
      height: 100,
      visible: true,
      locked: false,
      color: '#aaaaaa'
    });
  };

  return (
    <div className="w-64 bg-neutral-900 border-r border-neutral-800 flex flex-col h-full text-neutral-300">
      <div className="p-2 border-b border-neutral-800 font-semibold text-sm text-white">
        Jerarquía de Escena
      </div>
      
      <div className="p-2 border-b border-neutral-800 grid grid-cols-2 gap-2 text-sm">
        {engineMode === '3D' ? (
          <>
            <button onClick={() => handleAdd3D('cube')} className="flex items-center gap-1 p-1 bg-neutral-800 hover:bg-neutral-700 rounded">
              <Box size={14} /> Cubo
            </button>
            <button onClick={() => handleAdd3D('sphere')} className="flex items-center gap-1 p-1 bg-neutral-800 hover:bg-neutral-700 rounded">
              <Circle size={14} /> Esfera
            </button>
            <button onClick={() => handleAdd3D('model')} className="flex items-center gap-1 p-1 bg-neutral-800 hover:bg-neutral-700 rounded">
              <Hexagon size={14} /> Modelo
            </button>
            <button onClick={() => handleAdd3D('light')} className="flex items-center gap-1 p-1 bg-neutral-800 hover:bg-neutral-700 rounded">
              <Type size={14} /> Luz
            </button>
          </>
        ) : (
          <>
            <button onClick={() => handleAdd2D('sprite')} className="flex items-center gap-1 p-1 bg-neutral-800 hover:bg-neutral-700 rounded">
              <ImageIcon size={14} /> Sprite
            </button>
            <button onClick={() => handleAdd2D('rect')} className="flex items-center gap-1 p-1 bg-neutral-800 hover:bg-neutral-700 rounded">
              <Box size={14} /> Rect
            </button>
          </>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {entities.map(entity => (
          <div 
            key={entity.id}
            onClick={() => selectEntity(entity.id)}
            className={`flex items-center justify-between p-1.5 rounded cursor-pointer group ${selectedEntityId === entity.id ? 'bg-blue-600/30 text-blue-400' : 'hover:bg-neutral-800 text-sm'}`}
          >
            <div className="flex items-center gap-2 truncate">
              {entity.is3D ? <Box size={14} /> : <ImageIcon size={14} />}
              <span className="truncate">{entity.name}</span>
            </div>
            <div className="hidden group-hover:flex items-center gap-1">
               <button onClick={(e) => { e.stopPropagation(); removeEntity(entity.id); }} className="text-neutral-500 hover:text-red-400"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useStudioStore, Entity } from '../store/useStudioStore';
import { Box, Circle, Hexagon, Image as ImageIcon, Type, Trash2, Copy, Plus, MoreVertical, Edit2 } from 'lucide-react';

export const ExplorerPanel = ({ mobile }: { mobile?: boolean }) => {
  const { engineMode, entities, addEntity, removeEntity, selectedEntityId, selectEntity, scenes, activeSceneId, addScene, setActiveScene, removeScene, renameScene, duplicateScene } = useStudioStore();
  const [editingSceneId, setEditingSceneId] = useState<string | null>(null);
  const [editSceneName, setEditSceneName] = useState('');

  const btnClass = mobile ? 'flex items-center justify-center gap-2 p-3 bg-neutral-800 hover:bg-neutral-700 rounded w-full' : 'flex items-center gap-1 p-1 bg-neutral-800 hover:bg-neutral-700 rounded w-full';
  const iconSize = mobile ? 18 : 14;

  const currentEntities = entities.filter(e => e.sceneId === activeSceneId);

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

  const handleSaveSceneName = (id: string) => {
    if (editSceneName.trim()) {
      renameScene(id, editSceneName);
    }
    setEditingSceneId(null);
  };

  return (
    <div className={`${mobile ? 'w-full' : 'w-64'} bg-neutral-900 border-r border-neutral-800 flex flex-col h-full text-neutral-300`}>
      {!mobile && (
        <div className="p-2 border-b border-neutral-800 font-semibold text-sm text-nexus-text">
          Explorador
        </div>
      )}

      {/* Scenes Section */}
      <div className="p-2 border-b border-neutral-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-neutral-500 uppercase">Escenas</span>
          <button onClick={() => addScene('Nueva Escena')} className="text-neutral-400 hover:text-nexus-text p-1">
            <Plus size={14} />
          </button>
        </div>
        <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
          {scenes.map(s => (
             <div 
               key={s.id} 
               onClick={() => setActiveScene(s.id)}
               className={`flex items-center justify-between px-2 py-1.5 rounded cursor-pointer group ${s.id === activeSceneId ? 'bg-blue-600/30 border border-blue-500/50 text-nexus-text' : 'hover:bg-neutral-800'}`}
             >
                {editingSceneId === s.id ? (
                  <input 
                    autoFocus
                    value={editSceneName}
                    onChange={e => setEditSceneName(e.target.value)}
                    onBlur={() => handleSaveSceneName(s.id)}
                    onKeyDown={e => e.key === 'Enter' && handleSaveSceneName(s.id)}
                    className="bg-black border border-blue-500 rounded px-1 w-full text-sm outline-none"
                  />
                ) : (
                  <span className="text-sm truncate w-32">{s.name}</span>
                )}
                {!editingSceneId && (
                  <div className={`flex items-center gap-1 ${mobile ? '' : 'opacity-0 group-hover:opacity-100'}`}>
                    <button onClick={(e) => { e.stopPropagation(); setEditingSceneId(s.id); setEditSceneName(s.name); }} className="p-1 hover:text-blue-400"><Edit2 size={12} /></button>
                    <button onClick={(e) => { e.stopPropagation(); duplicateScene(s.id); }} className="p-1 hover:text-green-400"><Copy size={12} /></button>
                    {scenes.length > 1 && (
                      <button onClick={(e) => { e.stopPropagation(); removeScene(s.id); }} className="p-1 hover:text-red-400"><Trash2 size={12} /></button>
                    )}
                  </div>
                )}
             </div>
          ))}
        </div>
      </div>
      
      <div className={`p-2 border-b border-neutral-800 grid grid-cols-2 ${mobile ? 'gap-3' : 'gap-2'} text-sm`}>
        {engineMode === '3D' ? (
          <>
            <button onClick={() => handleAdd3D('cube')} className={btnClass}>
              <Box size={iconSize} /> Cubo
            </button>
            <button onClick={() => handleAdd3D('sphere')} className={btnClass}>
              <Circle size={iconSize} /> Esfera
            </button>
            <button onClick={() => handleAdd3D('terrain')} className={btnClass}>
              <Box size={iconSize} /> Terreno
            </button>
            <button onClick={() => handleAdd3D('model')} className={btnClass}>
              <Hexagon size={iconSize} /> Modelo
            </button>
            <button onClick={() => handleAdd3D('directionalLight')} className={btnClass}>
              <Type size={iconSize} /> Luz Dir
            </button>
            <button onClick={() => handleAdd3D('pointLight')} className={btnClass}>
              <Type size={iconSize} /> Luz Punto
            </button>
            <button onClick={() => handleAdd3D('spotLight')} className={btnClass}>
              <Type size={iconSize} /> Luz Foco
            </button>
            <button onClick={() => handleAdd3D('ambientLight')} className={btnClass}>
              <Type size={iconSize} /> Luz Amb
            </button>
          </>
        ) : (
          <>
            <button onClick={() => handleAdd2D('sprite')} className={btnClass}>
              <ImageIcon size={iconSize} /> Sprite
            </button>
            <button onClick={() => handleAdd2D('rect')} className={btnClass}>
              <Box size={iconSize} /> Rect
            </button>
          </>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <div className="text-xs font-bold text-neutral-500 uppercase mb-2">Entidades ({currentEntities.length})</div>
        {currentEntities.map(entity => (
          <div 
            key={entity.id}
            onClick={() => selectEntity(entity.id)}
            className={`flex items-center justify-between ${mobile ? 'p-3 mb-1' : 'p-1.5'} rounded cursor-pointer group ${selectedEntityId === entity.id ? 'bg-blue-600/30 text-blue-400' : 'hover:bg-neutral-800 text-sm'}`}
          >
            <div className="flex items-center gap-2 truncate">
              {entity.is3D ? <Box size={iconSize} /> : <ImageIcon size={iconSize} />}
              <span className="truncate w-32">{entity.name}</span>
            </div>
            <div className={`${mobile ? 'flex' : 'hidden group-hover:flex'} items-center gap-1`}>
               <button onClick={(e) => { e.stopPropagation(); removeEntity(entity.id); }} className={`text-neutral-500 hover:text-red-400 ${mobile ? 'p-2' : ''}`}><Trash2 size={iconSize} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

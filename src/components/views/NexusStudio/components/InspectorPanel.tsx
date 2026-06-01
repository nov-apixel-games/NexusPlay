import React from 'react';
import { useStudioStore, Entity, Entity3D, Entity2D } from '../store/useStudioStore';

export const InspectorPanel = () => {
  const { entities, selectedEntityId, updateEntity, engineMode } = useStudioStore();
  const selectedEntity = entities.find(e => e.id === selectedEntityId);

  if (!selectedEntity) {
    return (
      <div className="w-72 bg-neutral-900 border-l border-neutral-800 flex flex-col h-full items-center justify-center text-neutral-500 text-sm">
        Ningún objeto seleccionado
      </div>
    );
  }

  const handleChange = (field: string, value: any) => {
    updateEntity(selectedEntity.id, { [field]: value });
  };

  const handleVec3 = (field: 'position' | 'rotation' | 'scale', index: number, value: string) => {
    if (!selectedEntity.is3D) return;
    const num = parseFloat(value) || 0;
    const newVec = [...selectedEntity[field]] as [number, number, number];
    newVec[index] = num;
    handleChange(field, newVec);
  };

  return (
    <div className="w-72 bg-neutral-900 border-l border-neutral-800 flex flex-col h-full text-neutral-300">
      <div className="p-2 border-b border-neutral-800 font-semibold text-sm text-white flex justify-between items-center">
        <span>Inspector</span>
        <span className="text-xs text-neutral-500">{selectedEntity.type}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="space-y-1">
          <label className="text-xs text-neutral-500">Nombre</label>
          <input 
            type="text" 
            value={selectedEntity.name}
            onChange={e => handleChange('name', e.target.value)}
            className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-sm outline-none focus:border-blue-500 text-white"
          />
        </div>

        {selectedEntity.is3D ? (
          <>
            <Vec3Input label="Posición" value={(selectedEntity as Entity3D).position} onChange={(i, v) => handleVec3('position', i, v)} />
            <Vec3Input label="Rotación" value={(selectedEntity as Entity3D).rotation} onChange={(i, v) => handleVec3('rotation', i, v)} />
            <Vec3Input label="Escala" value={(selectedEntity as Entity3D).scale} onChange={(i, v) => handleVec3('scale', i, v)} />
            {(selectedEntity.type === 'cube' || selectedEntity.type === 'sphere') && (
               <div className="space-y-2 pt-2 border-t border-neutral-800">
                 <div className="space-y-1">
                   <label className="text-xs text-neutral-500">Color Base</label>
                   <input 
                     type="color" 
                     value={(selectedEntity as Entity3D).color || '#ffffff'}
                     onChange={e => handleChange('color', e.target.value)}
                     className="w-full h-8 bg-neutral-800 border-none cursor-pointer"
                   />
                 </div>
                 <div className="space-y-1">
                   <label className="text-xs text-neutral-500">Emisión (Color)</label>
                   <input 
                     type="color" 
                     value={(selectedEntity as Entity3D).emission || '#000000'}
                     onChange={e => handleChange('emission', e.target.value)}
                     className="w-full h-8 bg-neutral-800 border-none cursor-pointer"
                   />
                 </div>
                 <div className="grid grid-cols-2 gap-2">
                   <div className="space-y-1">
                     <label className="text-xs text-neutral-500">Metalness</label>
                     <input type="range" min="0" max="1" step="0.01" value={(selectedEntity as Entity3D).metalness || 0} onChange={e => handleChange('metalness', parseFloat(e.target.value))} className="w-full" />
                   </div>
                   <div className="space-y-1">
                     <label className="text-xs text-neutral-500">Roughness</label>
                     <input type="range" min="0" max="1" step="0.01" value={(selectedEntity as Entity3D).roughness !== undefined ? (selectedEntity as Entity3D).roughness : 0.5} onChange={e => handleChange('roughness', parseFloat(e.target.value))} className="w-full" />
                   </div>
                 </div>
                 <div className="space-y-1">
                   <label className="text-xs text-neutral-500">Opacidad</label>
                   <input type="range" min="0" max="1" step="0.01" value={(selectedEntity as Entity3D).opacity !== undefined ? (selectedEntity as Entity3D).opacity : 1} onChange={e => handleChange('opacity', parseFloat(e.target.value))} className="w-full" />
                 </div>
               </div>
            )}
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs text-neutral-500">X</label>
                <input type="number" value={(selectedEntity as Entity2D).x} onChange={e => handleChange('x', parseFloat(e.target.value))} className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-sm outline-none focus:border-blue-500 text-white" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-neutral-500">Y</label>
                <input type="number" value={(selectedEntity as Entity2D).y} onChange={e => handleChange('y', parseFloat(e.target.value))} className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-sm outline-none focus:border-blue-500 text-white" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs text-neutral-500">Ancho</label>
                <input type="number" value={(selectedEntity as Entity2D).width} onChange={e => handleChange('width', parseFloat(e.target.value))} className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-sm outline-none focus:border-blue-500 text-white" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-neutral-500">Alto</label>
                <input type="number" value={(selectedEntity as Entity2D).height} onChange={e => handleChange('height', parseFloat(e.target.value))} className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-sm outline-none focus:border-blue-500 text-white" />
              </div>
            </div>
            {(selectedEntity.type === 'rect') && (
               <div className="space-y-1">
                 <label className="text-xs text-neutral-500">Color (Hex)</label>
                 <input 
                   type="color" 
                   value={(selectedEntity as Entity2D).color || '#ffffff'}
                   onChange={e => handleChange('color', e.target.value)}
                   className="w-full h-8 bg-neutral-800 border-none cursor-pointer"
                 />
               </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const Vec3Input = ({ label, value, onChange }: { label: string, value: [number, number, number], onChange: (index: number, val: string) => void }) => (
  <div className="space-y-1">
    <label className="text-xs text-neutral-500">{label}</label>
    <div className="grid grid-cols-3 gap-1">
      <input type="number" step="0.1" value={value[0]} onChange={e => onChange(0, e.target.value)} className="w-full bg-neutral-800 border border-neutral-700 mx-0 rounded-l px-1 py-1 text-sm outline-none focus:border-blue-500 text-white text-center" />
      <input type="number" step="0.1" value={value[1]} onChange={e => onChange(1, e.target.value)} className="w-full bg-neutral-800 border border-neutral-700 mx-0 px-1 py-1 text-sm outline-none focus:border-blue-500 text-white text-center" />
      <input type="number" step="0.1" value={value[2]} onChange={e => onChange(2, e.target.value)} className="w-full bg-neutral-800 border border-neutral-700 mx-0 rounded-r px-1 py-1 text-sm outline-none focus:border-blue-500 text-white text-center" />
    </div>
  </div>
);

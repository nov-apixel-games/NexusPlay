import React from 'react';
import { useStudioStore, Entity, Entity3D, Entity2D } from '../store/useStudioStore';

export const InspectorPanel = ({ mobile }: { mobile?: boolean }) => {
  const { entities, selectedEntityId, updateEntity, engineMode } = useStudioStore();
  const selectedEntity = entities.find(e => e.id === selectedEntityId);

  if (!selectedEntity) {
    return (
      <div className={`${mobile ? 'w-full' : 'w-72'} bg-neutral-900 border-l border-neutral-800 flex flex-col h-full items-center justify-center text-neutral-500 text-sm`}>
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

  const inputClass = mobile ? "w-full bg-neutral-800 border border-neutral-700 rounded px-3 py-3 text-base outline-none focus:border-blue-500 text-white" : "w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-sm outline-none focus:border-blue-500 text-white";
  const vecClass = mobile ? "w-full bg-neutral-800 border border-neutral-700 mx-0 px-2 py-3 text-base outline-none focus:border-blue-500 text-white text-center" : "w-full bg-neutral-800 border border-neutral-700 mx-0 px-1 py-1 text-sm outline-none focus:border-blue-500 text-white text-center";

  return (
    <div className={`${mobile ? 'w-full' : 'w-72'} bg-neutral-900 border-l border-neutral-800 flex flex-col h-full text-neutral-300`}>
      {!mobile && (
        <div className="p-2 border-b border-neutral-800 font-semibold text-sm text-white flex justify-between items-center">
          <span>Inspector</span>
          <span className="text-xs text-neutral-500">{selectedEntity.type}</span>
        </div>
      )}

      <div className={`flex-1 overflow-y-auto ${mobile ? 'p-4 space-y-6 pb-20' : 'p-4 space-y-4'}`}>
        <div className="space-y-1">
          <label className="text-xs text-neutral-500">Nombre</label>
          <input 
            type="text" 
            value={selectedEntity.name}
            onChange={e => handleChange('name', e.target.value)}
            className={inputClass}
          />
        </div>

        {selectedEntity.is3D ? (
          <>
            <Vec3Input mobile={mobile} vecClass={vecClass} label="Posición" value={(selectedEntity as Entity3D).position} onChange={(i, v) => handleVec3('position', i, v)} />
            <Vec3Input mobile={mobile} vecClass={vecClass} label="Rotación" value={(selectedEntity as Entity3D).rotation} onChange={(i, v) => handleVec3('rotation', i, v)} />
            <Vec3Input mobile={mobile} vecClass={vecClass} label="Escala" value={(selectedEntity as Entity3D).scale} onChange={(i, v) => handleVec3('scale', i, v)} />
            
            {/* Properties for Renderable Objects */}
            {(selectedEntity.type === 'cube' || selectedEntity.type === 'sphere' || selectedEntity.type === 'model' || selectedEntity.type === 'terrain') && (
               <div className={`space-y-4 pt-4 border-t border-neutral-800`}>
                 <div className="space-y-1">
                   <label className="text-xs text-neutral-500">Color Base</label>
                   <input 
                     type="color" 
                     value={(selectedEntity as Entity3D).color || '#ffffff'}
                     onChange={e => handleChange('color', e.target.value)}
                     className={`w-full ${mobile ? 'h-14' : 'h-8'} bg-neutral-800 border-none cursor-pointer`}
                   />
                 </div>
                 <div className="space-y-1">
                   <label className="text-xs text-neutral-500">Emisión (Color)</label>
                   <input 
                     type="color" 
                     value={(selectedEntity as Entity3D).emission || '#000000'}
                     onChange={e => handleChange('emission', e.target.value)}
                     className={`w-full ${mobile ? 'h-14' : 'h-8'} bg-neutral-800 border-none cursor-pointer`}
                   />
                 </div>
                 <div className={`grid ${mobile ? 'grid-cols-1 gap-4' : 'grid-cols-2 gap-2'}`}>
                   <div className="space-y-1 flex flex-col">
                     <label className="text-xs text-neutral-500">Metalness</label>
                     <input type="range" min="0" max="1" step="0.01" value={(selectedEntity as Entity3D).metalness || 0} onChange={e => handleChange('metalness', parseFloat(e.target.value))} className={`w-full ${mobile ? 'h-8' : ''}`} />
                   </div>
                   <div className="space-y-1 flex flex-col">
                     <label className="text-xs text-neutral-500">Roughness</label>
                     <input type="range" min="0" max="1" step="0.01" value={(selectedEntity as Entity3D).roughness !== undefined ? (selectedEntity as Entity3D).roughness : 0.5} onChange={e => handleChange('roughness', parseFloat(e.target.value))} className={`w-full ${mobile ? 'h-8' : ''}`} />
                   </div>
                 </div>
                 <div className="space-y-1 flex flex-col">
                   <label className="text-xs text-neutral-500">Opacidad</label>
                   <input type="range" min="0" max="1" step="0.01" value={(selectedEntity as Entity3D).opacity !== undefined ? (selectedEntity as Entity3D).opacity : 1} onChange={e => handleChange('opacity', parseFloat(e.target.value))} className={`w-full ${mobile ? 'h-8' : ''}`} />
                 </div>
                 {/* COMPONENT SYSTEM MOCK */}
                 <div className="space-y-2 pt-4 border-t border-neutral-800">
                    <span className="text-xs font-bold text-neutral-500 uppercase">Componentes (Simulado)</span>
                    <button className="bg-neutral-800 hover:bg-neutral-700 text-white text-xs w-full py-2 rounded border border-neutral-700">+ Añadir Componente</button>
                    <div className="bg-neutral-900 border border-neutral-800 p-2 rounded text-xs text-neutral-400">
                       <div className="flex justify-between items-center mb-1"><strong className="text-white">Rigidbody</strong> <button className="text-red-500">X</button></div>
                       Mass: 1.0 <br/> Use Gravity: true
                    </div>
                 </div>
               </div>
            )}

            {/* Properties for Lights */}
             {(selectedEntity.type.toLowerCase().includes('light')) && (
               <div className={`space-y-4 pt-4 border-t border-neutral-800`}>
                 <div className="space-y-1">
                   <label className="text-xs text-neutral-500">Color de Luz</label>
                   <input 
                     type="color" 
                     value={(selectedEntity as Entity3D).color || '#ffffff'}
                     onChange={e => handleChange('color', e.target.value)}
                     className={`w-full ${mobile ? 'h-14' : 'h-8'} bg-neutral-800 border-none cursor-pointer`}
                   />
                 </div>
                 <div className="space-y-1">
                    <label className="text-xs text-neutral-500">Intensidad</label>
                    <input type="number" step="0.1" value={(selectedEntity as Entity3D).intensity ?? 1} onChange={e => handleChange('intensity', parseFloat(e.target.value))} className={inputClass} />
                 </div>
                 {(selectedEntity.type === 'pointLight' || selectedEntity.type === 'spotLight') && (
                   <div className="space-y-1">
                      <label className="text-xs text-neutral-500">Distancia</label>
                      <input type="number" step="1" value={(selectedEntity as Entity3D).distance ?? 0} onChange={e => handleChange('distance', parseFloat(e.target.value))} className={inputClass} />
                   </div>
                 )}
               </div>
             )}
          </>
        ) : (
          <>
            <div className={`grid ${mobile ? 'grid-cols-1 gap-4' : 'grid-cols-2 gap-2'}`}>
              <div className="space-y-1">
                <label className="text-xs text-neutral-500">X</label>
                <input type="number" value={(selectedEntity as Entity2D).x} onChange={e => handleChange('x', parseFloat(e.target.value))} className={inputClass} />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-neutral-500">Y</label>
                <input type="number" value={(selectedEntity as Entity2D).y} onChange={e => handleChange('y', parseFloat(e.target.value))} className={inputClass} />
              </div>
            </div>
            <div className={`grid ${mobile ? 'grid-cols-1 gap-4' : 'grid-cols-2 gap-2'}`}>
              <div className="space-y-1">
                <label className="text-xs text-neutral-500">Ancho</label>
                <input type="number" value={(selectedEntity as Entity2D).width} onChange={e => handleChange('width', parseFloat(e.target.value))} className={inputClass} />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-neutral-500">Alto</label>
                <input type="number" value={(selectedEntity as Entity2D).height} onChange={e => handleChange('height', parseFloat(e.target.value))} className={inputClass} />
              </div>
            </div>
            {(selectedEntity.type === 'rect') && (
               <div className="space-y-1">
                 <label className="text-xs text-neutral-500">Color (Hex)</label>
                 <input 
                   type="color" 
                   value={(selectedEntity as Entity2D).color || '#ffffff'}
                   onChange={e => handleChange('color', e.target.value)}
                   className={`w-full ${mobile ? 'h-14' : 'h-8'} bg-neutral-800 border-none cursor-pointer`}
                 />
               </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const Vec3Input = ({ mobile, vecClass, label, value, onChange }: { mobile?: boolean, vecClass: string, label: string, value: [number, number, number], onChange: (index: number, val: string) => void }) => (
  <div className="space-y-1">
    <label className="text-xs text-neutral-500">{label}</label>
    <div className={`grid ${mobile ? 'grid-cols-3 gap-2' : 'grid-cols-3 gap-1'}`}>
      <input type="number" step="0.1" value={value[0]} onChange={e => onChange(0, e.target.value)} className={`${vecClass} rounded-l`} />
      <input type="number" step="0.1" value={value[1]} onChange={e => onChange(1, e.target.value)} className={vecClass} />
      <input type="number" step="0.1" value={value[2]} onChange={e => onChange(2, e.target.value)} className={`${vecClass} rounded-r`} />
    </div>
  </div>
);

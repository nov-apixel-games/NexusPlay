import React from 'react';
import { useEditorStore } from './store';

export const PropertiesPanel = () => {
  const { objects, selectedId, updateObject } = useEditorStore();
  const selectedObj = objects.find(o => o.id === selectedId);

  if (!selectedObj) {
    return (
      <div className="w-72 bg-gray-900 border-l border-gray-800 flex flex-col shrink-0 h-full">
        <div className="h-10 bg-gray-800 border-b border-gray-700 flex items-center px-4">
          <h3 className="font-bold text-sm text-gray-200">Propiedades</h3>
        </div>
        <div className="flex-1 p-4 flex items-center justify-center text-gray-500 text-smtext-center">
          Selecciona un objeto para ver sus propiedades
        </div>
      </div>
    );
  }

  const handleChange = (field: string, subField: 'x'|'y'|'z', value: number) => {
    updateObject(selectedId, {
      [field]: { ...(selectedObj as any)[field], [subField]: value }
    });
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateObject(selectedId, { color: e.target.value });
  };

  const handleBiomeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateObject(selectedId, { meta: { ...selectedObj.meta, biome: e.target.value } });
  };

  return (
    <div className="w-72 bg-gray-900 border-l border-gray-800 flex flex-col shrink-0 h-full overflow-hidden text-sm text-gray-300">
      <div className="h-10 bg-gray-800 border-b border-gray-700 flex items-center px-4 shrink-0 justify-between">
        <h3 className="font-bold text-gray-200">Propiedades</h3>
        <span className="text-xs text-gray-500 bg-gray-950 px-2 py-1 rounded">{selectedObj.type}</span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Transform -> Position */}
        <div className="space-y-3">
          <h4 className="font-bold text-gray-400 uppercase text-xs tracking-wider border-b border-gray-800 pb-1">Posición</h4>
          <div className="grid grid-cols-3 gap-2">
            {(['x', 'y', 'z'] as const).map(axis => (
              <div key={axis} className="flex flex-col gap-1">
                <label className="text-xs text-gray-500 uppercase">{axis}</label>
                <input 
                  type="number" 
                  value={Number(selectedObj.position[axis]).toFixed(2)} 
                  onChange={(e) => handleChange('position', axis, parseFloat(e.target.value) || 0)}
                  className="bg-gray-950 border border-gray-800 rounded px-2 py-1 text-gray-300 w-full focus:outline-none focus:border-blue-500"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Transform -> Rotation */}
        <div className="space-y-3">
          <h4 className="font-bold text-gray-400 uppercase text-xs tracking-wider border-b border-gray-800 pb-1">Rotación</h4>
          <div className="grid grid-cols-3 gap-2">
            {(['x', 'y', 'z'] as const).map(axis => (
              <div key={axis} className="flex flex-col gap-1">
                <label className="text-xs text-gray-500 uppercase">{axis}</label>
                <input 
                  type="number" 
                  value={Number(selectedObj.rotation[axis]).toFixed(2)} 
                  onChange={(e) => handleChange('rotation', axis, parseFloat(e.target.value) || 0)}
                  className="bg-gray-950 border border-gray-800 rounded px-2 py-1 text-gray-300 w-full focus:outline-none focus:border-blue-500"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Transform -> Scale */}
        <div className="space-y-3">
          <h4 className="font-bold text-gray-400 uppercase text-xs tracking-wider border-b border-gray-800 pb-1">Escala</h4>
          <div className="grid grid-cols-3 gap-2">
            {(['x', 'y', 'z'] as const).map(axis => (
              <div key={axis} className="flex flex-col gap-1">
                <label className="text-xs text-gray-500 uppercase">{axis}</label>
                <input 
                  type="number" 
                  value={Number(selectedObj.scale[axis]).toFixed(2)} 
                  onChange={(e) => handleChange('scale', axis, parseFloat(e.target.value) || 0)}
                  className="bg-gray-950 border border-gray-800 rounded px-2 py-1 text-gray-300 w-full focus:outline-none focus:border-blue-500"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Appearance */}
        {selectedObj.type !== 'terrain' && (
          <div className="space-y-3">
            <h4 className="font-bold text-gray-400 uppercase text-xs tracking-wider border-b border-gray-800 pb-1">Apariencia</h4>
            <div className="flex items-center gap-3">
              <label className="text-gray-400">Color</label>
              <input 
                type="color" 
                value={selectedObj.color || '#ffffff'}
                onChange={handleColorChange}
                className="bg-transparent border-0 w-8 h-8 rounded cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* Terrain Specific */}
        {selectedObj.type === 'terrain' && (
          <div className="space-y-3">
            <h4 className="font-bold text-gray-400 uppercase text-xs tracking-wider border-b border-gray-800 pb-1">Configuración Terreno</h4>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Bioma</label>
              <select 
                value={selectedObj.meta?.biome || 'forest'} 
                onChange={handleBiomeChange}
                className="bg-gray-950 border border-gray-800 rounded px-2 py-1 text-gray-300 w-full focus:outline-none focus:border-blue-500"
              >
                <option value="forest">Bosque</option>
                <option value="desert">Desierto</option>
                <option value="snow">Nieve</option>
                <option value="city">Ciudad / Concreto</option>
              </select>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

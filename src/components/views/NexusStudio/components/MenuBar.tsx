import React from 'react';
import { useStudioStore } from '../store/useStudioStore';

export const MenuBar = () => {
  const projectName = useStudioStore(s => s.projectName);
  const engineMode = useStudioStore(s => s.engineMode);
  
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-neutral-900 border-b border-neutral-800 text-sm">
      <div className="flex items-center gap-6">
        <div className="font-bold text-white flex items-center gap-2">
          <span className="text-blue-500">NEXUS</span>
          <span>STUDIO</span>
        </div>
        <div className="flex gap-4 text-neutral-300">
          <button className="hover:text-white">Archivo</button>
          <button className="hover:text-white">Editar</button>
          <button className="hover:text-white">Ver</button>
          <button className="hover:text-white">Proyecto</button>
          <button className="hover:text-white">Herramientas</button>
          <button className="hover:text-white">Ventana</button>
          <button className="hover:text-white">Ayuda</button>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-neutral-400">{projectName} ({engineMode})</span>
      </div>
    </div>
  );
};

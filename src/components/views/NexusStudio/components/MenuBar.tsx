import { useAppStore } from '../../../../store/useAppStore';
import React from 'react';
import { useStudioStore } from '../store/useStudioStore';

export const MenuBar = () => {
  const { t } = useAppStore();

  const projectName = useStudioStore(s => s.projectName);
  const engineMode = useStudioStore(s => s.engineMode);
  
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-neutral-900 border-b border-neutral-800 text-sm">
      <div className="flex items-center gap-6">
        <div className="font-bold text-nexus-text flex items-center gap-2">
          <span className="text-blue-500">NEXUS</span>
          <span>STUDIO</span>
        </div>
        <div className="flex gap-4 text-neutral-300">
          <button className="hover:text-nexus-text">Archivo</button>
          <button className="hover:text-nexus-text">{t('profile.edit')}</button>
          <button className="hover:text-nexus-text">Ver</button>
          <button className="hover:text-nexus-text">Proyecto</button>
          <button className="hover:text-nexus-text">Herramientas</button>
          <button className="hover:text-nexus-text">Ventana</button>
          <button className="hover:text-nexus-text">Ayuda</button>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-neutral-400">{projectName} ({engineMode})</span>
      </div>
    </div>
  );
};

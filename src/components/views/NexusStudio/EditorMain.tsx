import React, { useEffect } from 'react';
import { Toolbar } from './Toolbar';
import { SceneCanvas } from './sceneCanvas';
import { ExplorerPanel } from './ExplorerPanel';
import { PropertiesPanel } from './PropertiesPanel';
import { useEditorStore } from './store';
import { SceneObject } from './editorTypes';

export interface Editor3DProps {
  initialTemplate?: string | null;
  draftId?: string | null;
  onBack: () => void;
}

export function NexusStudio3D({ initialTemplate, draftId, onBack }: Editor3DProps) {
  const { loadProject, addObject } = useEditorStore();
  const [showExplorer, setShowExplorer] = React.useState(false);
  const [showProps, setShowProps] = React.useState(false);

  useEffect(() => {
    // Si viene draftId cargamos desde supabaseSync, si no, template
    if (initialTemplate === 'Racing 3D') {
      loadProject([
         { id: '1', type: 'terrain', name: 'Pista', position: { x: 0, y: -0.5, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 100, y: 1, z: 100 }, color: '#333333', visible: true, meta: { biome: 'city' } },
         { id: '2', type: 'vehicle', name: 'Auto', position: { x: 0, y: 0.5, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 }, color: '#3b82f6', visible: true }
      ]);
    } else if (initialTemplate === 'Platformer 3D') {
      loadProject([
         { id: '1', type: 'terrain', name: 'Isla', position: { x: 0, y: -0.5, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 30, y: 1, z: 30 }, visible: true, meta: { biome: 'forest' } },
         { id: '2', type: 'character', name: 'Héroe', position: { x: 0, y: 0.5, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 }, visible: true },
         { id: '3', type: 'tree', name: 'Árbol 1', position: { x: 5, y: 0, z: 5 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 }, visible: true }
      ]);
    } else {
      // Default empty/basic
      loadProject([
         { id: '1', type: 'terrain', name: 'Baseplate', position: { x: 0, y: -0.5, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 50, y: 1, z: 50 }, visible: true, meta: { biome: 'forest' } },
      ]);
    }
  }, [initialTemplate, draftId, loadProject]);

  return (
    <div className="fixed inset-0 z-50 bg-[#0f1115] w-screen h-screen flex flex-col font-sans overflow-hidden">
      <Toolbar projectId={draftId} onExit={onBack} />
      
      {/* Mobile panel toggles */}
      <div className="md:hidden flex bg-gray-900 border-b border-gray-800 text-xs">
         <button onClick={() => {setShowExplorer(!showExplorer); setShowProps(false)}} className={`flex-1 py-2 ${showExplorer ? 'bg-blue-600' : 'bg-gray-800'}`}>Explorador</button>
         <button onClick={() => {setShowProps(!showProps); setShowExplorer(false)}} className={`flex-1 py-2 ${showProps ? 'bg-blue-600' : 'bg-gray-800'}`}>Propiedades</button>
      </div>

      <div className="flex flex-1 w-full h-full overflow-hidden relative">
        {/* Sidebar Left: Explorer */}
        <div className={`md:block absolute md:relative z-10 h-full ${showExplorer ? 'block' : 'hidden'}`}>
          <ExplorerPanel />
        </div>
        
        {/* Scene */}
        <SceneCanvas />
        
        {/* Sidebar Right: properties */}
        <div className={`md:block absolute md:relative right-0 z-10 h-full ${showProps ? 'block' : 'hidden'}`}>
          <PropertiesPanel />
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { useEditorStore } from './store';
import { Box, Circle, Pyramid, Type, Image as ImageIcon, Map } from 'lucide-react';
import { ObjectType } from './editorTypes';

const TypeIcon = ({ type }: { type: ObjectType }) => {
  switch (type) {
    case 'box': return <Box size={14} className="text-blue-400" />;
    case 'sphere': return <Circle size={14} className="text-red-400" />;
    case 'cylinder': return <Pyramid size={14} className="text-yellow-400" />;
    case 'terrain': return <Map size={14} className="text-green-400" />;
    default: return <Box size={14} />;
  }
};

export const ExplorerPanel = () => {
  const { objects, selectedId, setSelectedId } = useEditorStore();

  return (
    <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0 h-full overflow-hidden">
      <div className="h-10 bg-gray-800 border-b border-gray-700 flex items-center px-4 shrink-0">
        <h3 className="font-bold text-sm text-gray-200">Explorador (Escena)</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {objects.map((obj) => (
          <div
            key={obj.id}
            onClick={() => setSelectedId(obj.id)}
            className={`flex items-center gap-2 p-2 rounded cursor-pointer text-sm ${
              selectedId === obj.id ? 'bg-blue-600/20 border border-blue-500/50 text-blue-300' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
            }`}
          >
            <TypeIcon type={obj.type} />
            <span className="truncate flex-1">{obj.name}</span>
          </div>
        ))}
        {objects.length === 0 && (
          <div className="text-center text-gray-600 text-sm mt-10">La escena está vacía</div>
        )}
      </div>
    </div>
  );
};

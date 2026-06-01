import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export type EngineMode = '2D' | '3D';
export type AppState = 'edit' | 'play';
export type ToolModes = 'select' | 'translate' | 'rotate' | 'scale';

export interface BaseEntity {
  id: string;
  name: string;
  type: string;
  visible: boolean;
  locked: boolean;
}

export interface Entity3D extends BaseEntity {
  is3D: true;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  modelUrl?: string;
  color?: string;
  roughness?: number;
  metalness?: number;
  opacity?: number;
  emission?: string;
}

export interface Entity2D extends BaseEntity {
  is3D: false;
  x: number;
  y: number;
  width: number;
  height: number;
  spriteUrl?: string;
  color?: string;
}

export type Entity = Entity3D | Entity2D;

interface ProjectMetadata {
  projectName: string;
  version: string;
}

interface StudioState {
  projectName: string;
  engineMode: EngineMode;
  appState: AppState;
  entities: Entity[];
  scripts: string;
  selectedEntityId: string | null;
  toolMode: ToolModes;
  
  // Actions
  setEngineMode: (mode: EngineMode) => void;
  setAppState: (state: AppState) => void;
  setScripts: (code: string) => void;
  setToolMode: (mode: ToolModes) => void;
  addEntity: (entity: Omit<Entity, 'id'>) => void;
  removeEntity: (id: string) => void;
  updateEntity: (id: string, updates: Partial<Entity>) => void;
  selectEntity: (id: string | null) => void;
  loadProject: (json: string) => void;
  exportProject: () => void;
  saveLocal: () => void;
  loadLocal: () => void;
}

export const useStudioStore = create<StudioState>((set, get) => ({
  projectName: 'My First Game',
  engineMode: '3D',
  appState: 'edit',
  entities: [],
  scripts: "// Escribe tus scripts aquí\nfunction setup() {\n  // Lógica de inicio\n}\n\nfunction update(dt) {\n  // Lógica por frame\n}",
  selectedEntityId: null,
  toolMode: 'translate',
  
  setEngineMode: (mode) => set({ engineMode: mode, entities: [], selectedEntityId: null }),
  setAppState: (state) => set({ appState: state }),
  setScripts: (code) => set({ scripts: code }),
  setToolMode: (mode) => set({ toolMode: mode }),
  
  addEntity: (entityData) => set((state) => {
    const newEntity = { ...entityData, id: uuidv4() } as Entity;
    return { entities: [...state.entities, newEntity], selectedEntityId: newEntity.id };
  }),
  
  removeEntity: (id) => set((state) => ({
    entities: state.entities.filter(e => e.id !== id),
    selectedEntityId: state.selectedEntityId === id ? null : state.selectedEntityId
  })),
  
  updateEntity: (id, updates) => set((state) => ({
    entities: state.entities.map(e => e.id === id ? { ...e, ...updates } as Entity : e)
  })),
  
  selectEntity: (id) => set({ selectedEntityId: id }),
  
  loadProject: (jsonStr) => {
    try {
      const data = JSON.parse(jsonStr);
      set({
        projectName: data.projectName || 'My First Game',
        engineMode: data.engineMode || '3D',
        entities: data.entities || []
      });
    } catch(e) { console.error('Failed to parse project'); }
  },
  
  exportProject: () => {
    const state = get();
    const projectData = {
       projectName: state.projectName,
       engineMode: state.engineMode,
       entities: state.entities,
       version: '1.0.0'
    };
    const jsonStr = JSON.stringify(projectData, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nexus_project_${state.projectName.replace(/\s+/g, '_').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },
  saveLocal: () => {
    const state = get();
    localStorage.setItem('nexus_studio_autosave', JSON.stringify({
       projectName: state.projectName,
       engineMode: state.engineMode,
       entities: state.entities,
    }));
  },
  loadLocal: () => {
    const dataStr = localStorage.getItem('nexus_studio_autosave');
    if (dataStr) {
      get().loadProject(dataStr);
    }
  }
}));

// Quick patch for get() access
useStudioStore.setState = (newVal) => {
  // handled natively by zustand via useStudioStore.setState
};

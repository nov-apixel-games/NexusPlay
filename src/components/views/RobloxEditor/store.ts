import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { RobloxEditorState, SceneObject } from './editorTypes';

export const useEditorStore = create<RobloxEditorState>((set, get) => ({
  objects: [],
  selectedId: null,
  transformMode: 'translate',
  isDragging: false,

  addObject: (obj) => {
    const newObj = { ...obj, id: uuidv4() };
    set((state) => ({ objects: [...state.objects, newObj], selectedId: newObj.id }));
  },

  updateObject: (id, updates) => {
    set((state) => ({
      objects: state.objects.map((obj) => (obj.id === id ? { ...obj, ...updates } : obj)),
    }));
  },

  removeObject: (id) => {
    set((state) => ({
      objects: state.objects.filter((obj) => obj.id !== id),
      selectedId: state.selectedId === id ? null : state.selectedId,
    }));
  },

  duplicateObject: (id) => {
    set((state) => {
      const objToCopy = state.objects.find((o) => o.id === id);
      if (!objToCopy) return state;
      const newObj = { 
        ...objToCopy, 
        id: uuidv4(), 
        name: objToCopy.name + ' (Copia)',
        position: { ...objToCopy.position, x: objToCopy.position.x + 2 } 
      };
      return { objects: [...state.objects, newObj], selectedId: newObj.id };
    });
  },

  setSelectedId: (id) => set({ selectedId: id }),

  setTransformMode: (mode) => set({ transformMode: mode }),

  setIsDragging: (isDragging) => set({ isDragging }),

  loadProject: (projectData) => set({ objects: projectData, selectedId: null }),
}));

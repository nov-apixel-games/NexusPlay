import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { RobloxEditorState, SceneObject } from './editorTypes';

export const useEditorStore = create<RobloxEditorState>((set, get) => ({
  objects: [],
  selectedId: null,
  transformMode: 'translate',

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

  setSelectedId: (id) => set({ selectedId: id }),

  setTransformMode: (mode) => set({ transformMode: mode }),

  loadProject: (projectData) => set({ objects: projectData, selectedId: null }),
}));

import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import * as idb from "idb-keyval";
import { BuiltInAsset } from "../components/BottomPanel";

export type EngineMode = "2D" | "3D";
export type AppState = "edit" | "play";
export type ToolModes = "select" | "translate" | "rotate" | "scale";

export interface BaseEntity {
  id: string;
  sceneId: string;
  name: string;
  type: string;
  visible: boolean;
  locked: boolean;
  components?: Record<string, any>;
  assetType?: string; // 'character', 'weapon', 'nature', 'building', 'prop'
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
  normalMap?: string;
  // Light properties
  intensity?: number;
  distance?: number;
  angle?: number;
  penumbra?: number;
  decay?: number;
  castShadow?: boolean;
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

export interface BuiltInAsset {
  id: string;
  name: string;
  category: string;
  thumbnail: string;
  modelUrl?: string;
  polyCount?: number;
  optimizedForMobile?: boolean;
  tags?: string[];
  type: string;
  assetType?: string;
  props?: any;
  fileSize?: string;
  file?: File;
}

export type Entity = Entity3D | Entity2D;

export interface Scene {
  id: string;
  name: string;
}

interface ProjectMetadata {
  projectName: string;
  version: string;
}

interface StudioState {
  projectName: string;
  engineMode: EngineMode;
  appState: AppState;
  scenes: Scene[];
  activeSceneId: string;
  entities: Entity[];
  scripts: string;
  selectedEntityId: string | null;
  toolMode: ToolModes;
  customAssets: BuiltInAsset[];

  // Actions
  setEngineMode: (mode: EngineMode) => void;
  setAppState: (state: AppState) => void;
  setScripts: (code: string) => void;
  setToolMode: (mode: ToolModes) => void;
  addEntity: (entity: any) => void;
  removeEntity: (id: string) => void;
  updateEntity: (id: string, updates: Partial<Entity>) => void;
  selectEntity: (id: string | null) => void;
  loadProject: (json: string) => void;
  exportProject: () => void;
  saveLocal: () => void;
  loadLocal: () => void;
  addCustomAsset: (asset: BuiltInAsset) => void;
  loadCustomAssets: () => Promise<void>;
  activeMobilePanel:
    | "explorer"
    | "inspector"
    | "scripts"
    | "assets"
    | "console"
    | "ai"
    | "menu"
    | null;
  setActiveMobilePanel: (
    panel:
      | "explorer"
      | "inspector"
      | "scripts"
      | "assets"
      | "console"
      | "ai"
      | "menu"
      | null,
  ) => void;
  // Scene Actions
  addScene: (name: string) => void;
  removeScene: (id: string) => void;
  duplicateScene: (id: string) => void;
  renameScene: (id: string, newName: string) => void;
  setActiveScene: (id: string) => void;
}

export const useStudioStore = create<StudioState>((set, get) => ({
  projectName: "My First Game",
  engineMode: "3D",
  appState: "edit",
  scenes: [{ id: "scene-1", name: "Main Scene" }],
  activeSceneId: "scene-1",
  entities: [],
  scripts:
    "// Escribe tus scripts aquí\nfunction setup() {\n  // Lógica de inicio\n}\n\nfunction update(dt) {\n  // Lógica por frame\n}",
  selectedEntityId: null,
  toolMode: "translate",
  activeMobilePanel: null,
  customAssets: [],

  setEngineMode: (mode) =>
    set({ engineMode: mode, entities: [], selectedEntityId: null }),
  setAppState: (state) => set({ appState: state }),
  setScripts: (code) => set({ scripts: code }),
  setToolMode: (mode) => set({ toolMode: mode }),
  setActiveMobilePanel: (panel) => set({ activeMobilePanel: panel }),

  addScene: (name) =>
    set((state) => {
      const newScene = { id: uuidv4(), name };
      return {
        scenes: [...state.scenes, newScene],
        activeSceneId: newScene.id,
      };
    }),
  removeScene: (id) =>
    set((state) => ({
      scenes: state.scenes.filter((s) => s.id !== id),
      activeSceneId:
        state.activeSceneId === id
          ? state.scenes.find((s) => s.id !== id)?.id || ""
          : state.activeSceneId,
      entities: state.entities.filter((e) => e.sceneId !== id),
    })),
  duplicateScene: (id) =>
    set((state) => {
      const sceneToClone = state.scenes.find((s) => s.id === id);
      if (!sceneToClone) return state;
      const newSceneId = uuidv4();
      const newScene = { id: newSceneId, name: `${sceneToClone.name} Copy` };
      const entitiesToClone = state.entities
        .filter((e) => e.sceneId === id)
        .map((e) => ({ ...e, id: uuidv4(), sceneId: newSceneId }));
      return {
        scenes: [...state.scenes, newScene],
        entities: [...state.entities, ...entitiesToClone],
      };
    }),
  renameScene: (id, newName) =>
    set((state) => ({
      scenes: state.scenes.map((s) =>
        s.id === id ? { ...s, name: newName } : s,
      ),
    })),
  setActiveScene: (id) => set({ activeSceneId: id }),

  addEntity: (entityData) =>
    set((state) => {
      const newEntity = {
        ...entityData,
        id: uuidv4(),
        sceneId: state.activeSceneId,
      } as Entity;
      return {
        entities: [...state.entities, newEntity],
        selectedEntityId: newEntity.id,
      };
    }),

  removeEntity: (id) =>
    set((state) => ({
      entities: state.entities.filter((e) => e.id !== id),
      selectedEntityId:
        state.selectedEntityId === id ? null : state.selectedEntityId,
    })),

  updateEntity: (id, updates) =>
    set((state) => ({
      entities: state.entities.map((e) =>
        e.id === id ? ({ ...e, ...updates } as Entity) : e,
      ),
    })),

  selectEntity: (id) => set({ selectedEntityId: id }),

  loadProject: (jsonStr) => {
    try {
      const data = JSON.parse(jsonStr);
      set({
        projectName: data.projectName || "My First Game",
        engineMode: data.engineMode || "3D",
        scenes: data.scenes || [{ id: "scene-1", name: "Main Scene" }],
        activeSceneId:
          data.activeSceneId || (data.scenes ? data.scenes[0].id : "scene-1"),
        entities: data.entities || [],
      });
    } catch (e) {
      console.error("Failed to parse project");
    }
  },

  exportProject: () => {
    const state = get();
    const projectData = {
      projectName: state.projectName,
      engineMode: state.engineMode,
      scenes: state.scenes,
      activeSceneId: state.activeSceneId,
      entities: state.entities,
      version: "1.0.0",
    };
    const jsonStr = JSON.stringify(projectData, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nexus_project_${state.projectName.replace(/\s+/g, "_").toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },
  saveLocal: () => {
    const state = get();
    localStorage.setItem(
      "nexus_studio_autosave",
      JSON.stringify({
        projectName: state.projectName,
        engineMode: state.engineMode,
        scenes: state.scenes,
        activeSceneId: state.activeSceneId,
        entities: state.entities,
      }),
    );
  },
  loadLocal: () => {
    const dataStr = localStorage.getItem("nexus_studio_autosave");
    if (dataStr) {
      get().loadProject(dataStr);
    }
  },
  addCustomAsset: async (asset) => {
    set((state) => ({ customAssets: [...state.customAssets, asset] }));
    const currentState = get().customAssets;
    try {
      await idb.set("nexus_custom_assets", currentState);
    } catch (e) {
      console.error("Failed to save to idb", e);
    }
  },
  loadCustomAssets: async () => {
    try {
      const savedAssets = await idb.get<BuiltInAsset[]>("nexus_custom_assets");
      if (savedAssets) {
        // Because File and Blob can't natively keep object URLs on reload,
        // we might need to recreate URLs if they are stored as raw Blobs/Files in indexedDb.
        // idb-keyval supports storing raw File/Blob objects natively!
        const restoredAssets = savedAssets.map((asset) => {
          if (asset.file) {
            const url = URL.createObjectURL(asset.file);
            return { ...asset, modelUrl: url, thumbnail: url };
          }
          return asset;
        });
        set({ customAssets: restoredAssets });
      }
    } catch (e) {
      console.error("Failed to load custom assets", e);
    }
  },
}));

// Quick patch for get() access
useStudioStore.setState = (newVal) => {
  // handled natively by zustand via useStudioStore.setState
};

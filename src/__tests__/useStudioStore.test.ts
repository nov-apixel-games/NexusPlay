import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock external deps before importing the store
vi.mock('uuid', () => ({
  v4: () => `mock-uuid-${Math.random().toString(36).slice(2, 10)}`,
}));

vi.mock('idb-keyval', () => ({
  get: vi.fn().mockResolvedValue(null),
  set: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../../../lib/supabase', () => ({
  supabase: {
    auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null } }) },
    from: () => ({
      insert: vi.fn().mockResolvedValue({ error: null }),
      delete: () => ({ eq: () => ({ eq: vi.fn().mockResolvedValue({ error: null }) }) }),
      select: () => ({ eq: vi.fn().mockResolvedValue({ data: [], error: null }) }),
    }),
  },
  isSupabaseConfigured: false,
}));

import { useStudioStore } from '../components/views/NexusStudio/store/useStudioStore';

describe('useStudioStore', () => {
  // The store overrides setState with a no-op, so we use its own actions to reset
  function resetStore() {
    const store = useStudioStore.getState();
    store.loadProject(JSON.stringify({
      projectName: 'My First Game',
      engineMode: '3D',
      scenes: [{ id: 'scene-1', name: 'Main Scene' }],
      activeSceneId: 'scene-1',
      entities: [],
    }));
    store.setScripts('// default');
    store.selectEntity(null);
    store.setToolMode('translate');
    store.setActiveMobilePanel(null);
    store.setAppState('edit');
  }

  beforeEach(() => {
    resetStore();
  });

  describe('scenes', () => {
    it('starts with a default scene', () => {
      const state = useStudioStore.getState();
      expect(state.scenes).toHaveLength(1);
      expect(state.scenes[0].name).toBe('Main Scene');
      expect(state.activeSceneId).toBe('scene-1');
    });

    it('addScene appends a new scene and sets it active', () => {
      useStudioStore.getState().addScene('Level 2');
      const state = useStudioStore.getState();
      expect(state.scenes).toHaveLength(2);
      expect(state.scenes[1].name).toBe('Level 2');
      expect(state.activeSceneId).toBe(state.scenes[1].id);
    });

    it('removeScene removes the scene and its entities', () => {
      useStudioStore.getState().addScene('Level 2');
      const newSceneId = useStudioStore.getState().scenes[1].id;

      // Add entity to new scene
      useStudioStore.getState().addEntity({
        name: 'Cube',
        type: 'mesh',
        is3D: true,
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        visible: true,
        locked: false,
      });

      // Switch to original scene and add entity there
      useStudioStore.getState().setActiveScene('scene-1');
      useStudioStore.getState().addEntity({
        name: 'Sphere',
        type: 'mesh',
        is3D: true,
        position: [1, 1, 1],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        visible: true,
        locked: false,
      });

      // Remove new scene
      useStudioStore.getState().removeScene(newSceneId);
      const state = useStudioStore.getState();
      expect(state.scenes).toHaveLength(1);
      expect(state.scenes[0].id).toBe('scene-1');
      // Only original scene entity remains
      expect(state.entities).toHaveLength(1);
      expect(state.entities[0].name).toBe('Sphere');
    });

    it('duplicateScene clones scene and its entities', () => {
      useStudioStore.getState().addEntity({
        name: 'Cube',
        type: 'mesh',
        is3D: true,
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        visible: true,
        locked: false,
      });

      useStudioStore.getState().duplicateScene('scene-1');
      const state = useStudioStore.getState();
      expect(state.scenes).toHaveLength(2);
      expect(state.scenes[1].name).toBe('Main Scene Copy');
      // Original + cloned entity
      expect(state.entities).toHaveLength(2);
      expect(state.entities[1].sceneId).toBe(state.scenes[1].id);
      // Different IDs
      expect(state.entities[0].id).not.toBe(state.entities[1].id);
    });

    it('renameScene updates the scene name', () => {
      useStudioStore.getState().renameScene('scene-1', 'Renamed');
      expect(useStudioStore.getState().scenes[0].name).toBe('Renamed');
    });

    it('setActiveScene changes active scene', () => {
      useStudioStore.getState().addScene('Level 2');
      useStudioStore.getState().setActiveScene('scene-1');
      expect(useStudioStore.getState().activeSceneId).toBe('scene-1');
    });
  });

  describe('entities', () => {
    it('addEntity adds to the active scene and selects it', () => {
      useStudioStore.getState().addEntity({
        name: 'Cube',
        type: 'mesh',
        is3D: true,
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        visible: true,
        locked: false,
      });

      const state = useStudioStore.getState();
      expect(state.entities).toHaveLength(1);
      expect(state.entities[0].name).toBe('Cube');
      expect(state.entities[0].sceneId).toBe('scene-1');
      expect(state.selectedEntityId).toBe(state.entities[0].id);
    });

    it('removeEntity removes the entity and clears selection if selected', () => {
      useStudioStore.getState().addEntity({
        name: 'Cube',
        type: 'mesh',
        is3D: true,
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        visible: true,
        locked: false,
      });

      const entityId = useStudioStore.getState().entities[0].id;
      useStudioStore.getState().removeEntity(entityId);
      const state = useStudioStore.getState();
      expect(state.entities).toHaveLength(0);
      expect(state.selectedEntityId).toBeNull();
    });

    it('updateEntity merges partial updates', () => {
      useStudioStore.getState().addEntity({
        name: 'Cube',
        type: 'mesh',
        is3D: true,
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        visible: true,
        locked: false,
      });

      const entityId = useStudioStore.getState().entities[0].id;
      useStudioStore.getState().updateEntity(entityId, { name: 'Updated Cube', visible: false });
      const entity = useStudioStore.getState().entities[0];
      expect(entity.name).toBe('Updated Cube');
      expect(entity.visible).toBe(false);
      expect(entity.type).toBe('mesh');
    });

    it('selectEntity updates selectedEntityId', () => {
      useStudioStore.getState().addEntity({
        name: 'Cube',
        type: 'mesh',
        is3D: true,
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        visible: true,
        locked: false,
      });

      const entityId = useStudioStore.getState().entities[0].id;
      useStudioStore.getState().selectEntity(null);
      expect(useStudioStore.getState().selectedEntityId).toBeNull();
      useStudioStore.getState().selectEntity(entityId);
      expect(useStudioStore.getState().selectedEntityId).toBe(entityId);
    });
  });

  describe('mode setters', () => {
    it('setEngineMode clears entities and selection', () => {
      useStudioStore.getState().addEntity({
        name: 'Cube',
        type: 'mesh',
        is3D: true,
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        visible: true,
        locked: false,
      });

      useStudioStore.getState().setEngineMode('2D');
      const state = useStudioStore.getState();
      expect(state.engineMode).toBe('2D');
      expect(state.entities).toHaveLength(0);
      expect(state.selectedEntityId).toBeNull();
    });

    it('setAppState toggles between edit and play', () => {
      useStudioStore.getState().setAppState('play');
      expect(useStudioStore.getState().appState).toBe('play');
      useStudioStore.getState().setAppState('edit');
      expect(useStudioStore.getState().appState).toBe('edit');
    });

    it('setToolMode changes tool mode', () => {
      useStudioStore.getState().setToolMode('rotate');
      expect(useStudioStore.getState().toolMode).toBe('rotate');
    });

    it('setScripts updates scripts', () => {
      useStudioStore.getState().setScripts('console.log("test")');
      expect(useStudioStore.getState().scripts).toBe('console.log("test")');
    });

    it('setActiveMobilePanel updates panel', () => {
      useStudioStore.getState().setActiveMobilePanel('inspector');
      expect(useStudioStore.getState().activeMobilePanel).toBe('inspector');
      useStudioStore.getState().setActiveMobilePanel(null);
      expect(useStudioStore.getState().activeMobilePanel).toBeNull();
    });
  });

  describe('project serialization', () => {
    it('loadProject restores state from JSON', () => {
      const projectJson = JSON.stringify({
        projectName: 'Test Project',
        engineMode: '2D',
        scenes: [{ id: 's1', name: 'Scene A' }, { id: 's2', name: 'Scene B' }],
        activeSceneId: 's2',
        entities: [
          { id: 'e1', sceneId: 's1', name: 'Entity1', type: 'sprite', is3D: false, x: 0, y: 0, width: 50, height: 50, visible: true, locked: false },
        ],
      });

      useStudioStore.getState().loadProject(projectJson);
      const state = useStudioStore.getState();
      expect(state.projectName).toBe('Test Project');
      expect(state.engineMode).toBe('2D');
      expect(state.scenes).toHaveLength(2);
      expect(state.activeSceneId).toBe('s2');
      expect(state.entities).toHaveLength(1);
    });

    it('loadProject handles invalid JSON gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      useStudioStore.getState().loadProject('not valid json');
      // State unchanged
      expect(useStudioStore.getState().projectName).toBe('My First Game');
      consoleSpy.mockRestore();
    });

    it('loadProject uses defaults for missing fields', () => {
      useStudioStore.getState().loadProject('{}');
      const state = useStudioStore.getState();
      expect(state.projectName).toBe('My First Game');
      expect(state.engineMode).toBe('3D');
      expect(state.entities).toHaveLength(0);
    });

    it('saveLocal persists to localStorage', () => {
      useStudioStore.getState().addEntity({
        name: 'Cube',
        type: 'mesh',
        is3D: true,
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        visible: true,
        locked: false,
      });

      useStudioStore.getState().saveLocal();
      const saved = localStorage.getItem('nexus_studio_autosave');
      expect(saved).not.toBeNull();
      const parsed = JSON.parse(saved!);
      expect(parsed.entities).toHaveLength(1);
      expect(parsed.entities[0].name).toBe('Cube');
    });

    it('loadLocal restores from localStorage', () => {
      const data = {
        projectName: 'Saved Game',
        engineMode: '2D',
        scenes: [{ id: 'saved-1', name: 'Saved Scene' }],
        activeSceneId: 'saved-1',
        entities: [],
      };
      localStorage.setItem('nexus_studio_autosave', JSON.stringify(data));

      useStudioStore.getState().loadLocal();
      expect(useStudioStore.getState().projectName).toBe('Saved Game');
      expect(useStudioStore.getState().engineMode).toBe('2D');
    });
  });
});

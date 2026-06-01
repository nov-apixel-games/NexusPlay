export type TransformMode = 'translate' | 'rotate' | 'scale';

export interface Vector3State {
  x: number;
  y: number;
  z: number;
}

export interface EulerState {
  x: number;
  y: number;
  z: number;
}

export type ObjectType = 'box' | 'sphere' | 'cylinder' | 'terrain' | 'character' | 'tree' | 'house' | 'vehicle';

export interface SceneObject {
  id: string;
  type: ObjectType;
  name: string;
  position: Vector3State;
  rotation: EulerState;
  scale: Vector3State;
  color?: string;
  visible: boolean;
  // Metadata for specific types (e.g. terrain biome, etc)
  meta?: any;
}

export interface NexusStudioState {
  objects: SceneObject[];
  selectedId: string | null;
  transformMode: TransformMode;
  isDragging: boolean;
  addObject: (obj: Omit<SceneObject, 'id'>) => void;
  updateObject: (id: string, updates: Partial<SceneObject>) => void;
  removeObject: (id: string) => void;
  duplicateObject: (id: string) => void;
  setSelectedId: (id: string | null) => void;
  setTransformMode: (mode: TransformMode) => void;
  setIsDragging: (isDragging: boolean) => void;
  loadProject: (projectData: SceneObject[]) => void;
}

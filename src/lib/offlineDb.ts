const DB_NAME = 'NexusPlayOffline';
const DB_VERSION = 1;

export interface OfflineGame {
  id: string;
  title: string;
  developer: string;
  category: string;
  rating: number;
  icon?: string;
  lastPlayed?: string;
  playCount?: number;
}

export interface GameDraft {
  id: string;
  title: string;
  objects: any[];
  updatedAt: string;
}

export function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('[IndexedDB] Error abriendo la db offline');
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = request.result;
      
      // Store for recent and favorite games
      if (!db.objectStoreNames.contains('games')) {
        db.createObjectStore('games', { keyPath: 'id' });
      }

      // Store for Game Studio project drafts created locally
      if (!db.objectStoreNames.contains('drafts')) {
        db.createObjectStore('drafts', { keyPath: 'id' });
      }

      // Store for system configurations/cache
      if (!db.objectStoreNames.contains('config')) {
        db.createObjectStore('config', { keyPath: 'key' });
      }
    };
  });
}

// Games Cache Support
export async function saveOfflineGame(game: OfflineGame): Promise<void> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('games', 'readwrite');
      const store = transaction.objectStore('games');
      const request = store.put(game);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error('[IndexedDB] No se pudo guardar el juego offline:', e);
  }
}

export async function getOfflineGames(): Promise<OfflineGame[]> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('games', 'readonly');
      const store = transaction.objectStore('games');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error('[IndexedDB] No se pudo leer juegos cached:', e);
    return [];
  }
}

export async function deleteOfflineGame(id: string): Promise<void> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('games', 'readwrite');
      const store = transaction.objectStore('games');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error('[IndexedDB] Error eliminando juego offline:', e);
  }
}

// Game Studio drafts/projects support
export async function saveGameDraft(draft: GameDraft): Promise<void> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('drafts', 'readwrite');
      const store = transaction.objectStore('drafts');
      const request = store.put(draft);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error('[IndexedDB] No se pudo guardar borrador del juego:', e);
  }
}

export async function getGameDrafts(): Promise<GameDraft[]> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('drafts', 'readonly');
      const store = transaction.objectStore('drafts');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error('[IndexedDB] No se pudieron leer borradores:', e);
    return [];
  }
}

export async function deleteGameDraft(id: string): Promise<void> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('drafts', 'readwrite');
      const store = transaction.objectStore('drafts');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error('[IndexedDB] Error eliminando borrador:', e);
  }
}

// Local Configurations
export async function setLocalConfig(key: string, value: any): Promise<void> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('config', 'readwrite');
      const store = transaction.objectStore('config');
      const request = store.put({ key, value });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error('[IndexedDB] No se pudo guardar config:', e);
  }
}

export async function getLocalConfig(key: string): Promise<any> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('config', 'readonly');
      const store = transaction.objectStore('config');
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result?.value ?? null);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.warn('[IndexedDB] No se pudo leer config:', key, e);
    return null;
  }
}

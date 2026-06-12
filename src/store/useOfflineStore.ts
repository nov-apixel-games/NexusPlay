import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppItem } from '../types';

export interface OfflineApp extends AppItem {
  downloadedAt: string;
  sizeBytes: number;
}

interface OfflineState {
  offlineApps: Record<string, OfflineApp>;
  downloadingAppIds: string[];
  saveOffline: (app: AppItem) => Promise<void>;
  removeOffline: (appId: string) => Promise<void>;
}

export const useOfflineStore = create<OfflineState>()(
  persist(
    (set, get) => ({
      offlineApps: {},
      downloadingAppIds: [],

      saveOffline: async (app: AppItem) => {
        set((state) => ({ downloadingAppIds: [...state.downloadingAppIds, app.id] }));

        try {
          const cache = await caches.open('nexus-offline-apps-v1');
          
          let sizeBytes = 0;
          const urlsToCache = [];
          
          if (app.downloadUrl) {
            urlsToCache.push(app.downloadUrl);
            const res = await fetch(app.downloadUrl);
            const html = await res.text();
            sizeBytes += html.length;
            
            // Extract some basic resources (js, css) from simple HTML
            const scriptMatches = html.matchAll(/<script[^>]+src=["']([^"']+)["']/g);
            for (const match of scriptMatches) {
               let url = match[1];
               if (!url.startsWith('http')) url = new URL(url, app.downloadUrl).href;
               urlsToCache.push(url);
            }
            const linkMatches = html.matchAll(/<link[^>]+href=["']([^"']+)["']/g);
            for (const match of linkMatches) {
               let url = match[1];
               if (!url.startsWith('http')) url = new URL(url, app.downloadUrl).href;
               urlsToCache.push(url);
            }
            const imgMatches = html.matchAll(/<img[^>]+src=["']([^"']+)["']/g);
            for (const match of imgMatches) {
               let url = match[1];
               if (!url.startsWith('http')) url = new URL(url, app.downloadUrl).href;
               urlsToCache.push(url);
            }
          }
          
          if (app.icon) urlsToCache.push(app.icon);
          if (app.screenshots) {
            app.screenshots.forEach(s => urlsToCache.push(s));
          }
          
          const uniqueUrls = [...new Set(urlsToCache)];
          
          // Pre-cache
          await Promise.all(uniqueUrls.map(async (url) => {
            try {
              const response = await fetch(url);
              if (response.ok) {
                 const blob = await response.clone().blob();
                 sizeBytes += blob.size;
                 await cache.put(url, response);
              }
            } catch (e) {
              console.warn("Could not cache resource:", url, e);
            }
          }));

          const offlineApp: OfflineApp = {
            ...app,
            downloadedAt: new Date().toISOString(),
            sizeBytes,
          };

          set((state) => ({
            offlineApps: { ...state.offlineApps, [app.id]: offlineApp },
            downloadingAppIds: state.downloadingAppIds.filter((id) => id !== app.id),
          }));
          
          window.dispatchEvent(new CustomEvent('showToast', { detail: { message: `App "${app.name}" descargada para uso offline.`, type: 'success' } }));
        } catch (error) {
          console.error("Error saving offline app", error);
          set((state) => ({
            downloadingAppIds: state.downloadingAppIds.filter((id) => id !== app.id),
          }));
          window.dispatchEvent(new CustomEvent('showToast', { detail: { message: `Error al descargar "${app.name}"`, type: 'error' } }));
        }
      },

      removeOffline: async (appId: string) => {
        const state = get();
        const app = state.offlineApps[appId];
        if (!app) return;

        try {
          const cache = await caches.open('nexus-offline-apps-v1');
          
          const urlsToRemove = [];
          if (app.downloadUrl) {
            urlsToRemove.push(app.downloadUrl);
            try {
               const res = await cache.match(app.downloadUrl);
               if (res) {
                 const html = await res.text();
                 const scriptMatches = html.matchAll(/<script[^>]+src=["']([^"']+)["']/g);
                 for (const match of scriptMatches) {
                    let url = match[1];
                    if (!url.startsWith('http')) url = new URL(url, app.downloadUrl).href;
                    urlsToRemove.push(url);
                 }
                 const linkMatches = html.matchAll(/<link[^>]+href=["']([^"']+)["']/g);
                 for (const match of linkMatches) {
                    let url = match[1];
                    if (!url.startsWith('http')) url = new URL(url, app.downloadUrl).href;
                    urlsToRemove.push(url);
                 }
               }
            } catch (e) {}
          }
          
          if (app.icon) urlsToRemove.push(app.icon);
          if (app.screenshots) app.screenshots.forEach(s => urlsToRemove.push(s));
          
          await Promise.all(urlsToRemove.map(url => cache.delete(url)));

          const newOfflineApps = { ...state.offlineApps };
          delete newOfflineApps[appId];

          set(() => ({ offlineApps: newOfflineApps }));
          window.dispatchEvent(new CustomEvent('showToast', { detail: { message: `Descarga de "${app.name}" eliminada.`, type: 'success' } }));
        } catch (error) {
          console.error("Error removing offline app", error);
          window.dispatchEvent(new CustomEvent('showToast', { detail: { message: `Error eliminando "${app.name}"`, type: 'error' } }));
        }
      },
    }),
    {
      name: 'nexus-offline-storage',
    }
  )
);

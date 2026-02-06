/**
 * BN-Aura Offline Data Sync
 * Handles offline data storage and sync when back online
 */

const DB_NAME = 'bnaura-offline';
const DB_VERSION = 1;

interface PendingAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  endpoint: string;
  data: unknown;
  timestamp: number;
  retries: number;
}

class OfflineSync {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Pending actions store
        if (!db.objectStoreNames.contains('pendingActions')) {
          db.createObjectStore('pendingActions', { keyPath: 'id' });
        }
        
        // Cached data store
        if (!db.objectStoreNames.contains('cachedData')) {
          const store = db.createObjectStore('cachedData', { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp');
        }
      };
    });
  }

  // Queue action for sync when online
  async queueAction(action: Omit<PendingAction, 'id' | 'timestamp' | 'retries'>): Promise<string> {
    if (!this.db) await this.init();

    const id = `action_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const pendingAction: PendingAction = {
      ...action,
      id,
      timestamp: Date.now(),
      retries: 0,
    };

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('pendingActions', 'readwrite');
      const store = tx.objectStore('pendingActions');
      const request = store.add(pendingAction);

      request.onsuccess = () => resolve(id);
      request.onerror = () => reject(request.error);
    });
  }

  // Get all pending actions
  async getPendingActions(): Promise<PendingAction[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('pendingActions', 'readonly');
      const store = tx.objectStore('pendingActions');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Remove completed action
  async removeAction(id: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('pendingActions', 'readwrite');
      const store = tx.objectStore('pendingActions');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Cache data for offline use
  async cacheData(key: string, data: unknown, ttl: number = 3600000): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('cachedData', 'readwrite');
      const store = tx.objectStore('cachedData');
      const request = store.put({
        key,
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + ttl,
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Get cached data
  async getCachedData<T>(key: string): Promise<T | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('cachedData', 'readonly');
      const store = tx.objectStore('cachedData');
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        if (!result || Date.now() > result.expiresAt) {
          resolve(null);
        } else {
          resolve(result.data as T);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Sync all pending actions
  async syncAll(): Promise<{ success: number; failed: number }> {
    const actions = await this.getPendingActions();
    let success = 0;
    let failed = 0;

    for (const action of actions) {
      try {
        const response = await fetch(action.endpoint, {
          method: action.type === 'delete' ? 'DELETE' : action.type === 'update' ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(action.data),
        });

        if (response.ok) {
          await this.removeAction(action.id);
          success++;
        } else if (action.retries >= 3) {
          await this.removeAction(action.id);
          failed++;
        }
      } catch {
        failed++;
      }
    }

    return { success, failed };
  }
}

export const offlineSync = new OfflineSync();

// Auto-sync when coming back online
if (typeof window !== 'undefined') {
  window.addEventListener('online', async () => {
    console.log('[Offline] Back online, syncing...');
    const result = await offlineSync.syncAll();
    console.log(`[Offline] Synced: ${result.success} success, ${result.failed} failed`);
  });
}

export default offlineSync;

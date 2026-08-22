// CodeSpace 3D — Multi-Project IndexedDB Storage Manager

const DB_NAME = 'CodeSpace3D_DB';
const DB_VERSION = 2;

export interface ProjectRecord {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  ownerId?: string;
  isCloudSynced?: boolean;
}

export interface StoredFile {
  id: string;
  projectId: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  language?: string;
  content?: string;
  children?: StoredFile[];
  parentId?: string | null;
}

export interface StoredTask {
  id: string;
  projectId: string;
  title: string;
  status: 'todo' | 'in_progress' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignee: string;
  category: string;
  relatedFilePath?: string;
}

export interface StoredAsset {
  id: string;
  projectId: string;
  name: string;
  category: 'models' | 'textures' | 'shaders' | 'audio';
  size: string;
  format: string;
  previewUrl: string;
  updatedAt: string;
  blobData?: ArrayBuffer;
}

export interface CloudSyncQueueItem {
  id: string;
  projectId: string;
  action: 'insert' | 'update' | 'delete';
  entity: 'files' | 'tasks' | 'snapshots';
  data: any;
  createdAt: string;
}

class IndexedDBManager {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains('projects')) {
          db.createObjectStore('projects', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('workspace')) {
          db.createObjectStore('workspace', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('tasks')) {
          db.createObjectStore('tasks', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('packages')) {
          db.createObjectStore('packages', { keyPath: 'name' });
        }
        if (!db.objectStoreNames.contains('assets')) {
          db.createObjectStore('assets', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('sync_queue')) {
          db.createObjectStore('sync_queue', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn(`IndexedDB getAll error in ${storeName}:`, e);
      return [];
    }
  }

  async getByProject<T extends { projectId: string }>(storeName: string, projectId: string): Promise<T[]> {
    const all = await this.getAll<T>(storeName);
    return all.filter(item => item.projectId === projectId);
  }

  async saveAll<T>(storeName: string, items: T[]): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      for (const item of items) {
        store.put(item);
      }
      return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) {
      console.warn(`IndexedDB saveAll error in ${storeName}:`, e);
    }
  }

  async saveItem<T>(storeName: string, item: T): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      store.put(item);
      return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) {
      console.warn(`IndexedDB saveItem error in ${storeName}:`, e);
    }
  }

  async removeItem(storeName: string, key: string): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      store.delete(key);
      return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) {
      console.warn(`IndexedDB removeItem error in ${storeName}:`, e);
    }
  }
}

export const dbManager = new IndexedDBManager();

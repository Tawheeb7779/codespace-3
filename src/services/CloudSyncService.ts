// CodeSpace 3D — Local-First Cloud Sync Service
import { dbManager, CloudSyncQueueItem } from '../utils/db';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

class CloudSyncService {
  private client: SupabaseClient | null = null;
  private isSyncing = false;

  constructor() {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (url && anonKey) {
      this.client = createClient(url, anonKey);
    }
  }

  public isCloudConnected(): boolean {
    return !!this.client;
  }

  public async enqueueChange(projectId: string, action: 'insert' | 'update' | 'delete', entity: 'files' | 'tasks' | 'snapshots', data: any) {
    const item: CloudSyncQueueItem = {
      id: Date.now().toString() + Math.random().toString(16).substring(2, 6),
      projectId,
      action,
      entity,
      data,
      createdAt: new Date().toISOString()
    };

    await dbManager.saveItem('sync_queue', item);
    this.processSyncQueue();
  }

  public async processSyncQueue(): Promise<{ processed: number; errors: number }> {
    const client = this.client;
    if (this.isSyncing || !client) {
      return { processed: 0, errors: 0 };
    }

    this.isSyncing = true;
    let processed = 0;
    let errors = 0;

    try {
      const queue = await dbManager.getAll<CloudSyncQueueItem>('sync_queue');
      for (const item of queue) {
        try {
          const { error } = await client
            .from(item.entity)
            .upsert({ ...item.data, updated_at: new Date().toISOString() });

          if (!error) {
            await dbManager.removeItem('sync_queue', item.id);
            processed++;
          } else {
            errors++;
          }
        } catch (err) {
          errors++;
        }
      }
    } finally {
      this.isSyncing = false;
    }

    return { processed, errors };
  }
}

export const cloudSyncService = new CloudSyncService();

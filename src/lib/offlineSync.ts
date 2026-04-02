import { get, set } from 'idb-keyval';
import { supabase } from './supabase';

const QUEUE_KEY = 'koa-write-queue';

export async function queueDatabaseOperation(operation: any) {
  try {
    const queue = (await get(QUEUE_KEY)) || [];
    queue.push(operation);
    await set(QUEUE_KEY, queue);
    console.log('✅ Safely queued to IndexedDB:', operation);
  } catch (err) {
    console.error('Failed to write to IndexedDB', err);
  }
}

export async function processSyncQueue() {
  try {
    const queue = (await get(QUEUE_KEY)) || [];
    if (queue.length === 0) return;

    console.log(`🔄 Processing offline queue... (${queue.length} items)`);
    const remainingQueue = [];

    for (const item of queue) {
      try {
        const { error } = await supabase.from(item.table).upsert(item.payload);
        if (error) throw error;
        console.log(`✅ Synced item from IndexedDB to Supabase!`);
      } catch (err) {
        console.error(`❌ Failed to sync item, keeping in queue...`, err);
        remainingQueue.push(item);
      }
    }
    await set(QUEUE_KEY, remainingQueue);
  } catch (err) {
    console.error('Failed to process IndexedDB queue', err);
  }
}

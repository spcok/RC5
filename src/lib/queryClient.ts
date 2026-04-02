import { QueryClient } from '@tanstack/react-query';
import { get, set, del } from 'idb-keyval';
import { PersistedClient, Persister } from '@tanstack/react-query-persist-client';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0, // Data is immediately considered stale, forcing a background network fetch if online
      gcTime: 1000 * 60 * 60 * 24 * 14, // 14 days
      refetchOnWindowFocus: true, // Ensure fresh data is pulled when the keeper switches back to the app
      refetchOnReconnect: true, // Immediately pull fresh data from Supabase when leaving a Wi-Fi dead zone
      networkMode: 'offlineFirst', // Pause network requests and serve the cache if offline
      retry: 2,
    },
    mutations: {
      networkMode: 'offlineFirst',
    },
  },
});

export const idbPersister: Persister = {
  persistClient: async (client: PersistedClient) => {
    await set('koa-tanstack-cache', client);
  },
  restoreClient: async () => {
    return await get<PersistedClient>('koa-tanstack-cache');
  },
  removeClient: async () => {
    await del('koa-tanstack-cache');
  },
};


import { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { queryClient } from './lib/queryClient';
import { useAuthStore } from './store/authStore';
import { router } from './router';
import { processSyncQueue } from './lib/offlineSync';

export default function App() {
  const initialize = useAuthStore(state => state.initialize);

  useEffect(() => {
    initialize();
    
    window.addEventListener('online', processSyncQueue);
    return () => window.removeEventListener('online', processSyncQueue);
  }, [initialize]);

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}

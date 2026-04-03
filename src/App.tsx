import { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { DatabaseProvider } from '@tanstack/db';
import { queryClient } from './lib/queryClient';
import { db } from './lib/database';
import { useAuthStore } from './store/authStore';
import { router } from './router';

export default function App() {
  const initialize = useAuthStore(state => state.initialize);

  useEffect(() => {
    initialize();
    
    // Initialize DB sync
    db.sync();
  }, [initialize]);

  return (
    <QueryClientProvider client={queryClient}>
      <DatabaseProvider db={db}>
        <RouterProvider router={router} />
      </DatabaseProvider>
    </QueryClientProvider>
  );
}

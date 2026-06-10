import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { router } from './router';
import { useAuthStore } from './stores/authStore';
import api from './lib/axios';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30000,
    },
  },
});

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { accessToken, setUser, hydrated } = useAuthStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (hydrated) return;
    const timeoutId = window.setTimeout(() => setReady(true), 1500);
    return () => window.clearTimeout(timeoutId);
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    const token = accessToken;
    if (token) {
      api
        .get('/auth/me')
        .then((res) => {
          const user = res.data.data;
          if (user) setUser(user);
        })
        .catch(() => {
          useAuthStore.getState().logout();
        })
        .finally(() => setReady(true));
    } else {
      setReady(true);
    }
  }, [hydrated]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-background-primary text-text-primary flex items-center justify-center">
        <div className="text-sm text-text-muted">Loading...</div>
      </div>
    );
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthInitializer>
        <RouterProvider router={router} />
      </AuthInitializer>
    </QueryClientProvider>
  );
}
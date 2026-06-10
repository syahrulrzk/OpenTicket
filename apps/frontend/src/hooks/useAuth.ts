import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../lib/axios';
import { useAuthStore } from '../stores/authStore';
import type { User } from '../types';

export function useLogin() {
  const navigate = useNavigate();
  const setTokens = useAuthStore((s) => s.setTokens);
  const login = useAuthStore((s) => s.login);

  return useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const res = await api.post('/auth/login', data);
      return res.data.data as {
        accessToken: string;
        refreshToken: string;
        requiresMfa?: boolean;
        userId?: string;
      };
    },
    onSuccess: async (data) => {
      if (data.requiresMfa) {
        navigate(`/mfa-verify?userId=${data.userId}`);
        return;
      }

      // Persist tokens FIRST so subsequent /auth/me uses them via interceptor.
      setTokens(data.accessToken, data.refreshToken);

      try {
        // Await the profile fetch so isAuthenticated is set before navigation.
        const meRes = await api.get('/auth/me');
        const user = meRes.data.data as User;
        login(user, data.accessToken, data.refreshToken);
        navigate('/', { replace: true });
      } catch (err) {
        // If /auth/me fails, clear the partial session and stay on login.
        useAuthStore.getState().logout();
        throw err;
      }
    },
  });
}

export function useLogout() {
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const refreshToken = useAuthStore.getState().refreshToken;
      await api.post('/auth/logout', { refreshToken });
    },
    onSettled: () => {
      logout();
      queryClient.clear();
      navigate('/login', { replace: true });
    },
  });
}

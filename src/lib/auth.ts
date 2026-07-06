import api from './api';
import type { LoginResponse, User } from '@/types';

export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const { data } = await api.post<LoginResponse>('/api/auth/login/', {
      email,
      password,
    });
    return data;
  },

  me: async (): Promise<User> => {
    const { data } = await api.get<User>('/api/auth/me/');
    return data;
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },
};

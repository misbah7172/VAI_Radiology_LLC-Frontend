import api from './api';
import type { Task, TaskCreate, TaskUpdate, PaginatedResponse, ReorderPayload } from '@/types';

export const tasksApi = {
  list: async (date?: string): Promise<PaginatedResponse<Task>> => {
    const params: Record<string, string> = {};
    if (date) params.date = date;
    const { data } = await api.get<PaginatedResponse<Task>>('/api/tasks/', { params });
    return data;
  },

  create: async (payload: TaskCreate): Promise<Task> => {
    const { data } = await api.post<Task>('/api/tasks/', payload);
    return data;
  },

  update: async (id: number, payload: TaskUpdate): Promise<Task> => {
    const { data } = await api.patch<Task>(`/api/tasks/${id}/`, payload);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/tasks/${id}/`);
  },

  reorder: async (payload: ReorderPayload): Promise<void> => {
    await api.post('/api/tasks/reorder/', payload);
  },

  searchByTag: async (tag: string): Promise<PaginatedResponse<Task>> => {
    const { data } = await api.get<PaginatedResponse<Task>>('/api/tasks/', {
      params: { tag },
    });
    return data;
  },

  listByMonth: async (month: string): Promise<PaginatedResponse<Task>> => {
    // month = 'YYYY-MM'
    const { data } = await api.get<PaginatedResponse<Task>>('/api/tasks/', {
      params: { month },
    });
    return data;
  },
};

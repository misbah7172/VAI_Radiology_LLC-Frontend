'use client';

import { create } from 'zustand';
import { format } from 'date-fns';
import type { Task, TaskCreate, TaskUpdate, TaskStatus } from '@/types';
import { tasksApi } from '@/lib/tasks';

interface TaskState {
  tasks: Task[];
  selectedDate: Date;
  isLoading: boolean;
  error: string | null;

  setSelectedDate: (date: Date) => void;
  fetchTasks: (date?: Date) => Promise<void>;
  createTask: (payload: TaskCreate) => Promise<void>;
  updateTask: (id: number, payload: TaskUpdate) => Promise<void>;
  deleteTask: (id: number) => Promise<void>;
  reorderTasks: (
    activeId: number,
    overId: number | null,
    newStatus: TaskStatus
  ) => Promise<void>;

  // Derived selectors
  getTasksByStatus: (status: TaskStatus) => Task[];
}

export const useTaskStore = create<TaskState>()((set, get) => ({
  tasks: [],
  selectedDate: new Date(),
  isLoading: false,
  error: null,

  setSelectedDate: (date: Date) => {
    set({ selectedDate: date });
    get().fetchTasks(date);
  },

  fetchTasks: async (date?: Date) => {
    const d = date || get().selectedDate;
    const dateStr = format(d, 'yyyy-MM-dd');
    set({ isLoading: true, error: null });
    try {
      const res = await tasksApi.list(dateStr);
      set({ tasks: res.results, isLoading: false });
    } catch {
      set({ error: 'Failed to load tasks', isLoading: false });
    }
  },

  createTask: async (payload: TaskCreate) => {
    const task = await tasksApi.create(payload);
    set((state) => ({ tasks: [...state.tasks, task] }));
  },

  updateTask: async (id: number, payload: TaskUpdate) => {
    const updated = await tasksApi.update(id, payload);
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? updated : t)),
    }));
  },

  deleteTask: async (id: number) => {
    await tasksApi.delete(id);
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }));
  },

  reorderTasks: async (activeId, overId, newStatus) => {
    const { tasks } = get();
    const activeTask = tasks.find((t) => t.id === activeId);
    if (!activeTask) return;

    // Optimistic update
    const updatedTasks = tasks.map((t) =>
      t.id === activeId ? { ...t, status: newStatus } : t
    );

    // Calculate positions per column
    const columnTasks = updatedTasks
      .filter((t) => t.status === newStatus)
      .sort((a, b) => a.position - b.position);

    const reorderPayload = columnTasks.map((t, idx) => ({
      id: t.id,
      status: t.status,
      position: idx,
    }));

    set({ tasks: updatedTasks });

    try {
      await tasksApi.reorder({ tasks: reorderPayload });
    } catch {
      // Revert on failure
      get().fetchTasks();
    }
  },

  getTasksByStatus: (status: TaskStatus) =>
    get()
      .tasks.filter((t) => t.status === status)
      .sort((a, b) => a.position - b.position),
}));

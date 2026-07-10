import api from './api';
import type { UploadedImage, Annotation, AnnotationCreate, ImageSet, PaginatedResponse } from '@/types';

export const annotationsApi = {
  listImages: async (): Promise<PaginatedResponse<UploadedImage>> => {
    const { data } = await api.get<PaginatedResponse<UploadedImage>>(
      '/api/annotations/images/'
    );
    return data;
  },

  uploadImages: async (files: File[], setId?: number): Promise<UploadedImage[]> => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    if (setId !== undefined) {
      formData.append('set_id', String(setId));
    }
    const { data } = await api.post<UploadedImage[]>('/api/annotations/images/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  deleteImage: async (id: number): Promise<void> => {
    await api.delete(`/api/annotations/images/${id}/`);
  },

  createAnnotation: async (payload: AnnotationCreate): Promise<Annotation> => {
    const { data } = await api.post<Annotation>('/api/annotations/polygons/', payload);
    return data;
  },

  deleteAnnotation: async (id: number): Promise<void> => {
    await api.delete(`/api/annotations/polygons/${id}/`);
  },

  // Image Sets APIs
  listSets: async (): Promise<PaginatedResponse<ImageSet>> => {
    const { data } = await api.get<PaginatedResponse<ImageSet>>('/api/annotations/sets/');
    return data;
  },

  createSet: async (name: string): Promise<ImageSet> => {
    const { data } = await api.post<ImageSet>('/api/annotations/sets/', { name });
    return data;
  },

  updateSet: async (id: number, name: string): Promise<ImageSet> => {
    const { data } = await api.patch<ImageSet>(`/api/annotations/sets/${id}/`, { name });
    return data;
  },

  deleteSet: async (id: number): Promise<void> => {
    await api.delete(`/api/annotations/sets/${id}/`);
  },
};

import api from './api';
import type { UploadedImage, Annotation, AnnotationCreate, PaginatedResponse } from '@/types';

export const annotationsApi = {
  listImages: async (): Promise<PaginatedResponse<UploadedImage>> => {
    const { data } = await api.get<PaginatedResponse<UploadedImage>>(
      '/api/annotations/images/'
    );
    return data;
  },

  uploadImages: async (files: File[]): Promise<UploadedImage[]> => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
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
};

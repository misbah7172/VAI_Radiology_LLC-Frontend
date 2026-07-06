'use client';

import { create } from 'zustand';
import type { UploadedImage, Annotation, AnnotationCreate, Point } from '@/types';
import { annotationsApi } from '@/lib/annotations';

interface AnnotationState {
  images: UploadedImage[];
  activeImageIndex: number;
  isDrawing: boolean;
  currentPolygon: Point[];
  isLoading: boolean;
  isUploading: boolean;
  error: string | null;

  fetchImages: () => Promise<void>;
  uploadImages: (files: File[]) => Promise<void>;
  deleteImage: (id: number) => Promise<void>;
  setActiveImageIndex: (index: number) => void;

  // Drawing state
  setIsDrawing: (drawing: boolean) => void;
  addPoint: (point: Point) => void;
  clearCurrentPolygon: () => void;

  saveAnnotation: (label: string, color: string) => Promise<void>;
  deleteAnnotation: (annotationId: number) => Promise<void>;

  // Derived
  activeImage: () => UploadedImage | null;
}

export const useAnnotationStore = create<AnnotationState>()((set, get) => ({
  images: [],
  activeImageIndex: 0,
  isDrawing: false,
  currentPolygon: [],
  isLoading: false,
  isUploading: false,
  error: null,

  fetchImages: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await annotationsApi.listImages();
      set({ images: res.results, isLoading: false });
    } catch {
      set({ error: 'Failed to load images', isLoading: false });
    }
  },

  uploadImages: async (files: File[]) => {
    set({ isUploading: true, error: null });
    try {
      const uploaded = await annotationsApi.uploadImages(files);
      set((state) => ({
        images: [...uploaded, ...state.images],
        isUploading: false,
        activeImageIndex: 0,
      }));
    } catch {
      set({ error: 'Upload failed', isUploading: false });
    }
  },

  deleteImage: async (id: number) => {
    await annotationsApi.deleteImage(id);
    set((state) => {
      const newImages = state.images.filter((img) => img.id !== id);
      return {
        images: newImages,
        activeImageIndex: Math.min(state.activeImageIndex, newImages.length - 1),
      };
    });
  },

  setActiveImageIndex: (index: number) => {
    set({ activeImageIndex: index, isDrawing: false, currentPolygon: [] });
  },

  setIsDrawing: (drawing: boolean) => set({ isDrawing: drawing }),

  addPoint: (point: Point) => {
    set((state) => ({
      currentPolygon: [...state.currentPolygon, point],
    }));
  },

  clearCurrentPolygon: () => set({ currentPolygon: [] }),

  saveAnnotation: async (label: string, color: string) => {
    const { activeImageIndex, images, currentPolygon } = get();
    const image = images[activeImageIndex];
    if (!image || currentPolygon.length < 3) return;

    const payload: AnnotationCreate = {
      image: image.id,
      label,
      color,
      polygon_data: currentPolygon,
    };

    const annotation = await annotationsApi.createAnnotation(payload);

    set((state) => ({
      images: state.images.map((img, idx) =>
        idx === activeImageIndex
          ? { ...img, annotations: [...img.annotations, annotation] }
          : img
      ),
      currentPolygon: [],
      isDrawing: false,
    }));
  },

  deleteAnnotation: async (annotationId: number) => {
    await annotationsApi.deleteAnnotation(annotationId);
    set((state) => ({
      images: state.images.map((img, idx) =>
        idx === state.activeImageIndex
          ? {
              ...img,
              annotations: img.annotations.filter((a) => a.id !== annotationId),
            }
          : img
      ),
    }));
  },

  activeImage: () => {
    const { images, activeImageIndex } = get();
    return images[activeImageIndex] ?? null;
  },
}));

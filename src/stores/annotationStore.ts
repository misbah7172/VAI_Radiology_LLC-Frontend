'use client';

import { create } from 'zustand';
import type { UploadedImage, Annotation, AnnotationCreate, Point } from '@/types';
import { annotationsApi } from '@/lib/annotations';

export const PRESET_CLASSES = [
  { name: 'Tumor',      color: '#FF6B6B' },
  { name: 'Lesion',     color: '#FF9F43' },
  { name: 'Edema',      color: '#FECA57' },
  { name: 'Normal',     color: '#48DBFB' },
  { name: 'Background', color: '#A29BFE' },
  { name: 'Artifact',   color: '#55EFC4' },
  { name: 'Vessel',     color: '#FD79A8' },
  { name: 'Custom',     color: '#6C5CE7' },
];

interface AnnotationState {
  images: UploadedImage[];
  activeImageIndex: number;
  isDrawing: boolean;
  currentPolygon: Point[];
  isLoading: boolean;
  isUploading: boolean;
  error: string | null;

  // UI state
  selectedClass: string;
  selectedColor: string;
  hideAnnotations: boolean;
  activeTool: 'polygon' | 'point';

  // Video state
  currentVideoTime: number;
  seekTargetTime: number | null;

  fetchImages: () => Promise<void>;
  uploadImages: (files: File[]) => Promise<void>;
  deleteImage: (id: number) => Promise<void>;
  setActiveImageIndex: (index: number) => void;

  // Drawing state
  setIsDrawing: (drawing: boolean) => void;
  addPoint: (point: Point) => void;
  clearCurrentPolygon: () => void;

  saveAnnotation: (label: string, color: string, frameTime?: number | null) => Promise<void>;
  deleteAnnotation: (annotationId: number) => Promise<void>;

  // UI setters
  setSelectedClass: (cls: string) => void;
  setSelectedColor: (color: string) => void;
  setHideAnnotations: (hide: boolean) => void;
  setActiveTool: (tool: 'polygon' | 'point') => void;

  // Video setters
  setCurrentVideoTime: (t: number) => void;
  setSeekTargetTime: (t: number | null) => void;

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

  selectedClass: PRESET_CLASSES[0].name,
  selectedColor: PRESET_CLASSES[0].color,
  hideAnnotations: false,
  activeTool: 'polygon',

  currentVideoTime: 0,
  seekTargetTime: null,

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
        activeImageIndex: Math.min(state.activeImageIndex, Math.max(0, newImages.length - 1)),
      };
    });
  },

  setActiveImageIndex: (index: number) => {
    set({ activeImageIndex: index, isDrawing: false, currentPolygon: [], currentVideoTime: 0, seekTargetTime: null });
  },

  setIsDrawing: (drawing: boolean) => set({ isDrawing: drawing }),

  addPoint: (point: Point) => {
    set((state) => ({
      currentPolygon: [...state.currentPolygon, point],
    }));
  },

  clearCurrentPolygon: () => set({ currentPolygon: [] }),

  saveAnnotation: async (label: string, color: string, frameTime?: number | null) => {
    const { activeImageIndex, images, currentPolygon } = get();
    const image = images[activeImageIndex];
    if (!image || currentPolygon.length < 1) return;

    const payload: AnnotationCreate = {
      image: image.id,
      label,
      color,
      polygon_data: currentPolygon,
      frame_time: frameTime,
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
          ? { ...img, annotations: img.annotations.filter((a) => a.id !== annotationId) }
          : img
      ),
    }));
  },

  setSelectedClass: (cls: string) => {
    const preset = PRESET_CLASSES.find((p) => p.name === cls);
    set({ selectedClass: cls, selectedColor: preset?.color ?? '#A29BFE' });
  },

  setSelectedColor: (color: string) => set({ selectedColor: color }),
  setHideAnnotations: (hide: boolean) => set({ hideAnnotations: hide }),
  setActiveTool: (tool: 'polygon' | 'point') => set({ activeTool: tool }),

  setCurrentVideoTime: (t: number) => set({ currentVideoTime: t }),
  setSeekTargetTime: (t: number | null) => set({ seekTargetTime: t }),

  activeImage: () => {
    const { images, activeImageIndex } = get();
    return images[activeImageIndex] ?? null;
  },
}));

'use client';

import { create } from 'zustand';
import type { UploadedImage, ImageSet, AnnotationCreate, Point } from '@/types';
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
  imageSets: ImageSet[];
  activeSetId: number | null;
  activeImageIndex: number;
  gridSetIds: number[];
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

  fetchSets: () => Promise<void>;
  uploadImages: (files: File[], setId?: number) => Promise<void>;
  deleteSet: (id: number) => Promise<void>;
  deleteImage: (id: number) => Promise<void>;
  setActiveSetId: (setId: number | null) => void;
  setActiveImageIndex: (index: number) => void;

  // Grid actions
  addToGrid: (setId: number) => void;
  removeFromGrid: (setId: number) => void;
  clearGrid: () => void;

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
  activeSet: () => ImageSet | null;
}

export const useAnnotationStore = create<AnnotationState>()((set, get) => ({
  imageSets: [],
  activeSetId: null,
  activeImageIndex: 0,
  gridSetIds: [],
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

  fetchSets: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await annotationsApi.listSets();
      const sets = res.results;
      const currentActiveSetId = get().activeSetId;
      
      // Default to first set if none selected
      const nextActiveId = currentActiveSetId !== null && sets.some(s => s.id === currentActiveSetId)
        ? currentActiveSetId
        : sets.length > 0 ? sets[0].id : null;

      set({
        imageSets: sets,
        activeSetId: nextActiveId,
        isLoading: false
      });
    } catch {
      set({ error: 'Failed to load image sets', isLoading: false });
    }
  },

  uploadImages: async (files: File[], setId?: number) => {
    set({ isUploading: true, error: null });
    try {
      await annotationsApi.uploadImages(files, setId);
      // Re-fetch sets to display the updated images list
      const res = await annotationsApi.listSets();
      const sets = res.results;
      
      // If we uploaded into a new set, activate the newly created one (highest ID).
      // Otherwise activate the specified setId.
      let targetId = setId;
      if (!targetId && sets.length > 0) {
        const sorted = [...sets].sort((a, b) => b.id - a.id);
        targetId = sorted[0].id;
      }
      
      set({
        imageSets: sets,
        activeSetId: targetId,
        activeImageIndex: 0,
        isUploading: false,
      });
    } catch {
      set({ error: 'Upload failed', isUploading: false });
    }
  },

  deleteSet: async (id: number) => {
    try {
      await annotationsApi.deleteSet(id);
      set((state) => {
        const nextSets = state.imageSets.filter(s => s.id !== id);
        const nextActiveId = state.activeSetId === id
          ? nextSets.length > 0 ? nextSets[0].id : null
          : state.activeSetId;
        const nextGridIds = state.gridSetIds.filter(gid => gid !== id);

        return {
          imageSets: nextSets,
          activeSetId: nextActiveId,
          gridSetIds: nextGridIds,
          activeImageIndex: 0
        };
      });
    } catch {
      set({ error: 'Failed to delete set' });
    }
  },

  deleteImage: async (id: number) => {
    await annotationsApi.deleteImage(id);
    // Refresh sets to make sure nested structures are clean
    const res = await annotationsApi.listSets();
    const sets = res.results;
    
    set((state) => {
      const activeSet = sets.find(s => s.id === state.activeSetId);
      const maxIndex = activeSet ? activeSet.images.length - 1 : 0;
      return {
        imageSets: sets,
        activeImageIndex: Math.min(state.activeImageIndex, Math.max(0, maxIndex)),
      };
    });
  },

  setActiveSetId: (setId: number | null) => {
    set({
      activeSetId: setId,
      activeImageIndex: 0,
      isDrawing: false,
      currentPolygon: [],
      currentVideoTime: 0,
      seekTargetTime: null
    });
  },

  setActiveImageIndex: (index: number) => {
    set({
      activeImageIndex: index,
      isDrawing: false,
      currentPolygon: [],
      currentVideoTime: 0,
      seekTargetTime: null
    });
  },

  addToGrid: (setId: number) => {
    set((state) => {
      if (state.gridSetIds.includes(setId)) return {};
      return { gridSetIds: [...state.gridSetIds, setId] };
    });
  },

  removeFromGrid: (setId: number) => {
    set((state) => ({
      gridSetIds: state.gridSetIds.filter((id) => id !== setId),
    }));
  },

  clearGrid: () => set({ gridSetIds: [] }),

  setIsDrawing: (drawing: boolean) => set({ isDrawing: drawing }),

  addPoint: (point: Point) => {
    set((state) => ({
      currentPolygon: [...state.currentPolygon, point],
    }));
  },

  clearCurrentPolygon: () => set({ currentPolygon: [] }),

  saveAnnotation: async (label: string, color: string, frameTime?: number | null) => {
    const image = get().activeImage();
    if (!image || get().currentPolygon.length < 3) return;

    const payload: AnnotationCreate = {
      image: image.id,
      label,
      color,
      polygon_data: get().currentPolygon,
      frame_time: frameTime,
    };

    const annotation = await annotationsApi.createAnnotation(payload);

    set((state) => ({
      imageSets: state.imageSets.map((s) => {
        if (s.id !== state.activeSetId) return s;
        return {
          ...s,
          images: s.images.map((img) => {
            if (img.id !== image.id) return img;
            return {
              ...img,
              annotations: [...img.annotations, annotation]
            };
          })
        };
      }),
      currentPolygon: [],
      isDrawing: false,
    }));
  },

  deleteAnnotation: async (annotationId: number) => {
    const image = get().activeImage();
    if (!image) return;

    await annotationsApi.deleteAnnotation(annotationId);
    
    set((state) => ({
      imageSets: state.imageSets.map((s) => {
        if (s.id !== state.activeSetId) return s;
        return {
          ...s,
          images: s.images.map((img) => {
            if (img.id !== image.id) return img;
            return {
              ...img,
              annotations: img.annotations.filter((a) => a.id !== annotationId)
            };
          })
        };
      }),
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
    const { imageSets, activeSetId, activeImageIndex } = get();
    const activeSet = imageSets.find((s) => s.id === activeSetId);
    return activeSet?.images[activeImageIndex] ?? null;
  },

  activeSet: () => {
    const { imageSets, activeSetId } = get();
    return imageSets.find((s) => s.id === activeSetId) ?? null;
  },
}));

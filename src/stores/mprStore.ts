'use client';

import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type {
  MPRPlane, DrawingTool, ViewerState, MPRAnnotations,
  CrosshairState, AnnotationShape, NormalizedPoint, WindowPreset,
} from '@/types/mpr';
import { DEFAULT_VIEWER_STATE } from '@/types/mpr';
import type { ImageSet } from '@/types';

export const MPR_PRESET_CLASSES = [
  { name: 'Tumor',      color: '#FF6B6B' },
  { name: 'Lesion',     color: '#FF9F43' },
  { name: 'Edema',      color: '#FECA57' },
  { name: 'Normal',     color: '#48DBFB' },
  { name: 'Background', color: '#A29BFE' },
  { name: 'Vessel',     color: '#55EFC4' },
];

// ─── Helper: empty annotations ────────────────────────────────────────────────
function emptyAnnotations(): MPRAnnotations {
  return { axial: {}, sagittal: {}, coronal: {} };
}

function emptyViewers(): Record<MPRPlane, ViewerState> {
  return {
    axial:    { ...DEFAULT_VIEWER_STATE },
    sagittal: { ...DEFAULT_VIEWER_STATE },
    coronal:  { ...DEFAULT_VIEWER_STATE },
  };
}

// ─── Store Interface ──────────────────────────────────────────────────────────
export interface MPRStore {
  // Series assignment (which ImageSet is loaded into each plane)
  series: Record<MPRPlane, ImageSet | null>;
  assignSeries: (plane: MPRPlane, set: ImageSet | null) => void;

  // Per-viewer states
  viewers: Record<MPRPlane, ViewerState>;

  // Slice navigation
  setSlice:   (plane: MPRPlane, index: number) => void;
  deltaSlice: (plane: MPRPlane, delta: number) => void;

  // Viewport controls
  setZoom:         (plane: MPRPlane, zoom: number)   => void;
  setPan:          (plane: MPRPlane, x: number, y: number) => void;
  deltaPan:        (plane: MPRPlane, dx: number, dy: number) => void;
  resetView:       (plane: MPRPlane) => void;
  fitToScreen:     (plane: MPRPlane, canvasW: number, canvasH: number, imgW: number, imgH: number) => void;
  setWindowLevel:  (plane: MPRPlane, ww: number, wl: number) => void;
  applyWindowPreset:(plane: MPRPlane, preset: WindowPreset) => void;
  toggleWindow:    (plane: MPRPlane) => void;
  toggleHide:      (plane: MPRPlane) => void;
  toggleHidePrev:  (plane: MPRPlane) => void;
  setTool:         (plane: MPRPlane, tool: DrawingTool) => void;

  // In-progress drawing
  addInProgressPoint: (plane: MPRPlane, pt: NormalizedPoint) => void;
  setInProgressStart: (plane: MPRPlane, pt: NormalizedPoint | null) => void;
  clearInProgress:    (plane: MPRPlane) => void;

  // Active plane
  activePlane:    MPRPlane;
  setActivePlane: (plane: MPRPlane) => void;

  // Crosshair
  crosshair:       CrosshairState;
  updateCrosshair: (c: Partial<CrosshairState>) => void;

  // Annotations
  mprAnnotations: MPRAnnotations;
  commitAnnotation: (plane: MPRPlane, sliceIndex: number) => void;
  removeAnnotation: (plane: MPRPlane, sliceIndex: number, id: string) => void;
  clearSliceAnnotations: (plane: MPRPlane, sliceIndex: number) => void;

  // Undo / Redo (full annotation snapshot per action)
  undoStack: MPRAnnotations[];
  redoStack: MPRAnnotations[];
  undo: () => void;
  redo: () => void;

  // Class/color selection
  selectedClass: string;
  selectedColor: string;
  setSelectedClass: (cls: string) => void;
  setSelectedColor: (color: string) => void;
}

// ─── Store Implementation ─────────────────────────────────────────────────────
export const useMPRStore = create<MPRStore>()((set, get) => ({
  series: { axial: null, sagittal: null, coronal: null },

  assignSeries: (plane, imageSet) =>
    set((s) => ({
      series: { ...s.series, [plane]: imageSet },
      viewers: {
        ...s.viewers,
        [plane]: { ...DEFAULT_VIEWER_STATE }, // reset viewer when series changes
      },
    })),

  viewers: emptyViewers(),

  // ── Slice navigation ──────────────────────────────────────────────────────
  setSlice: (plane, index) => {
    const totalSlices = get().series[plane]?.images.length ?? 1;
    const clamped = Math.max(0, Math.min(totalSlices - 1, index));
    set((s) => ({
      viewers: {
        ...s.viewers,
        [plane]: { ...s.viewers[plane], sliceIndex: clamped },
      },
      // Update crosshair fraction based on new slice
      crosshair: {
        ...s.crosshair,
        [`${plane}Frac`]: totalSlices > 1 ? clamped / (totalSlices - 1) : 0,
      },
    }));
  },

  deltaSlice: (plane, delta) => {
    const current = get().viewers[plane].sliceIndex;
    get().setSlice(plane, current + delta);
  },

  // ── Viewport ──────────────────────────────────────────────────────────────
  setZoom: (plane, zoom) => {
    const z = Math.max(0.1, Math.min(20, zoom));
    set((s) => ({
      viewers: { ...s.viewers, [plane]: { ...s.viewers[plane], zoom: z } },
    }));
  },

  setPan: (plane, x, y) =>
    set((s) => ({
      viewers: { ...s.viewers, [plane]: { ...s.viewers[plane], panX: x, panY: y } },
    })),

  deltaPan: (plane, dx, dy) =>
    set((s) => {
      const v = s.viewers[plane];
      return {
        viewers: { ...s.viewers, [plane]: { ...v, panX: v.panX + dx, panY: v.panY + dy } },
      };
    }),

  resetView: (plane) =>
    set((s) => ({
      viewers: { ...s.viewers, [plane]: { ...s.viewers[plane], zoom: 1, panX: 0, panY: 0 } },
    })),

  fitToScreen: (plane, cw, ch, iw, ih) => {
    if (iw === 0 || ih === 0) return;
    const scale = Math.min(cw / iw, ch / ih) * 0.95;
    set((s) => ({
      viewers: { ...s.viewers, [plane]: { ...s.viewers[plane], zoom: scale, panX: 0, panY: 0 } },
    }));
  },

  setWindowLevel: (plane, ww, wl) =>
    set((s) => ({
      viewers: { ...s.viewers, [plane]: { ...s.viewers[plane], windowWidth: ww, windowLevel: wl } },
    })),

  applyWindowPreset: (plane, preset) =>
    set((s) => ({
      viewers: {
        ...s.viewers,
        [plane]: {
          ...s.viewers[plane],
          windowWidth: preset.ww,
          windowLevel: preset.wl,
          applyWindow: true,
        },
      },
    })),

  toggleWindow: (plane) =>
    set((s) => ({
      viewers: {
        ...s.viewers,
        [plane]: { ...s.viewers[plane], applyWindow: !s.viewers[plane].applyWindow },
      },
    })),

  toggleHide: (plane) =>
    set((s) => ({
      viewers: {
        ...s.viewers,
        [plane]: { ...s.viewers[plane], hideAnnotations: !s.viewers[plane].hideAnnotations },
      },
    })),

  toggleHidePrev: (plane) =>
    set((s) => ({
      viewers: {
        ...s.viewers,
        [plane]: {
          ...s.viewers[plane],
          hidePrevAnnotations: !s.viewers[plane].hidePrevAnnotations,
        },
      },
    })),

  setTool: (plane, tool) =>
    set((s) => ({
      viewers: { ...s.viewers, [plane]: { ...s.viewers[plane], activeTool: tool } },
      activePlane: plane,
    })),

  // ── In-progress drawing ───────────────────────────────────────────────────
  addInProgressPoint: (plane, pt) =>
    set((s) => ({
      viewers: {
        ...s.viewers,
        [plane]: {
          ...s.viewers[plane],
          inProgressPoints: [...s.viewers[plane].inProgressPoints, pt],
        },
      },
    })),

  setInProgressStart: (plane, pt) =>
    set((s) => ({
      viewers: {
        ...s.viewers,
        [plane]: { ...s.viewers[plane], inProgressStart: pt },
      },
    })),

  clearInProgress: (plane) =>
    set((s) => ({
      viewers: {
        ...s.viewers,
        [plane]: { ...s.viewers[plane], inProgressPoints: [], inProgressStart: null },
      },
    })),

  // ── Active plane ──────────────────────────────────────────────────────────
  activePlane: 'axial',
  setActivePlane: (plane) => set({ activePlane: plane }),

  // ── Crosshair ─────────────────────────────────────────────────────────────
  crosshair: { axialFrac: 0, sagittalFrac: 0, coronalFrac: 0 },
  updateCrosshair: (c) =>
    set((s) => ({ crosshair: { ...s.crosshair, ...c } })),

  // ── Annotations ───────────────────────────────────────────────────────────
  mprAnnotations: emptyAnnotations(),

  commitAnnotation: (plane, sliceIndex) => {
    const { viewers, mprAnnotations, selectedClass, selectedColor } = get();
    const v = viewers[plane];
    const pts = v.inProgressPoints;
    const start = v.inProgressStart;
    const tool = v.activeTool;

    if (!tool || tool === 'eraser') {
      get().clearInProgress(plane);
      return;
    }

    let shape: AnnotationShape | null = null;

    if (tool === 'pencil' || tool === 'brush') {
      if (pts.length < 2) { get().clearInProgress(plane); return; }
      shape = {
        id: nanoid(),
        type: tool === 'brush' ? 'brush' : 'polygon',
        label: selectedClass,
        color: selectedColor,
        points: [...pts],
      };
    } else if (tool === 'circle' && start && pts.length > 0) {
      const last = pts[pts.length - 1];
      const dx = last.x - start.x;
      const dy = last.y - start.y;
      const r = Math.sqrt(dx * dx + dy * dy) / 2;
      shape = {
        id: nanoid(),
        type: 'circle',
        label: selectedClass,
        color: selectedColor,
        cx: (start.x + last.x) / 2,
        cy: (start.y + last.y) / 2,
        radius: r,
      };
    } else if (tool === 'rectangle' && start && pts.length > 0) {
      const last = pts[pts.length - 1];
      shape = {
        id: nanoid(),
        type: 'rectangle',
        label: selectedClass,
        color: selectedColor,
        x: Math.min(start.x, last.x),
        y: Math.min(start.y, last.y),
        w: Math.abs(last.x - start.x),
        h: Math.abs(last.y - start.y),
      };
    }

    if (!shape) { get().clearInProgress(plane); return; }

    // Push to undo stack before mutating
    const snapshot = JSON.parse(JSON.stringify(mprAnnotations)) as MPRAnnotations;
    const existing = mprAnnotations[plane][sliceIndex] ?? [];
    const next: MPRAnnotations = {
      ...mprAnnotations,
      [plane]: {
        ...mprAnnotations[plane],
        [sliceIndex]: [...existing, shape],
      },
    };

    set((s) => ({
      mprAnnotations: next,
      undoStack: [...s.undoStack.slice(-49), snapshot],
      redoStack: [],
    }));
    get().clearInProgress(plane);
  },

  removeAnnotation: (plane, sliceIndex, id) => {
    const { mprAnnotations } = get();
    const snapshot = JSON.parse(JSON.stringify(mprAnnotations)) as MPRAnnotations;
    const existing = mprAnnotations[plane][sliceIndex] ?? [];
    set((s) => ({
      mprAnnotations: {
        ...s.mprAnnotations,
        [plane]: {
          ...s.mprAnnotations[plane],
          [sliceIndex]: existing.filter((a) => a.id !== id),
        },
      },
      undoStack: [...s.undoStack.slice(-49), snapshot],
      redoStack: [],
    }));
  },

  clearSliceAnnotations: (plane, sliceIndex) => {
    const snapshot = JSON.parse(JSON.stringify(get().mprAnnotations)) as MPRAnnotations;
    set((s) => ({
      mprAnnotations: {
        ...s.mprAnnotations,
        [plane]: { ...s.mprAnnotations[plane], [sliceIndex]: [] },
      },
      undoStack: [...s.undoStack.slice(-49), snapshot],
      redoStack: [],
    }));
  },

  // ── Undo / Redo ───────────────────────────────────────────────────────────
  undoStack: [],
  redoStack: [],

  undo: () => {
    const { undoStack, mprAnnotations } = get();
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    set((s) => ({
      mprAnnotations: prev,
      undoStack: s.undoStack.slice(0, -1),
      redoStack: [...s.redoStack.slice(-49), JSON.parse(JSON.stringify(mprAnnotations))],
    }));
  },

  redo: () => {
    const { redoStack, mprAnnotations } = get();
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    set((s) => ({
      mprAnnotations: next,
      redoStack: s.redoStack.slice(0, -1),
      undoStack: [...s.undoStack.slice(-49), JSON.parse(JSON.stringify(mprAnnotations))],
    }));
  },

  // ── Class / color ─────────────────────────────────────────────────────────
  selectedClass: MPR_PRESET_CLASSES[0].name,
  selectedColor: MPR_PRESET_CLASSES[0].color,

  setSelectedClass: (cls) => {
    const preset = MPR_PRESET_CLASSES.find((p) => p.name === cls);
    set({ selectedClass: cls, selectedColor: preset?.color ?? '#FF6B6B' });
  },

  setSelectedColor: (color) => set({ selectedColor: color }),
}));

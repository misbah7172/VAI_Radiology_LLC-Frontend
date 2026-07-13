'use client';

import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type {
  MPRPlane, DrawingTool, ViewerState, MPRAnnotations,
  CrosshairState, AnnotationShape, NormalizedPoint, WindowPreset,
  PolygonShape, CircleShape, RectangleShape,
} from '@/types/mpr';
import { DEFAULT_VIEWER_STATE } from '@/types/mpr';
import type { ImageSet, Annotation } from '@/types';
import { annotationsApi } from '@/lib/annotations';

export const MPR_PRESET_CLASSES = [
  { name: 'Tumor',      color: '#FF6B6B' },
  { name: 'Lesion',     color: '#FF9F43' },
  { name: 'Edema',      color: '#FECA57' },
  { name: 'Normal',     color: '#48DBFB' },
  { name: 'Background', color: '#A29BFE' },
  { name: 'Vessel',     color: '#55EFC4' },
];

// ─── Shape ↔ Backend serialisation ───────────────────────────────────────────

/**
 * Convert a backend Annotation record back into an AnnotationShape for the MPR viewer.
 * The shape type is encoded as a prefix in the label: e.g. "circle::Tumor".
 */
export function apiAnnotationToShape(ann: Annotation): AnnotationShape {
  const sep = ann.label.indexOf('::');
  const typeStr = sep >= 0 ? ann.label.slice(0, sep) : 'polygon';
  const actualLabel = sep >= 0 ? ann.label.slice(sep + 2) : ann.label;
  const validTypes = ['polygon', 'brush', 'circle', 'rectangle'];
  const type = validTypes.includes(typeStr) ? typeStr : 'polygon';
  const pts = ann.polygon_data;

  if (type === 'circle') {
    const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
    const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
    const radius = pts.reduce((s, p) => s + Math.sqrt((p.x - cx) ** 2 + (p.y - cy) ** 2), 0) / pts.length;
    return { id: String(ann.id), type: 'circle', label: actualLabel, color: ann.color, cx, cy, radius };
  }
  if (type === 'rectangle') {
    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => p.y);
    const x = Math.min(...xs), y = Math.min(...ys);
    return { id: String(ann.id), type: 'rectangle', label: actualLabel, color: ann.color,
      x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
  }
  return { id: String(ann.id), type: type as 'polygon' | 'brush', label: actualLabel, color: ann.color, points: pts };
}

/**
 * Convert an AnnotationShape to the payload format expected by the backend.
 * Shape type is encoded into the label field. Circles/rects become polygon approximations.
 */
function shapeToApiPayload(
  shape: AnnotationShape,
  imageId: number,
  sliceIndex: number
) {
  let polygon_data: { x: number; y: number }[];
  const encodedLabel = `${shape.type}::${shape.label}`;

  if (shape.type === 'polygon' || shape.type === 'brush') {
    const pts = (shape as PolygonShape).points || [];
    polygon_data = pts.length >= 3
      ? pts
      : [...pts, ...Array(3 - pts.length).fill({ x: 0, y: 0 })];
  } else if (shape.type === 'circle') {
    const c = shape as CircleShape;
    // Approximate circle as 16-point polygon
    polygon_data = Array.from({ length: 16 }, (_, i) => {
      const angle = (i / 16) * Math.PI * 2;
      return { x: c.cx + Math.cos(angle) * c.radius, y: c.cy + Math.sin(angle) * c.radius };
    });
  } else {
    const r = shape as RectangleShape;
    // Rectangle → 4 corners
    polygon_data = [
      { x: r.x, y: r.y },
      { x: r.x + r.w, y: r.y },
      { x: r.x + r.w, y: r.y + r.h },
      { x: r.x, y: r.y + r.h },
    ];
  }

  return { image: imageId, label: encodedLabel, color: shape.color, polygon_data, frame_time: sliceIndex };
}

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
  commitAnnotation: (plane: MPRPlane, sliceIndex: number) => Promise<void>;
  removeAnnotation: (plane: MPRPlane, sliceIndex: number, id: string) => Promise<void>;
  clearSliceAnnotations: (plane: MPRPlane, sliceIndex: number) => void;

  // Pending naming dialog
  pendingAnnotation: {
    plane: MPRPlane;
    sliceIndex: number;
    shape: AnnotationShape;
  } | null;
  savePendingAnnotation: (name: string, category: string) => Promise<void>;
  cancelPendingAnnotation: () => void;

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

  assignSeries: (plane, imageSet) => {
    // Build mprAnnotations from existing backend annotations embedded in the imageSet
    const newSliceAnnotations: Record<number, AnnotationShape[]> = {};
    if (imageSet) {
      imageSet.images.forEach((img, sliceIndex) => {
        if (img.annotations && img.annotations.length > 0) {
          newSliceAnnotations[sliceIndex] = img.annotations.map(apiAnnotationToShape);
        }
      });
    }
    set((s) => ({
      series: { ...s.series, [plane]: imageSet },
      viewers: {
        ...s.viewers,
        [plane]: { ...DEFAULT_VIEWER_STATE },
      },
      // Merge in loaded annotations for this plane, keep other planes intact
      mprAnnotations: {
        ...s.mprAnnotations,
        [plane]: newSliceAnnotations,
      },
    }));
  },

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

  commitAnnotation: async (plane, sliceIndex) => {
    const { viewers, selectedClass, selectedColor } = get();
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

    // Intercept: Set pending annotation to open the naming dialog overlay
    set({
      pendingAnnotation: {
        plane,
        sliceIndex,
        shape,
      },
    });
    get().clearInProgress(plane);
  },

  pendingAnnotation: null,

  savePendingAnnotation: async (name, category) => {
    const pending = get().pendingAnnotation;
    if (!pending) return;

    const { plane, sliceIndex, shape } = pending;
    const { mprAnnotations, series } = get();

    // Look up color for the class, otherwise default to violet
    const preset = MPR_PRESET_CLASSES.find((c) => c.name.toLowerCase() === category.toLowerCase());
    const finalColor = preset?.color ?? '#7c3aed';

    // Update shape label, category, name, and color
    const updatedShape: AnnotationShape = {
      ...shape,
      label: name,
      color: finalColor,
      name,
      category,
    };

    const snapshot = JSON.parse(JSON.stringify(mprAnnotations)) as MPRAnnotations;
    const existing = mprAnnotations[plane][sliceIndex] ?? [];

    const next: MPRAnnotations = {
      ...mprAnnotations,
      [plane]: {
        ...mprAnnotations[plane],
        [sliceIndex]: [...existing, updatedShape],
      },
    };

    set((s) => ({
      mprAnnotations: next,
      undoStack: [...s.undoStack.slice(-49), snapshot],
      redoStack: [],
      pendingAnnotation: null,
    }));

    // Persist to backend
    const imageSet = series[plane];
    const image = imageSet?.images[sliceIndex];
    if (image) {
      try {
        const payload = shapeToApiPayload(updatedShape, image.id, sliceIndex);
        const saved = await annotationsApi.createAnnotation(payload);
        set((s) => {
          const sliceShapes = s.mprAnnotations[plane][sliceIndex] ?? [];
          return {
            mprAnnotations: {
              ...s.mprAnnotations,
              [plane]: {
                ...s.mprAnnotations[plane],
                [sliceIndex]: sliceShapes.map((sh) =>
                  sh.id === updatedShape.id ? { ...sh, id: String(saved.id) } : sh
                ),
              },
            },
          };
        });
      } catch (err) {
        console.error('Failed to persist annotation to backend:', err);
      }
    }
  },

  cancelPendingAnnotation: () => {
    set({ pendingAnnotation: null });
  },

  removeAnnotation: async (plane, sliceIndex, id) => {
    const { mprAnnotations } = get();
    const snapshot = JSON.parse(JSON.stringify(mprAnnotations)) as MPRAnnotations;
    const existing = mprAnnotations[plane][sliceIndex] ?? [];
    // Remove from local state immediately
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
    // Persist deletion — id is the backend integer id as string
    const numId = parseInt(id);
    if (!isNaN(numId)) {
      try {
        await annotationsApi.deleteAnnotation(numId);
      } catch (err) {
        console.error('Failed to delete annotation from backend:', err);
      }
    }
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

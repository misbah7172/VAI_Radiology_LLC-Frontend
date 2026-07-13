// ─── MPR (Multi-Planar Reconstruction) Type Definitions ────────────────────────

export type MPRPlane = 'axial' | 'sagittal' | 'coronal';

export type DrawingTool = 'pencil' | 'brush' | 'circle' | 'rectangle' | 'eraser';

export interface WindowPreset {
  name: string;
  ww: number; // window width
  wl: number; // window level (center)
}

export const WINDOW_PRESETS: WindowPreset[] = [
  { name: 'Default',     ww: 255,  wl: 127  },
  { name: 'Bone',        ww: 200,  wl: 200  },
  { name: 'Soft Tissue', ww: 150,  wl: 80   },
  { name: 'Brain',       ww: 80,   wl: 80   },
  { name: 'Lung',        ww: 220,  wl: 40   },
];

export const PLANE_COLORS: Record<MPRPlane, string> = {
  axial:    '#f87171', // red
  sagittal: '#4ade80', // green
  coronal:  '#60a5fa', // blue
};

export const PLANE_LABELS: Record<MPRPlane, string> = {
  axial:    'Axial',
  sagittal: 'Sagittal',
  coronal:  'Coronal',
};

// ─── Normalized Coordinates (0–1 relative to image size) ──────────────────────

export interface NormalizedPoint {
  x: number; // 0–1
  y: number; // 0–1
}

// ─── Annotation Shapes ────────────────────────────────────────────────────────

export type AnnotationShapeType = 'polygon' | 'circle' | 'rectangle' | 'brush';

export interface BaseAnnotationShape {
  id: string;
  type: AnnotationShapeType;
  /** Display label (set from selected preset class) */
  label: string;
  color: string;
  /** User-supplied name for this specific mark (e.g. "Tumor A") */
  name?: string;
  /** Category from the naming dialog (e.g. "Tumor", "Lesion") */
  category?: string;
}

export interface PolygonShape extends BaseAnnotationShape {
  type: 'polygon' | 'brush';
  points: NormalizedPoint[];
}

export interface CircleShape extends BaseAnnotationShape {
  type: 'circle';
  cx: number; // normalized center x
  cy: number; // normalized center y
  radius: number; // normalized radius
}

export interface RectangleShape extends BaseAnnotationShape {
  type: 'rectangle';
  x: number;  // normalized top-left x
  y: number;  // normalized top-left y
  w: number;  // normalized width
  h: number;  // normalized height
}

export type AnnotationShape = PolygonShape | CircleShape | RectangleShape;

// Per-slice: slice index → shapes
export type PlaneAnnotations = Record<number, AnnotationShape[]>;

// Per-plane
export type MPRAnnotations = {
  axial:    PlaneAnnotations;
  sagittal: PlaneAnnotations;
  coronal:  PlaneAnnotations;
};

// ─── Crosshair ────────────────────────────────────────────────────────────────

/**
 * Normalized (0–1) crosshair position in each axis.
 * - axialFrac:    which fraction of axial slices the crosshair is at
 * - sagittalFrac: which fraction of sagittal slices
 * - coronalFrac:  which fraction of coronal slices
 */
export interface CrosshairState {
  axialFrac:    number; // 0–1
  sagittalFrac: number; // 0–1
  coronalFrac:  number; // 0–1
}

// ─── Per-Viewer State ─────────────────────────────────────────────────────────

export interface ViewerState {
  sliceIndex:          number;
  zoom:                number;
  panX:                number;
  panY:                number;
  windowWidth:         number;
  windowLevel:         number;
  applyWindow:         boolean;
  hideAnnotations:     boolean;
  hidePrevAnnotations: boolean;
  activeTool:          DrawingTool;
  // In-progress drawing (current incomplete annotation)
  inProgressPoints:    NormalizedPoint[];
  inProgressStart:     NormalizedPoint | null; // for circle/rect drag start
}

export const DEFAULT_VIEWER_STATE: ViewerState = {
  sliceIndex:          0,
  zoom:                1,
  panX:                0,
  panY:                0,
  windowWidth:         255,
  windowLevel:         127,
  applyWindow:         false,
  hideAnnotations:     false,
  hidePrevAnnotations: true,
  activeTool:          'pencil',
  inProgressPoints:    [],
  inProgressStart:     null,
};

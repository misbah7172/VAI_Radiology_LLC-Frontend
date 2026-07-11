'use client';

import { useMPRStore } from '@/stores/mprStore';
import type { MPRPlane, AnnotationShape, NormalizedPoint } from '@/types/mpr';

interface Props {
  plane: MPRPlane;
  // The pixel bounding box of the image on the canvas (after zoom/pan)
  imageBounds: { x: number; y: number; w: number; h: number } | null;
  // Canvas element dimensions
  canvasWidth: number;
  canvasHeight: number;
}

function normalizedToSVG(
  pt: NormalizedPoint,
  bounds: { x: number; y: number; w: number; h: number }
): { x: number; y: number } {
  return {
    x: bounds.x + pt.x * bounds.w,
    y: bounds.y + pt.y * bounds.h,
  };
}

function shapeToSVG(
  shape: AnnotationShape,
  bounds: { x: number; y: number; w: number; h: number },
  opacity = 1,
  key: string
): React.ReactNode {
  const style: React.CSSProperties = { opacity };

  if (shape.type === 'polygon' || shape.type === 'brush') {
    if (shape.points.length < 2) return null;
    const pts = shape.points
      .map((p) => {
        const sv = normalizedToSVG(p, bounds);
        return `${sv.x},${sv.y}`;
      })
      .join(' ');
    const closed = shape.type === 'polygon';
    return (
      <g key={key} style={style}>
        {closed ? (
          <polygon
            points={pts}
            fill={shape.color + '33'}
            stroke={shape.color}
            strokeWidth={1.5}
          />
        ) : (
          <polyline
            points={pts}
            fill="none"
            stroke={shape.color}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </g>
    );
  }

  if (shape.type === 'circle') {
    const c = normalizedToSVG({ x: shape.cx!, y: shape.cy! }, bounds);
    const r = shape.radius! * bounds.w;
    return (
      <g key={key} style={style}>
        <circle
          cx={c.x} cy={c.y} r={r}
          fill={shape.color + '33'}
          stroke={shape.color}
          strokeWidth={1.5}
        />
      </g>
    );
  }

  if (shape.type === 'rectangle') {
    const tl = normalizedToSVG({ x: shape.x!, y: shape.y! }, bounds);
    const rw = shape.w! * bounds.w;
    const rh = shape.h! * bounds.h;
    return (
      <g key={key} style={style}>
        <rect
          x={tl.x} y={tl.y} width={rw} height={rh}
          fill={shape.color + '33'}
          stroke={shape.color}
          strokeWidth={1.5}
        />
      </g>
    );
  }

  return null;
}

export default function AnnotationLayerMPR({ plane, imageBounds, canvasWidth, canvasHeight }: Props) {
  const { viewers, mprAnnotations } = useMPRStore();
  const v = viewers[plane];

  if (!imageBounds) return null;

  const currentSlice = v.sliceIndex;
  const currentAnnotations: AnnotationShape[] = mprAnnotations[plane][currentSlice] ?? [];
  const prevAnnotations: AnnotationShape[] =
    currentSlice > 0 ? (mprAnnotations[plane][currentSlice - 1] ?? []) : [];

  // In-progress shape preview
  const inProgressPoints = v.inProgressPoints;
  const inProgressStart = v.inProgressStart;
  const tool = v.activeTool;

  const renderInProgress = () => {
    if (!tool || tool === 'eraser') return null;
    if ((tool === 'pencil' || tool === 'brush') && inProgressPoints.length < 1) return null;
    if ((tool === 'circle' || tool === 'rectangle') && (!inProgressStart || inProgressPoints.length < 1)) return null;

    const { selectedColor } = useMPRStore.getState();

    if (tool === 'pencil' || tool === 'brush') {
      const pts = inProgressPoints
        .map((p) => {
          const sv = normalizedToSVG(p, imageBounds);
          return `${sv.x},${sv.y}`;
        })
        .join(' ');
      return (
        <polyline
          points={pts}
          fill="none"
          stroke={selectedColor}
          strokeWidth={1.5}
          strokeDasharray="4 2"
          strokeLinecap="round"
        />
      );
    }

    const last = inProgressPoints[inProgressPoints.length - 1];
    const start = inProgressStart!;

    if (tool === 'circle') {
      const c = normalizedToSVG({ x: (start.x + last.x) / 2, y: (start.y + last.y) / 2 }, imageBounds);
      const dx = (last.x - start.x) * imageBounds.w;
      const dy = (last.y - start.y) * imageBounds.h;
      const r = Math.sqrt(dx * dx + dy * dy) / 2;
      return (
        <circle cx={c.x} cy={c.y} r={r}
          fill={selectedColor + '22'} stroke={selectedColor}
          strokeWidth={1.5} strokeDasharray="4 2" />
      );
    }

    if (tool === 'rectangle') {
      const tl = normalizedToSVG(
        { x: Math.min(start.x, last.x), y: Math.min(start.y, last.y) },
        imageBounds
      );
      const rw = Math.abs(last.x - start.x) * imageBounds.w;
      const rh = Math.abs(last.y - start.y) * imageBounds.h;
      return (
        <rect x={tl.x} y={tl.y} width={rw} height={rh}
          fill={selectedColor + '22'} stroke={selectedColor}
          strokeWidth={1.5} strokeDasharray="4 2" />
      );
    }

    return null;
  };

  return (
    <svg
      style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        pointerEvents: 'none', zIndex: 10,
        overflow: 'visible',
      }}
      viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
    >
      {/* Previous slice annotations (dimmed) */}
      {!v.hidePrevAnnotations && prevAnnotations.map((shape) =>
        shapeToSVG(shape, imageBounds, 0.35, `prev-${shape.id}`)
      )}

      {/* Current slice annotations */}
      {!v.hideAnnotations && currentAnnotations.map((shape) =>
        shapeToSVG(shape, imageBounds, 1, shape.id)
      )}

      {/* In-progress drawing */}
      {renderInProgress()}
    </svg>
  );
}

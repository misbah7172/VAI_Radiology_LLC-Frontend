'use client';

import { useMPRStore } from '@/stores/mprStore';
import { PLANE_COLORS } from '@/types/mpr';
import type { MPRPlane } from '@/types/mpr';

interface Props {
  plane: MPRPlane;
  imageBounds: { x: number; y: number; w: number; h: number } | null;
  canvasWidth: number;
  canvasHeight: number;
  onCrosshairDrag: (normX: number, normY: number) => void;
}

export default function CrosshairOverlay({
  plane,
  imageBounds,
  canvasWidth,
  canvasHeight,
  onCrosshairDrag,
}: Props) {
  const { crosshair } = useMPRStore();

  if (!imageBounds) return null;

  /**
   * Map crosshair fractions to pixel positions inside the image bounds.
   * - Axial viewer: crosshair shows sagittalFrac (X) and coronalFrac (Y)
   * - Sagittal viewer: crosshair shows coronalFrac (X) and axialFrac (Y)
   * - Coronal viewer: crosshair shows sagittalFrac (X) and axialFrac (Y)
   */
  let crosshairPxX: number;
  let crosshairPxY: number;

  if (plane === 'axial') {
    crosshairPxX = imageBounds.x + crosshair.sagittalFrac * imageBounds.w;
    crosshairPxY = imageBounds.y + crosshair.coronalFrac * imageBounds.h;
  } else if (plane === 'sagittal') {
    crosshairPxX = imageBounds.x + crosshair.coronalFrac * imageBounds.w;
    crosshairPxY = imageBounds.y + crosshair.axialFrac * imageBounds.h;
  } else {
    // coronal
    crosshairPxX = imageBounds.x + crosshair.sagittalFrac * imageBounds.w;
    crosshairPxY = imageBounds.y + crosshair.axialFrac * imageBounds.h;
  }

  const lineColor = PLANE_COLORS[plane];
  const crosshairColor = '#ffffff';
  const crosshairOpacity = 0.75;

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    // Only handle middle/right button or crosshair-drag — left button is for drawing tools
    if (e.button !== 1) return; // middle mouse only
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  // SVG click on crosshair center → drag to reposition
  const handleCenterDrag = (e: React.PointerEvent<SVGCircleElement>) => {
    if (e.type !== 'pointermove' || e.buttons !== 1) return;
    const svg = e.currentTarget.closest('svg') as SVGSVGElement;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    // Convert to normalized image coords
    const normX = Math.max(0, Math.min(1, (px - imageBounds.x) / imageBounds.w));
    const normY = Math.max(0, Math.min(1, (py - imageBounds.y) / imageBounds.h));
    onCrosshairDrag(normX, normY);
  };

  return (
    <svg
      style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        pointerEvents: 'none', zIndex: 20,
        overflow: 'visible',
      }}
      viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
      onPointerDown={handlePointerDown}
    >
      {/* Horizontal line */}
      <line
        x1={imageBounds.x}
        y1={crosshairPxY}
        x2={imageBounds.x + imageBounds.w}
        y2={crosshairPxY}
        stroke={lineColor}
        strokeWidth={1}
        strokeOpacity={crosshairOpacity}
        strokeDasharray="none"
      />
      {/* Vertical line */}
      <line
        x1={crosshairPxX}
        y1={imageBounds.y}
        x2={crosshairPxX}
        y2={imageBounds.y + imageBounds.h}
        stroke={lineColor}
        strokeWidth={1}
        strokeOpacity={crosshairOpacity}
      />
      {/* Center dot — draggable */}
      <circle
        cx={crosshairPxX}
        cy={crosshairPxY}
        r={5}
        fill={crosshairColor}
        fillOpacity={0.9}
        stroke={lineColor}
        strokeWidth={1.5}
        style={{ cursor: 'crosshair', pointerEvents: 'all' }}
        onPointerMove={handleCenterDrag}
      />
    </svg>
  );
}

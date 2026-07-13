'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { useMPRStore } from '@/stores/mprStore';
import { useAnnotationStore } from '@/stores/annotationStore';
import { PLANE_COLORS, PLANE_LABELS } from '@/types/mpr';
import type { MPRPlane } from '@/types/mpr';
import ViewerTopToolbar from './ViewerTopToolbar';
import ViewerBottomToolbar from './ViewerBottomToolbar';
import ViewerCanvas from './ViewerCanvas';

interface Props {
  plane: MPRPlane;
}

export default function ViewerPanel({ plane }: Props) {
  const { activePlane, setActivePlane, series, assignSeries, viewers } = useMPRStore();
  const { imageSets } = useAnnotationStore();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [imgWidth, setImgWidth] = useState(0);
  const [imgHeight, setImgHeight] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);

  const isActive = activePlane === plane;
  const hasSeries = !!series[plane];
  const planeColor = PLANE_COLORS[plane];
  const planeLabel = PLANE_LABELS[plane];
  const totalSlices = series[plane]?.images.length ?? 0;
  const v = viewers[plane];

  // ── Keyboard navigation (only when this panel is active) ────────────────
  useEffect(() => {
    if (!isActive) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        useMPRStore.getState().deltaSlice(plane, -1);
        e.preventDefault();
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        useMPRStore.getState().deltaSlice(plane, 1);
        e.preventDefault();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        useMPRStore.getState().undo();
        e.preventDefault();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
        useMPRStore.getState().redo();
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isActive, plane]);

  // ── Drag and drop (from sidebar) ─────────────────────────────────────────
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragOver(false), []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const setIdStr = e.dataTransfer.getData('text/plain');
    const setId = parseInt(setIdStr);
    if (isNaN(setId)) return;
    const found = imageSets.find((s) => s.id === setId);
    if (found) assignSeries(plane, found);
  }, [plane, assignSeries, imageSets]);

  const handleImgSizeChange = useCallback((w: number, h: number) => {
    setImgWidth(w);
    setImgHeight(h);
  }, []);

  return (
    <div
      id={`viewer-panel-${plane}`}
      onClick={() => setActivePlane(plane)}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minWidth: 0,
        height: '100%',
        position: 'relative',
        outline: isActive
          ? `2px solid ${planeColor}40`
          : isDragOver
          ? `2px dashed ${planeColor}`
          : '2px solid transparent',
        outlineOffset: '-2px',
        transition: 'outline 0.15s ease',
        backgroundColor: '#08080c',
      }}
    >
      {/* Active plane indicator strip */}
      <div style={{
        height: '2px',
        background: isActive
          ? `linear-gradient(90deg, transparent, ${planeColor}, transparent)`
          : 'transparent',
        flexShrink: 0,
        transition: 'background 0.2s ease',
      }} />

      {/* Top toolbar */}
      <ViewerTopToolbar plane={plane} />

      {/* Canvas area OR empty state */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', minHeight: 0 }}>

        {/* ── Empty state when no series is loaded ── */}
        {!hasSeries && !isDragOver && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 10,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: '12px', padding: '20px', textAlign: 'center',
            background: 'radial-gradient(ellipse at center, #0d0d14 0%, #08080c 100%)',
          }}>
            {/* Plane icon ring */}
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: `radial-gradient(circle, ${planeColor}18, transparent 70%)`,
              border: `1.5px dashed ${planeColor}44`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '26px',
              animation: 'pulse 2.5s ease-in-out infinite',
            }}>
              {plane === 'axial' ? '🔵' : plane === 'sagittal' ? '🟢' : '🟠'}
            </div>

            {/* Plane title */}
            <div>
              <p style={{
                margin: 0, fontSize: '16px', fontWeight: 700,
                color: planeColor, letterSpacing: '0.04em',
              }}>
                {planeLabel}
              </p>
              <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#3a3a52', lineHeight: 1.5 }}>
                {plane === 'axial'
                  ? 'Horizontal cross-sections · top-down view'
                  : plane === 'sagittal'
                  ? 'Vertical left-right slices · side view'
                  : 'Vertical front-back slices · front view'}
              </p>
            </div>

            {/* Drag instruction */}
            <div style={{
              border: `1px dashed ${planeColor}33`,
              borderRadius: '10px',
              padding: '12px 18px',
              maxWidth: '200px',
            }}>
              <p style={{ margin: 0, fontSize: '11px', color: '#4a4a62', lineHeight: 1.6 }}>
                <span style={{ display: 'block', fontSize: '18px', marginBottom: '6px' }}>📂</span>
                Drag an image set from the{' '}
                <span style={{ color: planeColor, fontWeight: 600 }}>left sidebar</span>
                {' '}and drop it here
              </p>
            </div>

            <p style={{ margin: 0, fontSize: '10px', color: '#2a2a3a' }}>
              or import new files with the Import button above
            </p>
          </div>
        )}

        {hasSeries && (
          <ViewerCanvas
            plane={plane}
            canvasRef={canvasRef}
            onImgSizeChange={handleImgSizeChange}
          />
        )}

        {/* Drag-over drop target overlay */}
        {isDragOver && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 40,
            backgroundColor: `${planeColor}18`,
            border: `2px dashed ${planeColor}`,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: '8px',
            pointerEvents: 'none',
          }}>
            <span style={{ fontSize: '32px' }}>📂</span>
            <p style={{ fontSize: '13px', fontWeight: 600, color: planeColor }}>
              Load as {planeLabel} Series
            </p>
          </div>
        )}

        {/* Series info badge (top-right corner) */}
        {hasSeries && (
          <div style={{
            position: 'absolute', top: '8px', right: '8px', zIndex: 25,
            display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px',
            pointerEvents: 'none',
          }}>
            <div style={{
              backgroundColor: `${planeColor}22`,
              border: `1px solid ${planeColor}66`,
              borderRadius: '5px',
              padding: '2px 8px',
              fontSize: '10px',
              fontWeight: 700,
              color: planeColor,
              letterSpacing: '0.06em',
            }}>
              {planeLabel.toUpperCase()}
            </div>
            <div style={{
              backgroundColor: 'rgba(0,0,0,0.6)',
              borderRadius: '4px',
              padding: '1px 6px',
              fontSize: '9px',
              color: '#8888a8',
              fontFamily: 'monospace',
            }}>
              {v.sliceIndex + 1}/{totalSlices} · z{v.zoom.toFixed(1)}×
            </div>
          </div>
        )}
      </div>

      {/* Bottom toolbar */}
      <ViewerBottomToolbar
        plane={plane}
        canvasRef={canvasRef}
        imgWidth={imgWidth}
        imgHeight={imgHeight}
      />

      {/* Series label strip (bottom) */}
      {hasSeries && (
        <div style={{
          padding: '4px 12px',
          backgroundColor: '#0a0a10',
          borderTop: '1px solid #1a1a26',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          flexShrink: 0,
        }}>
          <div style={{
            width: '6px', height: '6px', borderRadius: '50%',
            backgroundColor: planeColor, flexShrink: 0,
          }} />
          <span style={{ fontSize: '10px', color: '#63637e' }}>
            Series Review: <span style={{ color: planeColor }}>{planeLabel}</span>
            {' · '}{totalSlices} slices
          </span>
        </div>
      )}
    </div>
  );
}

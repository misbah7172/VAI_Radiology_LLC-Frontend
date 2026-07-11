'use client';

import {
  useRef, useEffect, useCallback, useState, useMemo,
} from 'react';
import { useMPRStore } from '@/stores/mprStore';
import { buildWindowLUT, applyLUT } from '@/hooks/useWindowLevel';
import CrosshairOverlay from './CrosshairOverlay';
import AnnotationLayerMPR from './AnnotationLayerMPR';
import type { MPRPlane, NormalizedPoint, ViewerState } from '@/types/mpr';

// ─── Module-level image cache ─────────────────────────────────────────────────
const IMAGE_CACHE = new Map<string, ImageBitmap>();
const WINDOW_CACHE = new Map<string, ImageBitmap>(); // cached windowed version

async function loadImageBitmap(url: string): Promise<ImageBitmap> {
  if (IMAGE_CACHE.has(url)) return IMAGE_CACHE.get(url)!;
  const response = await fetch(url);
  const blob = await response.blob();
  const bmp = await createImageBitmap(blob);
  IMAGE_CACHE.set(url, bmp);
  return bmp;
}

async function loadWindowedBitmap(
  url: string, ww: number, wl: number, lut: Uint8Array
): Promise<ImageBitmap> {
  const key = `${url}:${ww}:${wl}`;
  if (WINDOW_CACHE.has(key)) return WINDOW_CACHE.get(key)!;
  const src = await loadImageBitmap(url);
  const offscreen = new OffscreenCanvas(src.width, src.height);
  const ctx = offscreen.getContext('2d')!;
  ctx.drawImage(src, 0, 0);
  const imageData = ctx.getImageData(0, 0, src.width, src.height);
  applyLUT(imageData, lut);
  ctx.putImageData(imageData, 0, 0);
  const result = await createImageBitmap(offscreen);
  WINDOW_CACHE.set(key, result);
  return result;
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  plane: MPRPlane;
  onImgSizeChange: (w: number, h: number) => void;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ViewerCanvas({ plane, onImgSizeChange, canvasRef }: Props) {
  const store = useMPRStore();
  const {
    series, viewers, setZoom, deltaPan, setSlice, updateCrosshair,
    setActivePlane, addInProgressPoint, setInProgressStart,
    commitAnnotation, setWindowLevel,
  } = store;

  const v: ViewerState = viewers[plane];
  const imageSet = series[plane];
  const currentImage = imageSet?.images[v.sliceIndex] ?? null;
  const currentUrl = currentImage?.file_url ?? null;

  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ w: 800, h: 600 });
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const [imageBounds, setImageBounds] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  // Right-click drag for window/level
  const rightDragRef = useRef<{ startX: number; startY: number; startWW: number; startWL: number } | null>(null);
  // Left drag for pan
  const panDragRef = useRef<{ startX: number; startY: number } | null>(null);
  // Drawing drag for circle/rect
  const drawDragRef = useRef<boolean>(false);

  // LUT memoized
  const lut = useMemo(
    () => buildWindowLUT(v.windowWidth, v.windowLevel),
    [v.windowWidth, v.windowLevel]
  );

  // ── Resize observer ──────────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setCanvasSize({ w: Math.floor(width), h: Math.floor(height) });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────
  const render = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || !currentUrl) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cw = canvas.width;
    const ch = canvas.height;
    ctx.clearRect(0, 0, cw, ch);

    // Background
    ctx.fillStyle = '#030303';
    ctx.fillRect(0, 0, cw, ch);

    // Load bitmap
    let bitmap: ImageBitmap;
    try {
      bitmap = v.applyWindow
        ? await loadWindowedBitmap(currentUrl, v.windowWidth, v.windowLevel, lut)
        : await loadImageBitmap(currentUrl);
    } catch {
      return;
    }

    const iw = bitmap.width;
    const ih = bitmap.height;

    if (imgSize.w !== iw || imgSize.h !== ih) {
      setImgSize({ w: iw, h: ih });
      onImgSizeChange(iw, ih);
    }

    // Compute draw position: center image then apply pan/zoom
    const scale = v.zoom;
    const drawW = iw * scale;
    const drawH = ih * scale;
    const drawX = (cw - drawW) / 2 + v.panX;
    const drawY = (ch - drawH) / 2 + v.panY;

    ctx.drawImage(bitmap, drawX, drawY, drawW, drawH);

    // Update image bounds for overlays
    setImageBounds({ x: drawX, y: drawY, w: drawW, h: drawH });
  }, [canvasRef, currentUrl, v.zoom, v.panX, v.panY, v.applyWindow, v.windowWidth, v.windowLevel, lut, onImgSizeChange, imgSize.w, imgSize.h]);

  useEffect(() => {
    const id = requestAnimationFrame(() => { render(); });
    return () => cancelAnimationFrame(id);
  }, [render]);

  // ── Coordinate helpers ────────────────────────────────────────────────────
  const mouseToNorm = useCallback((e: React.MouseEvent | MouseEvent): NormalizedPoint | null => {
    const canvas = canvasRef.current;
    if (!canvas || !imageBounds) return null;
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const nx = (px - imageBounds.x) / imageBounds.w;
    const ny = (py - imageBounds.y) / imageBounds.h;
    if (nx < 0 || nx > 1 || ny < 0 || ny > 1) return null;
    return { x: nx, y: ny };
  }, [canvasRef, imageBounds]);

  // ── Mouse wheel: scroll slices ────────────────────────────────────────────
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      // Ctrl+wheel → zoom
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom(plane, v.zoom * delta);
    } else {
      // Scroll slices
      const direction = e.deltaY > 0 ? 1 : -1;
      const total = series[plane]?.images.length ?? 1;
      const newSlice = Math.max(0, Math.min(total - 1, v.sliceIndex + direction));
      setSlice(plane, newSlice);
      // Update crosshair fraction
      updateCrosshair({
        [`${plane}Frac`]: total > 1 ? newSlice / (total - 1) : 0,
      } as Parameters<typeof updateCrosshair>[0]);
    }
  }, [plane, v.zoom, v.sliceIndex, series, setZoom, setSlice, updateCrosshair]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [handleWheel, canvasRef]);

  // ── Mouse down ────────────────────────────────────────────────────────────
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setActivePlane(plane);

    if (e.button === 2) {
      // Right click → window/level drag
      rightDragRef.current = {
        startX: e.clientX, startY: e.clientY,
        startWW: v.windowWidth, startWL: v.windowLevel,
      };
      return;
    }

    if (e.button === 1) {
      // Middle click → pan start
      panDragRef.current = { startX: e.clientX, startY: e.clientY };
      return;
    }

    if (e.button === 0) {
      const tool = v.activeTool;
      if (tool === 'eraser') {
        // TODO: erase annotation under cursor
        return;
      }
      if (tool === 'pencil') {
        const pt = mouseToNorm(e);
        if (pt) addInProgressPoint(plane, pt);
        return;
      }
      if (tool === 'brush') {
        const pt = mouseToNorm(e);
        if (pt) {
          addInProgressPoint(plane, pt);
          drawDragRef.current = true;
        }
        return;
      }
      if (tool === 'circle' || tool === 'rectangle') {
        const pt = mouseToNorm(e);
        if (pt) {
          setInProgressStart(plane, pt);
          addInProgressPoint(plane, pt);
          drawDragRef.current = true;
        }
        return;
      }
      // Default: pan
      panDragRef.current = { startX: e.clientX, startY: e.clientY };
    }
  }, [plane, v.activeTool, v.windowWidth, v.windowLevel, mouseToNorm, setActivePlane, addInProgressPoint, setInProgressStart]);

  // ── Mouse move ────────────────────────────────────────────────────────────
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    // Right drag → window/level
    if (rightDragRef.current) {
      const dx = e.clientX - rightDragRef.current.startX;
      const dy = e.clientY - rightDragRef.current.startY;
      const newWW = Math.max(1, rightDragRef.current.startWW + dx * 2);
      const newWL = rightDragRef.current.startWL - dy * 2;
      WINDOW_CACHE.clear(); // invalidate windowed cache
      setWindowLevel(plane, newWW, newWL);
      return;
    }

    // Pan drag
    if (panDragRef.current) {
      const dx = e.clientX - panDragRef.current.startX;
      const dy = e.clientY - panDragRef.current.startY;
      panDragRef.current = { startX: e.clientX, startY: e.clientY };
      deltaPan(plane, dx, dy);
      return;
    }

    // Brush / shape drag
    if (drawDragRef.current) {
      const tool = v.activeTool;
      const pt = mouseToNorm(e);
      if (!pt) return;
      if (tool === 'brush') {
        addInProgressPoint(plane, pt);
      } else if (tool === 'circle' || tool === 'rectangle') {
        // Update end point (keep only start + current end)
        addInProgressPoint(plane, pt);
      }
    }
  }, [plane, v.activeTool, mouseToNorm, deltaPan, setWindowLevel, addInProgressPoint]);

  // ── Mouse up ──────────────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleMouseUp = useCallback((_e: React.MouseEvent<HTMLCanvasElement>) => {
    if (rightDragRef.current) { rightDragRef.current = null; return; }
    if (panDragRef.current) { panDragRef.current = null; return; }

    if (drawDragRef.current) {
      drawDragRef.current = false;
      const tool = v.activeTool;
      if (tool === 'brush' || tool === 'circle' || tool === 'rectangle') {
        commitAnnotation(plane, v.sliceIndex);
      }
    }
  }, [plane, v.activeTool, v.sliceIndex, commitAnnotation]);

  // ── Double click: reset view ──────────────────────────────────────────────
  const handleDoubleClick = useCallback(() => {
    useMPRStore.getState().resetView(plane);
  }, [plane]);

  // ── Pencil: click to add vertex, double-click to close ────────────────────
  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.detail === 2) return; // handled by dblclick
    if (v.activeTool !== 'pencil') return;
    const pt = mouseToNorm(e);
    if (pt) addInProgressPoint(plane, pt);
  }, [plane, v.activeTool, mouseToNorm, addInProgressPoint]);

  // Prevent context menu on canvas
  const handleContextMenu = useCallback((e: React.MouseEvent) => e.preventDefault(), []);

  // ── Crosshair drag ────────────────────────────────────────────────────────
  const handleCrosshairDrag = useCallback((normX: number, normY: number) => {
    if (plane === 'axial') {
      updateCrosshair({ sagittalFrac: normX, coronalFrac: normY });
      // Update sagittal/coronal slice indices
      const sagSeries = series['sagittal'];
      const corSeries = series['coronal'];
      if (sagSeries) setSlice('sagittal', Math.round(normX * (sagSeries.images.length - 1)));
      if (corSeries) setSlice('coronal', Math.round(normY * (corSeries.images.length - 1)));
    } else if (plane === 'sagittal') {
      updateCrosshair({ coronalFrac: normX, axialFrac: normY });
      const axSeries = series['axial'];
      const corSeries = series['coronal'];
      if (axSeries) setSlice('axial', Math.round(normY * (axSeries.images.length - 1)));
      if (corSeries) setSlice('coronal', Math.round(normX * (corSeries.images.length - 1)));
    } else {
      updateCrosshair({ sagittalFrac: normX, axialFrac: normY });
      const sagSeries = series['sagittal'];
      const axSeries = series['axial'];
      if (sagSeries) setSlice('sagittal', Math.round(normX * (sagSeries.images.length - 1)));
      if (axSeries) setSlice('axial', Math.round(normY * (axSeries.images.length - 1)));
    }
  }, [plane, series, updateCrosshair, setSlice]);

  // ── Cursor style ──────────────────────────────────────────────────────────
  const cursorMap: Record<string, string> = {
    pencil: 'crosshair',
    brush: 'crosshair',
    circle: 'crosshair',
    rectangle: 'crosshair',
    eraser: 'cell',
  };
  const cursor = v.activeTool ? cursorMap[v.activeTool] ?? 'default' : 'grab';

  const hasContent = !!currentUrl;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative', flex: 1, overflow: 'hidden',
        backgroundColor: '#030303',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {/* Drop-zone overlay when no series assigned */}
      {!imageSet && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 30,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: '12px', pointerEvents: 'none',
        }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '16px',
            border: '2px dashed #2e2e42',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '24px',
          }}>
            📂
          </div>
          <p style={{ fontSize: '12px', color: '#3d3d55', textAlign: 'center' }}>
            Drag an image set here<br />from the sidebar
          </p>
        </div>
      )}

      {/* Main canvas */}
      <canvas
        ref={canvasRef as React.RefObject<HTMLCanvasElement>}
        width={canvasSize.w}
        height={canvasSize.h}
        style={{
          display: 'block',
          cursor,
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
      />

      {/* Annotation SVG layer */}
      {hasContent && imageBounds && (
        <AnnotationLayerMPR
          plane={plane}
          imageBounds={imageBounds}
          canvasWidth={canvasSize.w}
          canvasHeight={canvasSize.h}
        />
      )}

      {/* Crosshair SVG layer */}
      {hasContent && imageBounds && (
        <CrosshairOverlay
          plane={plane}
          imageBounds={imageBounds}
          canvasWidth={canvasSize.w}
          canvasHeight={canvasSize.h}
          onCrosshairDrag={handleCrosshairDrag}
        />
      )}

      {/* Slice info HUD (bottom-left overlay) */}
      {hasContent && (
        <div style={{
          position: 'absolute', bottom: '8px', left: '10px',
          fontSize: '10px', color: 'rgba(255,255,255,0.4)',
          fontFamily: 'monospace', pointerEvents: 'none', zIndex: 25,
          lineHeight: 1.5,
        }}>
          {v.applyWindow && `WW: ${v.windowWidth.toFixed(0)}  WL: ${v.windowLevel.toFixed(0)}`}
        </div>
      )}
    </div>
  );
}

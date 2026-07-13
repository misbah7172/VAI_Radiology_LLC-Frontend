'use client';

import {
  useRef, useEffect, useCallback, useState, useMemo,
} from 'react';
import { useMPRStore } from '@/stores/mprStore';
import { buildWindowLUT, applyLUT } from '@/hooks/useWindowLevel';
import { getOptimizedImageUrl } from '@/lib/api';
import CrosshairOverlay from './CrosshairOverlay';
import AnnotationLayerMPR from './AnnotationLayerMPR';
import type { MPRPlane, NormalizedPoint, ViewerState, AnnotationShape } from '@/types/mpr';

// ─── Module-level HTMLImageElement cache ──────────────────────────────────────
// Using HTMLImageElement avoids fetch CORS issues — the browser handles
// cookies / credentials automatically just like a normal <img> tag.
const HTML_IMG_CACHE = new Map<string, HTMLImageElement>();

function preloadHTMLImage(url: string): Promise<HTMLImageElement> {
  if (HTML_IMG_CACHE.has(url)) return Promise.resolve(HTML_IMG_CACHE.get(url)!);
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    // Use crossOrigin='anonymous' so canvas.getImageData() works for CT windowing.
    // Our backend has CORS_ALLOW_ALL_ORIGINS=True so this always succeeds without credentials.
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      HTML_IMG_CACHE.set(url, img);
      resolve(img);
    };
    img.onerror = () => {
      // Fallback: retry without crossOrigin (works for display, but CT windowing
      // will be skipped because canvas would be tainted for getImageData).
      const img2 = new window.Image();
      img2.onload = () => { HTML_IMG_CACHE.set(url, img2); resolve(img2); };
      img2.onerror = () => reject(new Error(`Failed to load image: ${url}`));
      img2.src = url;
    };
    img.src = url;
  });
}

// Apply CT windowing to a loaded HTMLImageElement, returning a data URL
// Uses a hidden canvas — no OffscreenCanvas / no fetch required.
function applyWindowingToImg(
  img: HTMLImageElement,
  lut: Uint8Array
): HTMLCanvasElement | null {
  try {
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    const tmp = document.createElement('canvas');
    tmp.width = w;
    tmp.height = h;
    const ctx = tmp.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, w, h);
    applyLUT(imageData, lut);
    ctx.putImageData(imageData, 0, 0);
    return tmp;
  } catch (err) {
    console.error('Failed to apply CT windowing (potential CORS/taint issue):', err);
    return null;
  }
}


function findClickedAnnotation(
  clickPt: { x: number; y: number },
  shapes: AnnotationShape[]
): AnnotationShape | null {
  const threshold = 0.03; // proximity tolerance in normalized coordinates

  for (const shape of shapes) {
    if (shape.type === 'polygon' || shape.type === 'brush') {
      const pts = shape.points || [];
      // 1. Check vertex proximity
      for (const p of pts) {
        const dx = p.x - clickPt.x;
        const dy = p.y - clickPt.y;
        if (Math.sqrt(dx * dx + dy * dy) < threshold) {
          return shape;
        }
      }
      // 2. Point in polygon ray-casting test
      let inside = false;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const xi = pts[i].x, yi = pts[i].y;
        const xj = pts[j].x, yj = pts[j].y;
        const intersect = ((yi > clickPt.y) !== (yj > clickPt.y))
            && (clickPt.x < (xj - xi) * (clickPt.y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
      }
      if (inside) return shape;
    } else if (shape.type === 'circle') {
      const dx = clickPt.x - shape.cx!;
      const dy = clickPt.y - shape.cy!;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (Math.abs(dist - shape.radius!) < threshold || dist <= shape.radius!) {
        return shape;
      }
    } else if (shape.type === 'rectangle') {
      const left = shape.x!;
      const right = shape.x! + shape.w!;
      const top = shape.y!;
      const bottom = shape.y! + shape.h!;
      if (clickPt.x >= left - threshold && clickPt.x <= right + threshold &&
          clickPt.y >= top - threshold && clickPt.y <= bottom + threshold) {
        return shape;
      }
    }
  }
  return null;
}


// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  plane: MPRPlane;
  onImgSizeChange: (w: number, h: number) => void;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ViewerCanvas({ plane, onImgSizeChange, canvasRef }: Props) {
  const {
    series, viewers, setZoom, deltaPan, setSlice, updateCrosshair,
    setActivePlane, addInProgressPoint, setInProgressStart,
    commitAnnotation, setWindowLevel, removeAnnotation, mprAnnotations,
  } = useMPRStore();

  const v: ViewerState = viewers[plane];
  const imageSet = series[plane];
  const currentImage = imageSet?.images[v.sliceIndex] ?? null;
  const currentUrl = currentImage ? getOptimizedImageUrl(currentImage.file_url, 1080, 85) : null;

  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ w: 4, h: 4 });
  // The loaded HTMLImageElement for the current URL
  const [currentImg, setCurrentImg] = useState<HTMLImageElement | null>(null);
  const [loadError, setLoadError] = useState(false);
  // Pixel bounds of the drawn image (for overlay alignment)
  const [imageBounds, setImageBounds] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  // Right-click drag for window/level
  const rightDragRef = useRef<{ startX: number; startY: number; startWW: number; startWL: number } | null>(null);
  // Left-drag / middle-drag for pan
  const panDragRef = useRef<{ startX: number; startY: number } | null>(null);
  // Drawing drag flag for brush / circle / rect
  const drawDragRef = useRef<boolean>(false);

  // Memoized CT window LUT
  const lut = useMemo(
    () => buildWindowLUT(v.windowWidth, v.windowLevel),
    [v.windowWidth, v.windowLevel]
  );

  // ── Resize observer: keep canvas pixel size = container CSS size ──────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        const w = Math.max(4, Math.floor(width));
        const h = Math.max(4, Math.floor(height));
        setCanvasSize({ w, h });
      }
    });
    ro.observe(el);
    // Trigger immediately
    const rect = el.getBoundingClientRect();
    if (rect.width > 4) setCanvasSize({ w: Math.floor(rect.width), h: Math.floor(rect.height) });
    return () => ro.disconnect();
  }, []);

  // ── Image loading: runs only when URL changes ─────────────────────────────
  useEffect(() => {
    let cancelled = false;
    if (!currentUrl) {
      requestAnimationFrame(() => {
        if (cancelled) return;
        setCurrentImg(null);
        setLoadError(false);
      });
      return;
    }
    requestAnimationFrame(() => {
      if (cancelled) return;
      setLoadError(false);
    });
    preloadHTMLImage(currentUrl)
      .then((img) => {
        if (cancelled) return;
        requestAnimationFrame(() => {
          if (cancelled) return;
          setCurrentImg(img);
          onImgSizeChange(img.naturalWidth, img.naturalHeight);
        });
      })
      .catch(() => {
        if (cancelled) return;
        requestAnimationFrame(() => {
          if (cancelled) return;
          setLoadError(true);
        });
      });
    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUrl]);

  // ── Render: runs when image, viewport, or windowing changes ───────────────
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cw = canvas.width;
    const ch = canvas.height;

    // Clear + dark background
    ctx.fillStyle = '#030303';
    ctx.fillRect(0, 0, cw, ch);

    if (!currentImg) return;

    const iw = currentImg.naturalWidth;
    const ih = currentImg.naturalHeight;
    if (iw === 0 || ih === 0) return;

    // Compute draw rect (centered, then pan/zoom applied)
    const scale = v.zoom;
    const drawW = iw * scale;
    const drawH = ih * scale;
    const drawX = (cw - drawW) / 2 + v.panX;
    const drawY = (ch - drawH) / 2 + v.panY;

    if (v.applyWindow) {
      // Apply windowing via hidden canvas pixel manipulation
      const windowedCanvas = applyWindowingToImg(currentImg, lut);
      if (windowedCanvas) {
        ctx.drawImage(windowedCanvas, drawX, drawY, drawW, drawH);
      } else {
        ctx.drawImage(currentImg, drawX, drawY, drawW, drawH);
      }
    } else {
      ctx.drawImage(currentImg, drawX, drawY, drawW, drawH);
    }

    // Update image bounds ref for overlays (done in rAF, safe to setState)
    setImageBounds({ x: drawX, y: drawY, w: drawW, h: drawH });
  }, [canvasRef, currentImg, v.zoom, v.panX, v.panY, v.applyWindow, lut]);

  // Fire render on every relevant change
  useEffect(() => {
    const id = requestAnimationFrame(render);
    return () => cancelAnimationFrame(id);
  }, [render]);

  // ── Coordinate helper: mouse → normalized image coords ────────────────────
  const mouseToNorm = useCallback((e: MouseEvent | React.MouseEvent): NormalizedPoint | null => {
    const canvas = canvasRef.current;
    if (!canvas || !imageBounds || imageBounds.w === 0 || imageBounds.h === 0) return null;
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const nx = (px - imageBounds.x) / imageBounds.w;
    const ny = (py - imageBounds.y) / imageBounds.h;
    if (nx < 0 || nx > 1 || ny < 0 || ny > 1) return null;
    return { x: Math.max(0, Math.min(1, nx)), y: Math.max(0, Math.min(1, ny)) };
  }, [canvasRef, imageBounds]);

  // ── Mouse wheel: slice scroll (or ctrl+wheel = zoom) ─────────────────────
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      setZoom(plane, v.zoom * factor);
    } else {
      const dir = e.deltaY > 0 ? 1 : -1;
      const total = series[plane]?.images.length ?? 1;
      const next = Math.max(0, Math.min(total - 1, v.sliceIndex + dir));
      setSlice(plane, next);
      updateCrosshair({
        [`${plane}Frac`]: total > 1 ? next / (total - 1) : 0,
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
      // Right-click: start window/level drag
      rightDragRef.current = {
        startX: e.clientX, startY: e.clientY,
        startWW: v.windowWidth, startWL: v.windowLevel,
      };
      return;
    }

    if (e.button === 1) {
      // Middle-click: pan
      panDragRef.current = { startX: e.clientX, startY: e.clientY };
      return;
    }

    if (e.button === 0) {
      const tool = v.activeTool;
      if (!tool) { panDragRef.current = { startX: e.clientX, startY: e.clientY }; return; }

      if (tool === 'eraser') {
        const pt = mouseToNorm(e);
        if (pt) {
          const sliceAnnotations = mprAnnotations[plane][v.sliceIndex] ?? [];
          const clickedShape = findClickedAnnotation(pt, sliceAnnotations);
          if (clickedShape) {
            removeAnnotation(plane, v.sliceIndex, clickedShape.id);
          }
        }
        return;
      }

      if (tool === 'pencil') {
        const pt = mouseToNorm(e);
        if (pt) addInProgressPoint(plane, pt);
        return;
      }

      if (tool === 'brush') {
        const pt = mouseToNorm(e);
        if (pt) { addInProgressPoint(plane, pt); drawDragRef.current = true; }
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
  }, [plane, v.activeTool, v.windowWidth, v.windowLevel, v.sliceIndex, mouseToNorm,
    setActivePlane, addInProgressPoint, setInProgressStart, mprAnnotations, removeAnnotation]);

  // ── Mouse move ────────────────────────────────────────────────────────────
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (rightDragRef.current) {
      const dx = e.clientX - rightDragRef.current.startX;
      const dy = e.clientY - rightDragRef.current.startY;
      const newWW = Math.max(1, rightDragRef.current.startWW + dx * 2);
      const newWL = rightDragRef.current.startWL - dy * 2;
      setWindowLevel(plane, newWW, newWL);
      return;
    }

    if (panDragRef.current) {
      const dx = e.clientX - panDragRef.current.startX;
      const dy = e.clientY - panDragRef.current.startY;
      panDragRef.current = { startX: e.clientX, startY: e.clientY };
      deltaPan(plane, dx, dy);
      return;
    }

    if (drawDragRef.current) {
      const tool = v.activeTool;
      const pt = mouseToNorm(e);
      if (!pt) return;
      if (tool === 'brush' || tool === 'circle' || tool === 'rectangle') {
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

  // ── Click: pencil vertex / double-click reset ─────────────────────────────
  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.detail === 2) { useMPRStore.getState().resetView(plane); return; }
    if (v.activeTool !== 'pencil') return;
    const pt = mouseToNorm(e);
    if (pt) addInProgressPoint(plane, pt);
  }, [plane, v.activeTool, mouseToNorm, addInProgressPoint]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => e.preventDefault(), []);

  // ── Crosshair drag ────────────────────────────────────────────────────────
  const handleCrosshairDrag = useCallback((normX: number, normY: number) => {
    const store = useMPRStore.getState();
    if (plane === 'axial') {
      store.updateCrosshair({ sagittalFrac: normX, coronalFrac: normY });
      const sag = store.series.sagittal;
      const cor = store.series.coronal;
      if (sag) store.setSlice('sagittal', Math.round(normX * (sag.images.length - 1)));
      if (cor) store.setSlice('coronal', Math.round(normY * (cor.images.length - 1)));
    } else if (plane === 'sagittal') {
      store.updateCrosshair({ coronalFrac: normX, axialFrac: normY });
      const ax = store.series.axial;
      const cor = store.series.coronal;
      if (ax) store.setSlice('axial', Math.round(normY * (ax.images.length - 1)));
      if (cor) store.setSlice('coronal', Math.round(normX * (cor.images.length - 1)));
    } else {
      store.updateCrosshair({ sagittalFrac: normX, axialFrac: normY });
      const ax = store.series.axial;
      const sag = store.series.sagittal;
      if (ax) store.setSlice('axial', Math.round(normY * (ax.images.length - 1)));
      if (sag) store.setSlice('sagittal', Math.round(normX * (sag.images.length - 1)));
    }
  }, [plane]);

  // ── Cursor style ──────────────────────────────────────────────────────────
  const cursorMap: Record<string, string> = {
    pencil: 'crosshair', brush: 'crosshair',
    circle: 'crosshair', rectangle: 'crosshair', eraser: 'cell',
  };
  const cursor = v.activeTool ? (cursorMap[v.activeTool] ?? 'grab') : 'grab';

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#030303',
      }}
    >
      {/* Drop-zone placeholder when no series assigned */}
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
            fontSize: '28px',
          }}>📂</div>
          <p style={{ fontSize: '12px', color: '#3d3d55', textAlign: 'center' }}>
            Drag an image set here<br />from the left sidebar
          </p>
        </div>
      )}

      {/* Load error message */}
      {imageSet && loadError && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 29,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: '10px',
          pointerEvents: 'none',
        }}>
          <span style={{ fontSize: '28px' }}>⚠️</span>
          <p style={{ fontSize: '11px', color: '#ef4444', textAlign: 'center' }}>
            Could not load image.<br />
            <span style={{ color: '#63637e', fontSize: '10px' }}>
              Supported: JPEG, PNG, GIF, BMP, WebP, TIFF
            </span>
          </p>
        </div>
      )}

      {/* Main canvas */}
      <canvas
        ref={canvasRef as React.RefObject<HTMLCanvasElement>}
        width={canvasSize.w}
        height={canvasSize.h}
        style={{
          display: 'block', width: '100%', height: '100%',
          position: 'absolute', inset: 0, cursor,
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      />

      {/* Annotation SVG overlay */}
      {imageSet && imageBounds && (
        <AnnotationLayerMPR
          plane={plane}
          imageBounds={imageBounds}
          canvasWidth={canvasSize.w}
          canvasHeight={canvasSize.h}
        />
      )}

      {/* Crosshair SVG overlay */}
      {imageSet && imageBounds && (
        <CrosshairOverlay
          plane={plane}
          imageBounds={imageBounds}
          canvasWidth={canvasSize.w}
          canvasHeight={canvasSize.h}
          onCrosshairDrag={handleCrosshairDrag}
        />
      )}

      {/* HUD: window/level readout */}
      {imageSet && v.applyWindow && (
        <div style={{
          position: 'absolute', bottom: '8px', left: '10px',
          fontSize: '10px', color: 'rgba(255,255,255,0.35)',
          fontFamily: 'monospace', pointerEvents: 'none', zIndex: 25, lineHeight: 1.5,
        }}>
          WW: {v.windowWidth.toFixed(0)} · WL: {v.windowLevel.toFixed(0)}
        </div>
      )}
    </div>
  );
}

'use client';

import { useRef, useEffect, useCallback } from 'react';
import { useAnnotationStore } from '@/stores/annotationStore';
import type { Point } from '@/types';

export default function AnnotationCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    images,
    activeImageIndex,
    isDrawing,
    currentPolygon,
    addPoint,
    clearCurrentPolygon,
    saveAnnotation,
    activeImage,
  } = useAnnotationStore();

  const image = activeImage();

  // ── Draw everything on canvas ─────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw base image
    if (imgRef.current && imgRef.current.complete) {
      ctx.drawImage(imgRef.current, 0, 0, canvas.width, canvas.height);
    }

    // Draw existing saved annotations
    if (image) {
      image.annotations.forEach((ann) => {
        if (ann.polygon_data.length < 2) return;
        ctx.beginPath();
        ctx.moveTo(ann.polygon_data[0].x * canvas.width, ann.polygon_data[0].y * canvas.height);
        ann.polygon_data.slice(1).forEach((pt) => {
          ctx.lineTo(pt.x * canvas.width, pt.y * canvas.height);
        });
        ctx.closePath();
        ctx.fillStyle = `${ann.color}33`;
        ctx.fill();
        ctx.strokeStyle = ann.color;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Label
        if (ann.label) {
          const fx = ann.polygon_data[0].x * canvas.width;
          const fy = ann.polygon_data[0].y * canvas.height;
          ctx.fillStyle = ann.color;
          ctx.font = 'bold 12px Inter, sans-serif';
          ctx.fillText(ann.label, fx + 4, fy - 4);
        }

        // Vertex dots
        ann.polygon_data.forEach((pt) => {
          ctx.beginPath();
          ctx.arc(pt.x * canvas.width, pt.y * canvas.height, 3, 0, Math.PI * 2);
          ctx.fillStyle = ann.color;
          ctx.fill();
        });
      });
    }

    // Draw current in-progress polygon
    if (currentPolygon.length > 0) {
      ctx.beginPath();
      ctx.moveTo(currentPolygon[0].x * canvas.width, currentPolygon[0].y * canvas.height);
      currentPolygon.slice(1).forEach((pt) => {
        ctx.lineTo(pt.x * canvas.width, pt.y * canvas.height);
      });
      ctx.strokeStyle = '#a78bfa';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 3]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Vertex dots + first-point indicator
      currentPolygon.forEach((pt, idx) => {
        ctx.beginPath();
        ctx.arc(pt.x * canvas.width, pt.y * canvas.height, idx === 0 ? 6 : 4, 0, Math.PI * 2);
        ctx.fillStyle = idx === 0 ? '#7c3aed' : '#a78bfa';
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });
    }
  }, [image, currentPolygon]);

  // ── Load image & redraw ───────────────────────────────────────────────────
  useEffect(() => {
    if (!image) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imgRef.current = img;
      resizeCanvas();
      draw();
    };
    img.src = image.file_url;
  }, [image?.id]);

  useEffect(() => {
    draw();
  }, [draw]);

  // ── Resize canvas to fill container ───────────────────────────────────────
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    draw();
  }, [draw]);

  useEffect(() => {
    const observer = new ResizeObserver(resizeCanvas);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [resizeCanvas]);

  // ── Click to add points ───────────────────────────────────────────────────
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / canvas.width;
    const y = (e.clientY - rect.top) / canvas.height;

    // If clicking near first point and we have >= 3 points, close the polygon
    if (currentPolygon.length >= 3) {
      const first = currentPolygon[0];
      const dx = Math.abs(x - first.x) * canvas.width;
      const dy = Math.abs(y - first.y) * canvas.height;
      if (dx < 12 && dy < 12) {
        // Auto-close by triggering save dialog from toolbar
        return;
      }
    }

    addPoint({ x, y });
  };

  // ── Double-click to finish polygon ────────────────────────────────────────
  const handleDoubleClick = () => {
    if (!isDrawing || currentPolygon.length < 3) return;
    // Trigger save via store state — toolbar save button becomes visible
    // User must click "Save Annotation" in toolbar
    // Just provide visual feedback here
    draw();
  };

  if (!image) return null;

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative"
      style={{ background: '#000' }}
    >
      <canvas
        ref={canvasRef}
        id="annotation-canvas"
        className="absolute inset-0 w-full h-full"
        style={{ cursor: isDrawing ? 'crosshair' : 'default' }}
        onClick={handleCanvasClick}
        onDoubleClick={handleDoubleClick}
      />
      {!isDrawing && image.annotations.length === 0 && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <p
            className="text-sm px-4 py-2 rounded-xl"
            style={{
              background: 'rgba(0,0,0,0.6)',
              color: 'var(--text-secondary)',
              backdropFilter: 'blur(4px)',
            }}
          >
            Press "Draw Polygon" to start annotating
          </p>
        </div>
      )}
    </div>
  );
}

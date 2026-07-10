'use client';

import { useRef, useEffect, useState } from 'react';
import { useAnnotationStore } from '@/stores/annotationStore';
import type { Point } from '@/types';

// ── Coordinate helpers ──────────────────────────────────────────────────────

interface Bounds { x: number; y: number; w: number; h: number }

/** Calculate the objectFit:contain display rect within a container */
function containBounds(cw: number, ch: number, mw: number, mh: number): Bounds {
  if (mw === 0 || mh === 0 || cw === 0 || ch === 0) return { x: 0, y: 0, w: cw, h: ch };
  const scale = Math.min(cw / mw, ch / mh);
  const w = mw * scale;
  const h = mh * scale;
  return { x: (cw - w) / 2, y: (ch - h) / 2, w, h };
}

/** Normalized (0-1) → SVG pixel */
function toSVG(pt: Point, b: Bounds) { return { x: pt.x * b.w + b.x, y: pt.y * b.h + b.y }; }

/** SVG pixel → normalized (0-1), clamped to image area */
function toNorm(svgX: number, svgY: number, b: Bounds): Point | null {
  const x = (svgX - b.x) / b.w;
  const y = (svgY - b.y) / b.h;
  if (x < 0 || x > 1 || y < 0 || y > 1) return null;
  return { x, y };
}

const SNAP_PX = 14; // px radius for polygon close-snap

// Helper to detect video format based on URL/filename
const isVideoFile = (url: string) => {
  if (!url) return false;
  const ext = url.split('.').pop()?.toLowerCase();
  return ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'].includes(ext ?? '');
};

// ── Component ───────────────────────────────────────────────────────────────

export default function AnnotationCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
  const [mediaSize, setMediaSize] = useState({ w: 0, h: 0 });
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  const {
    isDrawing, currentPolygon, addPoint, activeImage,
    hideAnnotations, activeTool: _activeTool,
    currentVideoTime, setCurrentVideoTime,
    seekTargetTime, setSeekTargetTime,
  } = useAnnotationStore();

  const image = activeImage();
  const fileIsVideo = image ? isVideoFile(image.file_url) : false;

  // Watch container size
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([e]) => {
      setContainerSize({ w: e.contentRect.width, h: e.contentRect.height });
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Sync video time at 60fps via requestAnimationFrame
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !fileIsVideo) return;

    let animId: number;
    const update = () => {
      setCurrentVideoTime(video.currentTime);
      animId = requestAnimationFrame(update);
    };

    const handlePlay = () => {
      animId = requestAnimationFrame(update);
    };

    const handlePause = () => {
      cancelAnimationFrame(animId);
      setCurrentVideoTime(video.currentTime);
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('seeking', handlePause);
    video.addEventListener('seeked', handlePause);

    // Initial play check
    if (!video.paused) {
      handlePlay();
    }

    return () => {
      cancelAnimationFrame(animId);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('seeking', handlePause);
      video.removeEventListener('seeked', handlePause);
    };
  }, [fileIsVideo, image?.id, setCurrentVideoTime]);

  // Handle external video seeking
  useEffect(() => {
    if (seekTargetTime !== null && videoRef.current) {
      videoRef.current.currentTime = seekTargetTime;
      setCurrentVideoTime(seekTargetTime);
      setSeekTargetTime(null);
    }
  }, [seekTargetTime, setCurrentVideoTime, setSeekTargetTime]);

  // Reset media size when file changes
  useEffect(() => {
    // Use a microtask to avoid synchronous setState inside the effect body
    const id = requestAnimationFrame(() => setMediaSize({ w: 0, h: 0 }));
    return () => cancelAnimationFrame(id);
  }, [image?.id]);

  if (!image) return null;

  const bounds = containBounds(containerSize.w, containerSize.h, mediaSize.w, mediaSize.h);

  // SVG click → add annotation point
  const handleSVGClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDrawing) return;
    const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
    const norm = toNorm(e.clientX - rect.left, e.clientY - rect.top, bounds);
    if (!norm) return;

    // Polygon: snap-close if near first vertex
    if (currentPolygon.length >= 3) {
      const first = toSVG(currentPolygon[0], bounds);
      const svgX = e.clientX - rect.left;
      const svgY = e.clientY - rect.top;
      if (Math.hypot(svgX - first.x, svgY - first.y) < SNAP_PX) return; // toolbar handles save
    }

    addPoint(norm);
  };

  const handleSVGMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDrawing) return;
    const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  // Filter annotations by timestamp when playing a video (tight tolerance to align with single frame)
  const displayedAnnotations = !hideAnnotations
    ? image.annotations.filter((ann) => {
        if (!fileIsVideo) return true;
        if (ann.frame_time == null) return true;
        return Math.abs(ann.frame_time - currentVideoTime) < 0.05;
      })
    : [];

  // Render annotations as SVG
  const renderAnnotation = (ann: { id: number; color: string; label: string; polygon_data: Point[] }, key: number) => {
    const pts = ann.polygon_data.map((p) => toSVG(p, bounds));
    if (pts.length === 0) return null;

    if (pts.length === 1) {
      return (
        <g key={key}>
          <circle cx={pts[0].x} cy={pts[0].y} r={10} fill={`${ann.color}44`} stroke={ann.color} strokeWidth={2} />
          <circle cx={pts[0].x} cy={pts[0].y} r={3} fill={ann.color} />
          {ann.label && (
            <text x={pts[0].x + 12} y={pts[0].y + 4} fill={ann.color} fontSize={11} fontWeight="bold" fontFamily="Inter,sans-serif">
              {ann.label}
            </text>
          )}
        </g>
      );
    }

    const pointsStr = pts.map((p) => `${p.x},${p.y}`).join(' ');
    return (
      <g key={key}>
        <polygon
          points={pointsStr}
          fill={`${ann.color}35`}
          stroke={ann.color}
          strokeWidth={2}
          strokeLinejoin="round"
        />
        {ann.label && (
          <text
            x={pts[0].x + 4}
            y={pts[0].y - 6}
            fill={ann.color}
            fontSize={11}
            fontWeight="bold"
            fontFamily="Inter,sans-serif"
            style={{ textShadow: '0 1px 3px #000' }}
          >
            {ann.label}
          </text>
        )}
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={3} fill={ann.color} opacity={0.8} />
        ))}
      </g>
    );
  };

  // In-progress polygon preview
  const renderInProgress = () => {
    if (currentPolygon.length === 0) return null;
    const pts = currentPolygon.map((p) => toSVG(p, bounds));

    const firstPt = pts[0];
    const polylineStr = pts.map((p) => `${p.x},${p.y}`).join(' ');
    const canClose = currentPolygon.length >= 3;

    return (
      <g>
        <polyline
          points={polylineStr}
          fill="none"
          stroke="#a78bfa"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeDasharray="6,4"
        />
        {mousePos && (
          <line
            x1={pts[pts.length - 1].x}
            y1={pts[pts.length - 1].y}
            x2={mousePos.x}
            y2={mousePos.y}
            stroke="#a78bfa"
            strokeWidth={1.5}
            strokeDasharray="4,3"
            opacity={0.6}
          />
        )}
        {pts.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={i === 0 ? 7 : 4}
            fill={i === 0 ? (canClose ? '#7c3aed' : '#4a4a6a') : '#a78bfa'}
            stroke="white"
            strokeWidth={1.5}
          />
        ))}
        {canClose && (
          <circle
            cx={firstPt.x}
            cy={firstPt.y}
            r={SNAP_PX}
            fill="none"
            stroke="#7c3aed"
            strokeWidth={1}
            strokeDasharray="3,3"
            opacity={0.6}
          />
        )}
      </g>
    );
  };

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', position: 'relative', backgroundColor: '#000', overflow: 'hidden' }}
    >
      {/* ── Media background ─────────────────────────────────── */}
      {containerSize.w > 0 && (
        <div style={{
          position: 'absolute',
          left: bounds.x,
          top: bounds.y,
          width: bounds.w,
          height: bounds.h,
        }}>
          {fileIsVideo ? (
            <video
              ref={videoRef}
              key={image.file_url}
              src={image.file_url}
              controls
              style={{ width: '100%', height: '100%', display: 'block' }}
              onLoadedMetadata={(e) => {
                const v = e.currentTarget;
                setMediaSize({ w: v.videoWidth, h: v.videoHeight });
              }}
              onTimeUpdate={(e) => {
                // Keep the store synchronized with the video playing time
                setCurrentVideoTime(e.currentTarget.currentTime);
              }}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={image.file_url}
              src={image.file_url}
              alt={image.filename}
              draggable={false}
              style={{ width: '100%', height: '100%', display: 'block', userSelect: 'none' }}
              onLoad={(e) => {
                const img = e.currentTarget;
                setMediaSize({ w: img.naturalWidth, h: img.naturalHeight });
              }}
            />
          )}
        </div>
      )}

      {/* ── SVG annotation overlay ───────────────────────────── */}
      <svg
        ref={svgRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          cursor: isDrawing ? 'crosshair' : 'default',
          pointerEvents: isDrawing ? 'all' : 'none',
        }}
        onClick={handleSVGClick}
        onMouseMove={handleSVGMouseMove}
        onMouseLeave={() => setMousePos(null)}
      >
        {/* Render only annotations matching current frame */}
        {displayedAnnotations.map((ann, i) => renderAnnotation(ann, i))}

        {/* In-progress drawing */}
        {renderInProgress()}
      </svg>

      {/* Hint bar */}
      {!isDrawing && displayedAnnotations.length === 0 && mediaSize.w > 0 && (
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          pointerEvents: 'none',
          zIndex: 5,
        }}>
          <p style={{
            margin: 0,
            padding: '6px 14px',
            fontSize: '12px',
            color: '#8888a8',
            backgroundColor: 'rgba(0,0,0,0.7)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '8px',
            backdropFilter: 'blur(4px)',
          }}>
            {fileIsVideo
              ? `Seek video and click "Draw Polygon" to annotate at this frame`
              : `Click "Draw Polygon" above to start annotating`}
          </p>
        </div>
      )}

      {/* Loading indicator while media hasn't loaded its size yet */}
      {mediaSize.w === 0 && containerSize.w > 0 && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
        }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2px solid #7c3aed', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
        </div>
      )}
    </div>
  );
}

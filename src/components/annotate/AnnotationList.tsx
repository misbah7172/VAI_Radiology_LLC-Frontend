'use client';

import { useState, useEffect, useRef } from 'react';
import { Trash2, Tag, Play } from 'lucide-react';
import { useAnnotationStore } from '@/stores/annotationStore';
import type { Point } from '@/types';
import toast from 'react-hot-toast';


// ── Annotation Crop Thumbnail ──────────────────────────────────────────────

interface AnnotationThumbnailProps {
  fileUrl: string;
  polygonData: Point[];
  frameTime?: number | null;
  isVideo: boolean;
}

export function AnnotationThumbnail({ fileUrl, polygonData, frameTime, isVideo }: AnnotationThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    if (!polygonData || polygonData.length === 0) return;

    // Calculate Bounding Box
    const xs = polygonData.map((p) => p.x);
    const ys = polygonData.map((p) => p.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const maxX = Math.max(...xs);
    const maxY = Math.max(...ys);

    let sx = minX;
    let sy = minY;
    let sw = maxX - minX;
    let sh = maxY - minY;

    // Point annotation handler
    if (polygonData.length === 1) {
      sx = Math.max(0, polygonData[0].x - 0.06);
      sy = Math.max(0, polygonData[0].y - 0.06);
      sw = 0.12;
      sh = 0.12;
    }

    // Safety checks
    if (sw <= 0) sw = 0.05;
    if (sh <= 0) sh = 0.05;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (isVideo) {
      const video = document.createElement('video');
      video.src = fileUrl;
      video.crossOrigin = 'anonymous';
      video.currentTime = frameTime || 0;
      video.muted = true;
      video.playsInline = true;

      const handleSeeked = () => {
        if (!active || !canvas || !ctx) return;
        
        // Use video element natural dimensions
        const sX = sx * video.videoWidth;
        const sY = sy * video.videoHeight;
        const sW = sw * video.videoWidth;
        const sH = sh * video.videoHeight;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        try {
          ctx.drawImage(video, sX, sY, sW, sH, 0, 0, canvas.width, canvas.height);
          setLoaded(true);
        } catch (err) {
          console.error('Failed to crop video frame:', err);
        }
      };

      video.addEventListener('seeked', handleSeeked);
      video.load();

      return () => {
        active = false;
        video.removeEventListener('seeked', handleSeeked);
        video.src = '';
      };
    } else {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        if (!active || !canvas || !ctx) return;

        const sX = sx * img.naturalWidth;
        const sY = sy * img.naturalHeight;
        const sW = sw * img.naturalWidth;
        const sH = sh * img.naturalHeight;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        try {
          ctx.drawImage(img, sX, sY, sW, sH, 0, 0, canvas.width, canvas.height);
          setLoaded(true);
        } catch (err) {
          console.error('Failed to crop image:', err);
        }
      };
      img.src = fileUrl;

      return () => {
        active = false;
        img.onload = null;
        img.src = '';
      };
    }
  }, [fileUrl, polygonData, frameTime, isVideo]);

  return (
    <div style={{
      width: '44px',
      height: '44px',
      borderRadius: '6px',
      backgroundColor: '#1c1c28',
      border: '1px solid #232332',
      overflow: 'hidden',
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    }}>
      <canvas
        ref={canvasRef}
        width={96}
        height={96}
        style={{
          width: '100%',
          height: '100%',
          display: loaded ? 'block' : 'none',
          objectFit: 'cover',
        }}
      />
      {!loaded && (
        <div style={{
          fontSize: '9px',
          color: '#5a5a7a',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          {isVideo ? 'Video' : 'Image'}
        </div>
      )}
    </div>
  );
}

// ── Annotation List ─────────────────────────────────────────────────────────

export default function AnnotationList() {
  const { activeImage, deleteAnnotation, setSeekTargetTime } = useAnnotationStore();
  const image = activeImage();
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [deleteHoveredId, setDeleteHoveredId] = useState<number | null>(null);

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!confirm('Delete this annotation?')) return;
    try {
      await deleteAnnotation(id);
      toast.success('Annotation deleted');
    } catch {
      toast.error('Failed to delete annotation');
    }
  };

  if (!image) return null;

  const isVideo = (url: string) => {
    const ext = url?.split('.').pop()?.toLowerCase();
    return ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'].includes(ext ?? '');
  };

  const fileIsVideo = isVideo(image.file_url);

  // Format time (e.g. 0:04)
  const formatTime = (secs?: number | null) => {
    if (secs == null) return null;
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#111116',
      }}
    >
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #1a1a26' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#f4f4f7', margin: 0 }}>
          Annotations
        </h3>
        <p style={{
          fontSize: '11px',
          color: '#63637e',
          margin: 0,
          marginTop: '3px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {image.filename}
        </p>
      </div>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px 12px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}>
        {image.annotations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 16px' }}>
            <Tag style={{ width: '24px', height: '24px', margin: '0 auto 8px', color: '#3d3d55' }} />
            <p style={{ fontSize: '12px', color: '#5a5a7a', margin: 0 }}>
              No annotations yet
            </p>
          </div>
        ) : (
          image.annotations.map((ann) => {
            const isHovered = hoveredId === ann.id;
            const isDelHov = deleteHoveredId === ann.id;
            const hasTimestamp = ann.frame_time != null;

            return (
              <div
                key={ann.id}
                id={`annotation-item-${ann.id}`}
                onMouseEnter={() => setHoveredId(ann.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => {
                  if (fileIsVideo && hasTimestamp) {
                    setSeekTargetTime(ann.frame_time!);
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '8px 10px',
                  borderRadius: '10px',
                  backgroundColor: '#181822',
                  border: `1px solid ${isHovered ? '#2e2e42' : '#1a1a26'}`,
                  cursor: fileIsVideo && hasTimestamp ? 'pointer' : 'default',
                  transition: 'all 0.15s ease',
                }}
              >
                {/* YOLO cropped preview thumbnail */}
                <AnnotationThumbnail
                  fileUrl={image.file_url}
                  polygonData={ann.polygon_data}
                  frameTime={ann.frame_time}
                  isVideo={fileIsVideo}
                />

                {/* Details */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: ann.color,
                        boxShadow: `0 0 5px ${ann.color}80`,
                        flexShrink: 0,
                      }}
                    />
                    <p style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#e4e4f0',
                      margin: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {ann.label || 'Unlabeled'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                    <span style={{ fontSize: '10px', color: '#5a5a7a' }}>
                      {ann.polygon_data.length} pts
                    </span>
                    {hasTimestamp && (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '2px',
                        fontSize: '10px',
                        color: '#7c3aed',
                        fontWeight: 600,
                        backgroundColor: 'rgba(124,58,237,0.1)',
                        padding: '1px 5px',
                        borderRadius: '4px',
                      }}>
                        <Play style={{ width: '8px', height: '8px', fill: '#7c3aed' }} />
                        {formatTime(ann.frame_time)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Delete button */}
                <button
                  id={`delete-annotation-${ann.id}`}
                  onClick={(e) => handleDelete(e, ann.id)}
                  onMouseEnter={() => setDeleteHoveredId(ann.id)}
                  onMouseLeave={() => setDeleteHoveredId(null)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '24px',
                    height: '24px',
                    borderRadius: '5px',
                    border: 'none',
                    backgroundColor: isDelHov ? 'rgba(239,68,68,0.1)' : 'transparent',
                    color: isDelHov ? '#f87171' : '#63637e',
                    opacity: isHovered ? 1 : 0,
                    transition: 'all 0.15s ease',
                    cursor: 'pointer',
                    padding: 0,
                    flexShrink: 0,
                  }}
                  title="Delete annotation"
                >
                  <Trash2 style={{ width: '11px', height: '11px' }} />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Summary */}
      {image.annotations.length > 0 && (
        <div
          style={{
            padding: '12px 16px',
            fontSize: '11px',
            color: '#4a4a6a',
            borderTop: '1px solid #1a1a26',
            backgroundColor: '#111116',
          }}
        >
          {image.annotations.length} region annotation(s) saved
        </div>
      )}
    </div>
  );
}

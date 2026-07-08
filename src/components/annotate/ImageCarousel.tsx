'use client';

import { useState } from 'react';
import { Trash2, Film, Image as ImageIcon } from 'lucide-react';
import { useAnnotationStore } from '@/stores/annotationStore';
import toast from 'react-hot-toast';

export default function ImageCarousel() {
  const { images, activeImageIndex, setActiveImageIndex, deleteImage } = useAnnotationStore();
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [deleteHovered, setDeleteHovered] = useState<number | null>(null);

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!confirm('Delete this file and all its annotations?')) return;
    try {
      await deleteImage(id);
      toast.success('File deleted');
    } catch {
      toast.error('Failed to delete file');
    }
  };

  const isVideo = (url: string) => {
    if (!url) return false;
    const ext = url.split('.').pop()?.toLowerCase();
    return ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'].includes(ext || '');
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#111116',
        padding: '12px',
        gap: '12px',
        overflowY: 'auto',
      }}
    >
      <div style={{ padding: '0 4px', flexShrink: 0 }}>
        <p style={{
          fontSize: '10px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: '#3d3d55',
          margin: 0,
        }}>
          Files ({images.length})
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        {images.map((img, idx) => {
          const isActive = idx === activeImageIndex;
          const isHovered = hoveredId === img.id;
          const isDelHov = deleteHovered === img.id;
          const fileIsVideo = isVideo(img.file_url);

          return (
            <div
              key={img.id}
              id={`image-thumb-${img.id}`}
              onClick={() => setActiveImageIndex(idx)}
              onMouseEnter={() => setHoveredId(img.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                position: 'relative',
                width: '100%',
                height: '84px',
                borderRadius: '8px',
                overflow: 'hidden',
                cursor: 'pointer',
                border: `2px solid ${isActive ? '#a78bfa' : isHovered ? '#2e2e42' : '#1a1a26'}`,
                backgroundColor: '#181822',
                transition: 'all 0.18s ease',
                flexShrink: 0,
              }}
            >
              {/* Media rendering */}
              {fileIsVideo ? (
                <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                  <video
                    src={img.file_url}
                    muted
                    preload="metadata"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{
                    position: 'absolute',
                    top: '4px',
                    left: '4px',
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    borderRadius: '4px',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                  }}>
                    <Film style={{ width: '10px', height: '10px', color: '#a78bfa' }} />
                  </div>
                </div>
              ) : (
                <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.file_url}
                    alt={img.filename}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{
                    position: 'absolute',
                    top: '4px',
                    left: '4px',
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    borderRadius: '4px',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                  }}>
                    <ImageIcon style={{ width: '10px', height: '10px', color: '#a78bfa' }} />
                  </div>
                </div>
              )}

              {/* Active boundary frame */}
              {isActive && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  border: '1px solid #7c3aed',
                  borderRadius: 'inherit',
                  pointerEvents: 'none',
                }} />
              )}

              {/* Delete button */}
              <button
                id={`delete-image-${img.id}`}
                onClick={(e) => handleDelete(e, img.id)}
                onMouseEnter={() => setDeleteHovered(img.id)}
                onMouseLeave={() => setDeleteHovered(null)}
                style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '20px',
                  height: '20px',
                  borderRadius: '4px',
                  border: 'none',
                  backgroundColor: isDelHov ? '#ef4444' : 'rgba(0,0,0,0.6)',
                  color: '#ffffff',
                  opacity: isHovered ? 1 : 0,
                  transition: 'all 0.15s ease',
                  cursor: 'pointer',
                  padding: 0,
                }}
                title="Delete file"
              >
                <Trash2 style={{ width: '10px', height: '10px' }} />
              </button>

              {/* Annotation count badge */}
              {img.annotations.length > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '4px',
                    left: '4px',
                    fontSize: '9px',
                    fontWeight: 700,
                    padding: '1px 5px',
                    borderRadius: '10px',
                    background: '#7c3aed',
                    color: 'white',
                  }}
                >
                  {img.annotations.length}
                </div>
              )}

              {/* Filename tooltip */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: '2px 6px',
                  fontSize: '9px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  background: 'rgba(0,0,0,0.75)',
                  color: '#d4d4e8',
                  opacity: isHovered ? 1 : 0,
                  transition: 'opacity 0.15s ease',
                }}
              >
                {img.filename}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

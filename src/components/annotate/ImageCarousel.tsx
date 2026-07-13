'use client';

import { useState } from 'react';
import { Trash2, Film, Image as ImageIcon, GripVertical, Plus, PlusSquare, Pencil, Check } from 'lucide-react';
import { useAnnotationStore } from '@/stores/annotationStore';
import toast from 'react-hot-toast';
import type { ImageSet } from '@/types';
import { annotationsApi } from '@/lib/annotations';
import { getOptimizedImageUrl } from '@/lib/api';

export default function ImageCarousel() {
  const {
    imageSets,
    activeSetId,
    setActiveSetId,
    deleteSet,
    uploadImages,
    addToGrid,
    gridSetIds,
  } = useAnnotationStore();

  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [deleteHovered, setDeleteHovered] = useState<number | null>(null);
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  const handleDeleteSet = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!confirm('Delete this set and ALL its files and annotations?')) return;
    try {
      await deleteSet(id);
      toast.success('Set deleted');
    } catch {
      toast.error('Failed to delete set');
    }
  };

  const handleRenameStart = (e: React.MouseEvent, set: ImageSet) => {
    e.stopPropagation();
    setEditingId(set.id);
    setEditName(set.name);
  };

  const handleRenameCommit = async (setId: number) => {
    const trimmed = editName.trim();
    if (trimmed) {
      try {
        await annotationsApi.updateSet(setId, trimmed);
        toast.success('Renamed');
        // Refresh store
        const res = await annotationsApi.listSets();
        useAnnotationStore.setState({ imageSets: res.results });
      } catch {
        toast.error('Rename failed');
      }
    }
    setEditingId(null);
  };

  // ── Drag events ────────────────────────────────────────────────────────────
  const handleDragStart = (e: React.DragEvent, setId: number) => {
    e.dataTransfer.setData('text/plain', String(setId));
    // Also tag with a custom type so the window-level file-drop overlay
    // in ImageUploader knows this is a sidebar card, not an OS file drag.
    e.dataTransfer.setData('application/x-vai-set-id', String(setId));
    e.dataTransfer.effectAllowed = 'copy';
    setDraggedId(setId);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
  };

  const isVideo = (url: string) => {
    if (!url) return false;
    const ext = url.split('.').pop()?.toLowerCase();
    return ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'].includes(ext || '');
  };

  // Quick upload to a specific existing set
  const handleAddToSet = (setId: number) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,video/*';
    input.multiple = true;
    input.onchange = async () => {
      if (!input.files || input.files.length === 0) return;
      const files = Array.from(input.files);
      try {
        await uploadImages(files, setId);
        toast.success(`${files.length} file(s) added to set`);
      } catch {
        toast.error('Upload failed');
      }
    };
    input.click();
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#111116',
        padding: '12px',
        gap: '10px',
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <div style={{ padding: '0 4px', flexShrink: 0 }}>
        <p style={{
          fontSize: '10px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: '#3d3d55',
          margin: 0,
        }}>
          Sets ({imageSets.length})
        </p>
        <p style={{ fontSize: '9px', color: '#2a2a3a', margin: '4px 0 0 0' }}>
          Click → Open · Drag → Compare
        </p>
      </div>

      {/* Sets List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        {imageSets.map((set) => {
          const isActive = set.id === activeSetId;
          const isHovered = hoveredId === set.id;
          const isDragging = draggedId === set.id;
          const inGrid = gridSetIds.includes(set.id);
          const coverImg = set.images[0];
          const fileIsVideo = coverImg ? isVideo(coverImg.file_url) : false;
          const isEditing = editingId === set.id;

          return (
            <div
              key={set.id}
              id={`set-item-${set.id}`}
              draggable
              onClick={() => setActiveSetId(set.id)}
              onMouseEnter={() => setHoveredId(set.id)}
              onMouseLeave={() => setHoveredId(null)}
              onDragStart={(e) => handleDragStart(e, set.id)}
              onDragEnd={handleDragEnd}
              style={{
                position: 'relative',
                width: '100%',
                borderRadius: '10px',
                overflow: 'hidden',
                cursor: 'grab',
                border: `2px solid ${isActive ? '#a78bfa' : inGrid ? '#4ade80' : isHovered ? '#2e2e42' : '#1a1a26'}`,
                backgroundColor: '#181822',
                transition: 'all 0.18s ease',
                flexShrink: 0,
                opacity: isDragging ? 0.5 : 1,
                transform: isDragging ? 'scale(0.97)' : 'scale(1)',
              }}
            >
              {/* Cover thumbnail */}
              <div style={{ width: '100%', height: '76px', position: 'relative' }}>
                {coverImg ? (
                  fileIsVideo ? (
                    <video
                      src={coverImg.file_url}
                      muted
                      preload="metadata"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={getOptimizedImageUrl(coverImg.file_url, 384, 75)}
                      alt={set.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  )
                ) : (
                  <div style={{
                    width: '100%', height: '100%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: '#0e0e14',
                    color: '#3d3d55', fontSize: '11px',
                  }}>
                    No files
                  </div>
                )}

                {/* File-type badge */}
                <div style={{
                  position: 'absolute', top: '4px', left: '4px',
                  backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: '4px',
                  padding: '2px', display: 'flex', alignItems: 'center',
                }}>
                  {fileIsVideo
                    ? <Film style={{ width: '10px', height: '10px', color: '#a78bfa' }} />
                    : <ImageIcon style={{ width: '10px', height: '10px', color: '#a78bfa' }} />}
                </div>

                {/* Frame count badge */}
                <div style={{
                  position: 'absolute', top: '4px', right: '4px',
                  backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: '4px',
                  padding: '1px 5px', fontSize: '9px', fontWeight: 700,
                  color: '#d4d4e8',
                }}>
                  {set.images.length}
                </div>

                {/* Drag handle */}
                <div style={{
                  position: 'absolute', bottom: '4px', right: '4px',
                  color: 'rgba(255,255,255,0.35)', display: 'flex',
                }}>
                  <GripVertical style={{ width: '12px', height: '12px' }} />
                </div>

                {/* In-grid indicator */}
                {inGrid && (
                  <div style={{
                    position: 'absolute', bottom: '4px', left: '4px',
                    backgroundColor: '#22c55e', borderRadius: '3px',
                    padding: '1px 4px', fontSize: '8px', fontWeight: 700,
                    color: '#fff',
                  }}>
                    IN GRID
                  </div>
                )}

                {/* Active selection overlay */}
                {isActive && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    border: '1px solid #7c3aed', borderRadius: 'inherit',
                    pointerEvents: 'none',
                  }} />
                )}
              </div>

              {/* Set name footer */}
              <div style={{
                padding: '6px 8px',
                backgroundColor: '#0e0e14',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}>
                {isEditing ? (
                  <input
                    autoFocus
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={() => handleRenameCommit(set.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRenameCommit(set.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      flex: 1,
                      background: 'none',
                      border: 'none',
                      borderBottom: '1px solid #7c3aed',
                      color: '#f4f4f7',
                      fontSize: '10px',
                      fontFamily: 'inherit',
                      outline: 'none',
                      padding: '1px 0',
                    }}
                  />
                ) : (
                  <span style={{
                    flex: 1,
                    fontSize: '10px',
                    color: '#a0a0c0',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {set.name}
                  </span>
                )}

                {/* Quick action buttons - visible on hover */}
                {(isHovered || isActive) && !isEditing && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0 }}>
                    {/* Add more images to this set */}
                    <button
                      id={`add-to-set-${set.id}`}
                      onClick={(e) => { e.stopPropagation(); handleAddToSet(set.id); }}
                      title="Add more files to this set"
                      style={{
                        width: '18px', height: '18px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: '#4ade80',
                        cursor: 'pointer',
                        padding: 0,
                        borderRadius: '3px',
                      }}
                    >
                      <Plus style={{ width: '10px', height: '10px' }} />
                    </button>
                    {/* Add to comparison grid */}
                    <button
                      id={`grid-add-${set.id}`}
                      onClick={(e) => { e.stopPropagation(); addToGrid(set.id); toast.success('Added to comparison grid'); }}
                      title="Open in comparison grid"
                      style={{
                        width: '18px', height: '18px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: '#a78bfa',
                        cursor: 'pointer',
                        padding: 0,
                        borderRadius: '3px',
                      }}
                    >
                      <PlusSquare style={{ width: '10px', height: '10px' }} />
                    </button>
                    {/* Rename */}
                    <button
                      id={`rename-set-${set.id}`}
                      onClick={(e) => handleRenameStart(e, set)}
                      title="Rename set"
                      style={{
                        width: '18px', height: '18px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: '#8888a8',
                        cursor: 'pointer',
                        padding: 0,
                        borderRadius: '3px',
                      }}
                    >
                      <Pencil style={{ width: '9px', height: '9px' }} />
                    </button>
                    {/* Delete */}
                    <button
                      id={`delete-set-${set.id}`}
                      onClick={(e) => handleDeleteSet(e, set.id)}
                      onMouseEnter={() => setDeleteHovered(set.id)}
                      onMouseLeave={() => setDeleteHovered(null)}
                      title="Delete set"
                      style={{
                        width: '18px', height: '18px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: 'none',
                        backgroundColor: deleteHovered === set.id ? 'rgba(239,68,68,0.15)' : 'transparent',
                        color: deleteHovered === set.id ? '#ef4444' : '#5a5a7a',
                        cursor: 'pointer',
                        padding: 0,
                        borderRadius: '3px',
                        transition: 'all 0.12s ease',
                      }}
                    >
                      <Trash2 style={{ width: '9px', height: '9px' }} />
                    </button>
                  </div>
                )}
                {isEditing && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRenameCommit(set.id); }}
                    style={{
                      width: '18px', height: '18px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: 'none',
                      backgroundColor: 'rgba(74,222,128,0.12)',
                      color: '#4ade80',
                      cursor: 'pointer',
                      padding: 0,
                      borderRadius: '3px',
                      flexShrink: 0,
                    }}
                  >
                    <Check style={{ width: '10px', height: '10px' }} />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {imageSets.length === 0 && (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: '8px',
            color: '#2a2a3a', fontSize: '11px', textAlign: 'center', padding: '16px',
          }}>
            <span style={{ fontSize: '24px' }}>📁</span>
            <span>Upload files to create sets</span>
          </div>
        )}
      </div>
    </div>
  );
}

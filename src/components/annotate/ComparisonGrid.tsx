'use client';

import { useState, useEffect } from 'react';
import { useAnnotationStore } from '@/stores/annotationStore';
import { X, Maximize2, Film, Image as ImageIcon } from 'lucide-react';
import type { UploadedImage } from '@/types';

export default function ComparisonGrid() {
  const {
    imageSets,
    gridSetIds,
    removeFromGrid,
    addToGrid,
    setActiveSetId,
  } = useAnnotationStore();

  // Local state to track the active index of images (or video timestamps) for each set in the grid
  // Key: setId, Value: image index (number)
  const [setIndices, setSetIndices] = useState<Record<number, number>>({});

  // Local state to track video durations and current times for sets that have videos
  // Key: imageId, Value: { duration: number, currentTime: number }
  const [videoState, setVideoState] = useState<Record<number, { duration: number; currentTime: number }>>({});

  // Resolve which ImageSets are currently placed in the grid
  const activeGridSets = imageSets.filter((s) => gridSetIds.includes(s.id));

  // Initialize indices for newly added sets
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setSetIndices((prev) => {
        const updated = { ...prev };
        gridSetIds.forEach((sid) => {
          if (updated[sid] === undefined) {
            updated[sid] = 0;
          }
        });
        return updated;
      });
    });
    return () => cancelAnimationFrame(id);
  }, [gridSetIds]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const setIdStr = e.dataTransfer.getData('text/plain');
    if (setIdStr) {
      const setId = parseInt(setIdStr, 10);
      if (!isNaN(setId)) {
        addToGrid(setId);
      }
    }
  };

  const isVideo = (url: string) => {
    if (!url) return false;
    const ext = url.split('.').pop()?.toLowerCase();
    return ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'].includes(ext || '');
  };

  const handleSliderChange = (setId: number, val: number, isVideoType: boolean, activeImg: UploadedImage) => {
    if (isVideoType) {
      // Seek the video element matching this image ID
      const videoEl = document.getElementById(`grid-video-${activeImg.id}`) as HTMLVideoElement | null;
      if (videoEl) {
        videoEl.currentTime = val;
        setVideoState((prev) => ({
          ...prev,
          [activeImg.id]: {
            ...prev[activeImg.id],
            currentTime: val,
          },
        }));
      }
    } else {
      setSetIndices((prev) => ({
        ...prev,
        [setId]: val,
      }));
    }
  };

  const handleVideoLoadedMetadata = (imageId: number, duration: number) => {
    setVideoState((prev) => ({
      ...prev,
      [imageId]: {
        duration,
        currentTime: 0,
      },
    }));
  };

  const handleVideoTimeUpdate = (imageId: number, currentTime: number) => {
    setVideoState((prev) => ({
      ...prev,
      [imageId]: {
        ...prev[imageId],
        currentTime,
      },
    }));
  };

  if (activeGridSets.length === 0) {
    return (
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2.5px dashed #232332',
          borderRadius: '16px',
          backgroundColor: '#0a0a0f',
          padding: '40px',
          color: '#5a5a7a',
          transition: 'all 0.2s ease',
        }}
        onDragEnter={(e) => {
          e.currentTarget.style.borderColor = '#7c3aed';
          e.currentTarget.style.backgroundColor = 'rgba(124,58,237,0.02)';
        }}
        onDragLeave={(e) => {
          e.currentTarget.style.borderColor = '#232332';
          e.currentTarget.style.backgroundColor = '#0a0a0f';
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎛️</div>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#f4f4f7', margin: '0 0 8px 0' }}>
          Comparison Workspace Grid
        </h3>
        <p style={{ fontSize: '13px', margin: 0, textAlign: 'center', maxWidth: '320px', lineHeight: 1.5 }}>
          Drag and drop image sets from the left sidebar here to view and compare multiple sets side-by-side.
        </p>
      </div>
    );
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        padding: '24px',
        overflowY: 'auto',
        backgroundColor: '#030305',
      }}
    >
      {/* Grid workspace header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#63637e' }}>
          Comparing {activeGridSets.length} Set{activeGridSets.length > 1 ? 's' : ''}
        </p>
        <span style={{ fontSize: '11px', color: '#3d3d55' }}>
          Tip: Use sliders inside cards to play frames left/right.
        </span>
      </div>

      {/* Grid list */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: activeGridSets.length === 1
          ? '1fr'
          : activeGridSets.length === 2
          ? '1fr 1fr'
          : 'repeat(auto-fill, minmax(420px, 1fr))',
        gap: '20px',
        flex: 1,
      }}>
        {activeGridSets.map((set) => {
          const currentIndex = setIndices[set.id] || 0;
          const activeImg = set.images[currentIndex] || set.images[0];
          const hasImages = set.images.length > 0;
          const fileIsVideo = hasImages ? isVideo(activeImg.file_url) : false;

          // Resolve video values
          const vState = activeImg ? videoState[activeImg.id] : null;
          const videoDuration = vState?.duration || 100;
          const videoCurrentTime = vState?.currentTime || 0;

          // Bounding slider values
          const sliderMax = fileIsVideo ? videoDuration : set.images.length - 1;
          const sliderVal = fileIsVideo ? videoCurrentTime : currentIndex;

          return (
            <div
              key={set.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '14px',
                border: '1px solid #1a1a26',
                backgroundColor: '#0e0e14',
                boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              {/* Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                backgroundColor: '#13131b',
                borderBottom: '1px solid #1a1a26',
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#f4f4f7' }}>
                    {set.name}
                  </span>
                  <span style={{ fontSize: '11px', color: '#5a5a7a' }}>
                    {set.images.length} frame{set.images.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => setActiveSetId(set.id)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '5px 10px',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#a78bfa',
                      backgroundColor: 'rgba(167,139,250,0.06)',
                      border: '1px solid rgba(167,139,250,0.15)',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(167,139,250,0.12)';
                      e.currentTarget.style.borderColor = 'rgba(167,139,250,0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(167,139,250,0.06)';
                      e.currentTarget.style.borderColor = 'rgba(167,139,250,0.15)';
                    }}
                  >
                    <Maximize2 style={{ width: '11px', height: '11px' }} />
                    Annotate
                  </button>
                  <button
                    onClick={() => removeFromGrid(set.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#63637e',
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: '5px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)';
                      e.currentTarget.style.color = '#ef4444';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#63637e';
                    }}
                  >
                    <X style={{ width: '14px', height: '14px' }} />
                  </button>
                </div>
              </div>

              {/* Workspace viewport */}
              <div style={{
                flex: 1,
                minHeight: '260px',
                position: 'relative',
                backgroundColor: '#030305',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}>
                {hasImages ? (
                  fileIsVideo ? (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <video
                        id={`grid-video-${activeImg.id}`}
                        src={activeImg.file_url}
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                        onLoadedMetadata={(e) => handleVideoLoadedMetadata(activeImg.id, e.currentTarget.duration)}
                        onTimeUpdate={(e) => handleVideoTimeUpdate(activeImg.id, e.currentTarget.currentTime)}
                        muted
                        playsInline
                      />
                      {/* SVG annotation preview overlay */}
                      <svg
                        style={{
                          position: 'absolute',
                          inset: 0,
                          width: '100%',
                          height: '100%',
                          pointerEvents: 'none',
                          zIndex: 5,
                        }}
                      >
                        {activeImg.annotations
                          .filter((ann) => ann.frame_time === null || Math.abs((ann.frame_time ?? 0) - videoCurrentTime) < 0.1)
                          .map((ann) => {
                            const ptsStr = ann.polygon_data.map(p => `${p.x * 100}% ${p.y * 100}%`).join(', ');
                            return (
                              <polygon
                                key={ann.id}
                                points={ptsStr}
                                style={{
                                  fill: `${ann.color}25`,
                                  stroke: ann.color,
                                  strokeWidth: 2,
                                }}
                              />
                            );
                          })}
                      </svg>
                    </div>
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={activeImg.file_url}
                        alt={activeImg.filename}
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                      />
                      {/* SVG annotations preview overlay */}
                      <svg
                        style={{
                          position: 'absolute',
                          inset: 0,
                          width: '100%',
                          height: '100%',
                          pointerEvents: 'none',
                          zIndex: 5,
                        }}
                      >
                        {activeImg.annotations.map((ann) => {
                          // Standard polygons render as percentages
                          const ptsStr = ann.polygon_data.map(p => `${p.x * 100}% ${p.y * 100}%`).join(', ');
                          return (
                            <polygon
                              key={ann.id}
                              points={ptsStr}
                              style={{
                                fill: `${ann.color}25`,
                                stroke: ann.color,
                                strokeWidth: 2,
                              }}
                            />
                          );
                        })}
                      </svg>
                    </div>
                  )
                ) : (
                  <span style={{ fontSize: '12px', color: '#3d3d55' }}>No media uploaded</span>
                )}
              </div>

              {/* Slider frame player controls */}
              {hasImages && (
                <div style={{
                  padding: '12px 16px',
                  backgroundColor: '#0c0c11',
                  borderTop: '1px solid #1a1a26',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}>
                  {/* Slider Row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {fileIsVideo ? (
                      <Film style={{ width: '12px', height: '12px', color: '#8888a8', flexShrink: 0 }} />
                    ) : (
                      <ImageIcon style={{ width: '12px', height: '12px', color: '#8888a8', flexShrink: 0 }} />
                    )}

                    <input
                      type="range"
                      min="0"
                      max={sliderMax}
                      step={fileIsVideo ? '0.05' : '1'}
                      value={sliderVal}
                      onChange={(e) => handleSliderChange(set.id, parseFloat(e.target.value), fileIsVideo, activeImg)}
                      style={{
                        flex: 1,
                        height: '4px',
                        borderRadius: '2px',
                        backgroundColor: '#232332',
                        outline: 'none',
                        cursor: 'pointer',
                        accentColor: '#7c3aed',
                      }}
                    />

                    {/* Frame indicator */}
                    <span style={{ fontSize: '11px', color: '#8888a8', fontFamily: 'monospace', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {fileIsVideo
                        ? `${videoCurrentTime.toFixed(1)}s / ${videoDuration.toFixed(1)}s`
                        : `${currentIndex + 1} / ${set.images.length}`}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

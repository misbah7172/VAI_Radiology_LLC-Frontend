'use client';

import { useState, useCallback } from 'react';
import ViewerPanel from './ViewerPanel';
import ImageMetadataPanel from './ImageMetadataPanel';

export default function MPRWorkspace() {
  // Track separator positions (% from left and top)
  const [splitX, setSplitX] = useState(50);
  const [splitY, setSplitY] = useState(50);
  const [isDraggingX, setIsDraggingX] = useState(false);
  const [isDraggingY, setIsDraggingY] = useState(false);

  // ── Resizable column splitter (Left/Right) ──────────────────────────────────
  const handleSplitterXMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingX(true);

    const container = (e.currentTarget as HTMLElement).parentElement!.parentElement!;
    const rect = container.getBoundingClientRect();

    const onMove = (mv: MouseEvent) => {
      const pct = Math.max(20, Math.min(80, ((mv.clientX - rect.left) / rect.width) * 100));
      setSplitX(pct);
    };
    const onUp = () => {
      setIsDraggingX(false);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, []);

  // ── Resizable row splitter (Top/Bottom) ─────────────────────────────────────
  const handleSplitterYMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingY(true);

    const container = (e.currentTarget as HTMLElement).parentElement!;
    const rect = container.getBoundingClientRect();

    const onMove = (mv: MouseEvent) => {
      const pct = Math.max(20, Math.min(80, ((mv.clientY - rect.top) / rect.height) * 100));
      setSplitY(pct);
    };
    const onUp = () => {
      setIsDraggingY(false);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, []);

  return (
    <div
      id="mpr-workspace"
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        backgroundColor: '#08080c',
        position: 'relative',
        userSelect: (isDraggingX || isDraggingY) ? 'none' : 'auto',
      }}
    >
      {/* ── Top Row (Axial + Sagittal) ────────────────────────────────────────── */}
      <div style={{ display: 'flex', height: `${splitY}%`, width: '100%', overflow: 'hidden' }}>
        {/* Top Left: Axial */}
        <div
          style={{
            width: `${splitX}%`,
            height: '100%',
            flexShrink: 0,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <ViewerPanel plane="axial" />
        </div>

        {/* Vertical Separator */}
        <div
          onMouseDown={handleSplitterXMouseDown}
          style={{
            width: '4px',
            height: '100%',
            flexShrink: 0,
            cursor: 'col-resize',
            backgroundColor: isDraggingX ? '#7c3aed' : '#1a1a26',
            transition: isDraggingX ? 'none' : 'background-color 0.2s',
            zIndex: 10,
            position: 'relative',
          }}
          title="Drag to resize columns"
        >
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex', flexDirection: 'column', gap: '3px',
          }}>
            {[0,1,2].map((i) => (
              <div key={i} style={{
                width: '2px', height: '2px', borderRadius: '50%',
                backgroundColor: isDraggingX ? '#a78bfa' : '#3d3d55',
              }} />
            ))}
          </div>
        </div>

        {/* Top Right: Sagittal */}
        <div
          style={{
            flex: 1,
            height: '100%',
            minWidth: 0,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <ViewerPanel plane="sagittal" />
        </div>
      </div>

      {/* ── Horizontal Splitter ───────────────────────────────────────────────── */}
      <div
        onMouseDown={handleSplitterYMouseDown}
        style={{
          height: '4px',
          width: '100%',
          flexShrink: 0,
          cursor: 'row-resize',
          backgroundColor: isDraggingY ? '#7c3aed' : '#1a1a26',
          transition: isDraggingY ? 'none' : 'background-color 0.2s',
          zIndex: 10,
          position: 'relative',
        }}
        title="Drag to resize rows"
      >
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex', flexDirection: 'row', gap: '3px',
        }}>
          {[0,1,2].map((i) => (
            <div key={i} style={{
              width: '2px', height: '2px', borderRadius: '50%',
              backgroundColor: isDraggingY ? '#a78bfa' : '#3d3d55',
            }} />
          ))}
        </div>
      </div>

      {/* ── Bottom Row (Coronal + Metadata) ───────────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, width: '100%', overflow: 'hidden', minHeight: 0 }}>
        {/* Bottom Left: Coronal */}
        <div
          style={{
            width: `${splitX}%`,
            height: '100%',
            flexShrink: 0,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <ViewerPanel plane="coronal" />
        </div>

        {/* Vertical Separator */}
        <div
          onMouseDown={handleSplitterXMouseDown}
          style={{
            width: '4px',
            height: '100%',
            flexShrink: 0,
            cursor: 'col-resize',
            backgroundColor: isDraggingX ? '#7c3aed' : '#1a1a26',
            transition: isDraggingX ? 'none' : 'background-color 0.2s',
            zIndex: 10,
            position: 'relative',
          }}
          title="Drag to resize columns"
        >
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex', flexDirection: 'column', gap: '3px',
          }}>
            {[0,1,2].map((i) => (
              <div key={i} style={{
                width: '2px', height: '2px', borderRadius: '50%',
                backgroundColor: isDraggingX ? '#a78bfa' : '#3d3d55',
              }} />
            ))}
          </div>
        </div>

        {/* Bottom Right: Metadata */}
        <div
          style={{
            flex: 1,
            height: '100%',
            minWidth: 0,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <ImageMetadataPanel />
        </div>
      </div>
    </div>
  );
}

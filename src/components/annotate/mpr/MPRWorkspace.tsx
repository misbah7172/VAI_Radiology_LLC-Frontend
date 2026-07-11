'use client';

import { useState, useCallback } from 'react';
import ViewerPanel from './ViewerPanel';

export default function MPRWorkspace() {
  // Track separator position (% from left)
  const [splitPct, setSplitPct] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  // ── Resizable splitter ────────────────────────────────────────────────────
  const handleSplitterMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);

    const container = (e.currentTarget as HTMLElement).parentElement!;
    const rect = container.getBoundingClientRect();

    const onMove = (mv: MouseEvent) => {
      const pct = Math.max(20, Math.min(80, ((mv.clientX - rect.left) / rect.width) * 100));
      setSplitPct(pct);
    };
    const onUp = () => {
      setIsDragging(false);
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
        flexDirection: 'row',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        backgroundColor: '#08080c',
        userSelect: isDragging ? 'none' : 'auto',
      }}
    >
      {/* ── Axial panel ──────────────────────────────────────────────────── */}
      <div
        style={{
          width: `${splitPct}%`,
          height: '100%',
          flexShrink: 0,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <ViewerPanel plane="axial" />
      </div>

      {/* ── Drag splitter ─────────────────────────────────────────────────── */}
      <div
        id="mpr-splitter"
        onMouseDown={handleSplitterMouseDown}
        style={{
          width: '4px',
          height: '100%',
          flexShrink: 0,
          cursor: 'col-resize',
          backgroundColor: isDragging ? '#7c3aed' : '#1a1a26',
          transition: isDragging ? 'none' : 'background-color 0.2s',
          zIndex: 10,
          position: 'relative',
        }}
        title="Drag to resize panels"
      >
        {/* Grip dots */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex', flexDirection: 'column', gap: '3px',
        }}>
          {[0,1,2].map((i) => (
            <div key={i} style={{
              width: '3px', height: '3px', borderRadius: '50%',
              backgroundColor: isDragging ? '#a78bfa' : '#3d3d55',
            }} />
          ))}
        </div>
      </div>

      {/* ── Sagittal panel ───────────────────────────────────────────────── */}
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
  );
}

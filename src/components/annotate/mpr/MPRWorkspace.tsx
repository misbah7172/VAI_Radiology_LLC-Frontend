'use client';

import { useState, useCallback, useEffect } from 'react';
import ViewerPanel from './ViewerPanel';
import ImageMetadataPanel from './ImageMetadataPanel';
import { PLANE_COLORS, PLANE_LABELS } from '@/types/mpr';
import type { MPRPlane } from '@/types/mpr';

export default function MPRWorkspace() {
  // Track separator positions (% from left and top)
  const [splitX, setSplitX] = useState(50);
  const [splitY, setSplitY] = useState(50);
  const [isDraggingX, setIsDraggingX] = useState(false);
  const [isDraggingY, setIsDraggingY] = useState(false);

  // Responsive mobile state
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState<MPRPlane | 'info'>('axial');

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

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

  const TABS: { id: MPRPlane | 'info'; label: string; color: string }[] = [
    { id: 'axial',    label: PLANE_LABELS.axial,    color: PLANE_COLORS.axial },
    { id: 'sagittal', label: PLANE_LABELS.sagittal, color: PLANE_COLORS.sagittal },
    { id: 'coronal',  label: PLANE_LABELS.coronal,  color: PLANE_COLORS.coronal },
    { id: 'info',     label: 'Info',                color: '#a78bfa' },
  ];

  // ── MOBILE TAB LAYOUT ──────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div id="mpr-workspace" style={{
        display: 'flex', flexDirection: 'column',
        width: '100%', height: '100%',
        overflow: 'hidden', backgroundColor: '#08080c',
      }}>
        {/* Tab bar */}
        <div style={{
          display: 'flex', flexShrink: 0,
          borderBottom: '1px solid #1a1a26',
          backgroundColor: '#0e0e14',
        }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1, padding: '10px 6px',
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '11px', fontWeight: 600,
                color: activeTab === tab.id ? tab.color : '#3d3d55',
                borderBottom: activeTab === tab.id ? `2px solid ${tab.color}` : '2px solid transparent',
                transition: 'all 0.15s',
                letterSpacing: '0.03em',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Active panel */}
        <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
          {activeTab === 'axial' && <ViewerPanel plane="axial" />}
          {activeTab === 'sagittal' && <ViewerPanel plane="sagittal" />}
          {activeTab === 'coronal' && <ViewerPanel plane="coronal" />}
          {activeTab === 'info' && <ImageMetadataPanel />}
        </div>
      </div>
    );
  }

  // ── DESKTOP 2x2 GRID LAYOUT ────────────────────────────────────────────────
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

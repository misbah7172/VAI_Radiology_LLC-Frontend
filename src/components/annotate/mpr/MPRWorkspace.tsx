'use client';

import { useState, useCallback, useEffect } from 'react';
import ViewerPanel from './ViewerPanel';
import ImageMetadataPanel from './ImageMetadataPanel';
import { useMPRStore, MPR_PRESET_CLASSES } from '@/stores/mprStore';
import { PLANE_COLORS, PLANE_LABELS } from '@/types/mpr';
import type { MPRPlane } from '@/types/mpr';

// 24 curated annotation colors
const ANNOTATION_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#84cc16', '#22c55e', '#10b981', '#14b8a6',
  '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6',
  '#a855f7', '#ec4899', '#f43f5e', '#d946ef',
  '#ffffff', '#e2e8f0', '#94a3b8', '#64748b',
  '#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff',
];

// ── Naming dialog extracted as its own component so state is initialised
// from props at mount time, avoiding setState-in-effect lint errors.
interface NamingDialogProps {
  defaultName: string;
  defaultCategory: string;
  defaultColor: string;
  onSave: (name: string, category: string, color: string) => void;
  onCancel: () => void;
}

function AnnotationNamingDialog({ defaultName, defaultCategory, defaultColor, onSave, onCancel }: NamingDialogProps) {
  const [name, setName] = useState(defaultName);
  const [category, setCategory] = useState(defaultCategory);
  const [color, setColor] = useState(defaultColor);

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'rgba(5, 5, 8, 0.75)',
      backdropFilter: 'blur(6px)',
    }}>
      <div style={{
        width: '340px', backgroundColor: '#0d0d14',
        border: '1px solid #232332', borderRadius: '12px',
        padding: '18px',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5), 0 10px 10px -5px rgba(0,0,0,0.4)',
        display: 'flex', flexDirection: 'column', gap: '14px',
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#f4f4f7' }}>
            Configure Annotation Mark
          </h3>
          <p style={{ margin: '3px 0 0', fontSize: '11px', color: '#63637e' }}>
            Name, categorize and choose a color for your mark.
          </p>
        </div>

        {/* Name input */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ fontSize: '11px', fontWeight: 600, color: '#a0a0b2' }}>Annotation Name</label>
          <input
            autoFocus
            type="text"
            placeholder="e.g. Tumor A"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              backgroundColor: '#181822', border: '1px solid #232332',
              color: '#f4f4f7', fontSize: '12px',
              padding: '7px 10px', borderRadius: '6px', outline: 'none',
            }}
          />
        </div>

        {/* Category input */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ fontSize: '11px', fontWeight: 600, color: '#a0a0b2' }}>Category</label>
          <input
            type="text"
            list="mpr-category-presets"
            placeholder="Select or type category..."
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{
              backgroundColor: '#181822', border: '1px solid #232332',
              color: '#f4f4f7', fontSize: '12px',
              padding: '7px 10px', borderRadius: '6px', outline: 'none',
            }}
          />
          <datalist id="mpr-category-presets">
            {MPR_PRESET_CLASSES.map((c) => (
              <option key={c.name} value={c.name} />
            ))}
          </datalist>
        </div>

        {/* ── Color picker ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ fontSize: '11px', fontWeight: 600, color: '#a0a0b2' }}>Color</label>
            {/* Custom color swatch + native picker */}
            <label style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              fontSize: '10px', color: '#63637e', cursor: 'pointer',
            }}>
              <div style={{
                width: '20px', height: '20px', borderRadius: '4px',
                backgroundColor: color,
                border: color === '#ffffff' ? '1px solid #3d3d55' : '2px solid rgba(255,255,255,0.25)',
                boxShadow: `0 0 0 3px rgba(255,255,255,0.06)`,
                flexShrink: 0,
              }} />
              Custom
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                style={{ width: 0, height: 0, opacity: 0, position: 'absolute', pointerEvents: 'none' }}
                tabIndex={-1}
                ref={(el) => {
                  // allow the label click to open the native picker
                  if (el) el.style.pointerEvents = 'auto';
                }}
              />
            </label>
          </div>

          {/* 24 preset swatches */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(8, 1fr)',
            gap: '5px',
          }}>
            {ANNOTATION_COLORS.map((c) => (
              <button
                key={c}
                title={c}
                onClick={() => setColor(c)}
                style={{
                  width: '100%',
                  aspectRatio: '1',
                  borderRadius: '5px',
                  backgroundColor: c,
                  border: color === c
                    ? '2px solid #ffffff'
                    : c === '#ffffff' ? '1px solid #3d3d55' : '2px solid transparent',
                  cursor: 'pointer',
                  boxShadow: color === c ? `0 0 0 2px ${c}55` : 'none',
                  transition: 'transform 0.1s, box-shadow 0.1s',
                  padding: 0,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.18)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              />
            ))}
          </div>

          {/* Live preview bar */}
          <div style={{
            height: '4px', borderRadius: '2px',
            backgroundColor: color,
            transition: 'background-color 0.2s',
            boxShadow: `0 0 8px ${color}88`,
          }} />
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: '8px', borderRadius: '6px',
              border: '1px solid #232332', backgroundColor: 'rgba(255,255,255,0.02)',
              color: '#a0a0b2', fontSize: '12px', fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'; }}
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(name.trim() || 'unnamed', category.trim() || 'General', color)}
            style={{
              flex: 1, padding: '8px', borderRadius: '6px',
              border: 'none', backgroundColor: color,
              color: '#ffffff', fontSize: '12px', fontWeight: 600,
              cursor: 'pointer', transition: 'background-color 0.2s',
              textShadow: '0 1px 2px rgba(0,0,0,0.4)',
            }}
          >
            Save Mark
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MPRWorkspace() {
  const { pendingAnnotation, savePendingAnnotation, cancelPendingAnnotation } = useMPRStore();

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

      {/* ── Naming Dialog (keyed so it re-mounts fresh on each new annotation) */}
      {pendingAnnotation && (() => {
        const planeStr = PLANE_LABELS[pendingAnnotation.plane];
        const sliceNum = pendingAnnotation.sliceIndex + 1;
        const toolStr = pendingAnnotation.shape.type;
        const existingCount = Object.values(useMPRStore.getState().mprAnnotations[pendingAnnotation.plane])
          .reduce((sum, shapes) => sum + shapes.length, 0);
        const defaultName = `${planeStr} Slice ${sliceNum} ${toolStr} ${existingCount + 1}`;
        const defaultCategory = useMPRStore.getState().selectedClass || 'Tumor';
        // Default color: match the preset class color, or fall back to first palette entry
        const selectedClass = useMPRStore.getState().selectedClass;
        const preset = MPR_PRESET_CLASSES.find((c) => c.name === selectedClass);
        const defaultColor = preset?.color ?? ANNOTATION_COLORS[0];

        return (
          <AnnotationNamingDialog
            key={pendingAnnotation.shape.id}
            defaultName={defaultName}
            defaultCategory={defaultCategory}
            defaultColor={defaultColor}
            onSave={savePendingAnnotation}
            onCancel={cancelPendingAnnotation}
          />
        );
      })()}
    </div>
  );
}

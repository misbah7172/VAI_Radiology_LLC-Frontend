'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMPRStore, MPR_PRESET_CLASSES } from '@/stores/mprStore';
import { WINDOW_PRESETS, PLANE_LABELS, PLANE_COLORS } from '@/types/mpr';
import type { MPRPlane } from '@/types/mpr';

interface Props {
  plane: MPRPlane;
}

export default function ViewerTopToolbar({ plane }: Props) {
  const {
    series, viewers,
    setSlice, deltaSlice,
    toggleWindow, toggleHide, toggleHidePrev,
    applyWindowPreset,
    selectedClass, setSelectedClass,
  } = useMPRStore();

  const v = viewers[plane];
  const totalSlices = series[plane]?.images.length ?? 0;
  const planeColor = PLANE_COLORS[plane];
  const planeLabel = PLANE_LABELS[plane];

  const prevDisabled = v.sliceIndex === 0;
  const nextDisabled = v.sliceIndex >= totalSlices - 1;

  const borderStyle: React.CSSProperties = {
    borderBottom: '1px solid #1a1a26',
    backgroundColor: '#0e0e14',
    userSelect: 'none',
  };

  const checkboxLabel: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '11px',
    color: '#a0a0b2',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  };

  return (
    <div style={borderStyle}>
      {/* Row 1: Navigation + plane name */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 12px', gap: '8px',
      }}>
        {/* Prev */}
        <button
          id={`${plane}-prev-slice`}
          onClick={() => deltaSlice(plane, -1)}
          disabled={prevDisabled}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '28px', height: '28px', borderRadius: '6px',
            background: prevDisabled ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.07)',
            border: '1px solid #232332',
            color: prevDisabled ? '#3d3d55' : '#a0a0b2',
            cursor: prevDisabled ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s',
          }}
        >
          <ChevronLeft style={{ width: '14px', height: '14px' }} />
        </button>

        {/* Plane label + slice counter */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
          <span style={{
            fontSize: '13px', fontWeight: 700, color: planeColor, letterSpacing: '0.04em',
          }}>
            {planeLabel}
          </span>
          <span style={{ fontSize: '11px', color: '#63637e', marginTop: '1px' }}>
            {totalSlices > 0 ? `${v.sliceIndex + 1} / ${totalSlices}` : '— / —'}
          </span>
        </div>

        {/* Next */}
        <button
          id={`${plane}-next-slice`}
          onClick={() => deltaSlice(plane, 1)}
          disabled={nextDisabled}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '28px', height: '28px', borderRadius: '6px',
            background: nextDisabled ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.07)',
            border: '1px solid #232332',
            color: nextDisabled ? '#3d3d55' : '#a0a0b2',
            cursor: nextDisabled ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s',
          }}
        >
          <ChevronRight style={{ width: '14px', height: '14px' }} />
        </button>
      </div>

      {/* Row 2: Class + checkboxes + window preset */}
      <div style={{
        display: 'flex', alignItems: 'center', flexWrap: 'wrap',
        padding: '6px 12px', gap: '10px',
        borderTop: '1px solid #1a1a26',
      }}>
        {/* Class selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ fontSize: '10px', color: '#63637e', whiteSpace: 'nowrap' }}>Class:</span>
          <select
            id={`${plane}-class-select`}
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            style={{
              backgroundColor: '#181822',
              border: '1px solid #232332',
              color: '#f4f4f7',
              fontSize: '11px',
              padding: '3px 6px',
              borderRadius: '5px',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {MPR_PRESET_CLASSES.map((c) => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Hide Annotations */}
        <label style={checkboxLabel}>
          <input
            id={`${plane}-hide-annotations`}
            type="checkbox"
            checked={v.hideAnnotations}
            onChange={() => toggleHide(plane)}
            style={{ accentColor: '#7c3aed', cursor: 'pointer' }}
          />
          Hide Annotations
        </label>

        {/* Hide Review Annotations */}
        <label style={checkboxLabel}>
          <input
            id={`${plane}-hide-prev-annotations`}
            type="checkbox"
            checked={v.hidePrevAnnotations}
            onChange={() => toggleHidePrev(plane)}
            style={{ accentColor: '#7c3aed', cursor: 'pointer' }}
          />
          Hide Review
        </label>

        {/* Apply CT Window */}
        <label style={checkboxLabel}>
          <input
            id={`${plane}-apply-window`}
            type="checkbox"
            checked={v.applyWindow}
            onChange={() => toggleWindow(plane)}
            style={{ accentColor: '#7c3aed', cursor: 'pointer' }}
          />
          CT Window
        </label>

        {/* Window preset dropdown */}
        {v.applyWindow && (
          <select
            id={`${plane}-window-preset`}
            defaultValue=""
            onChange={(e) => {
              const preset = WINDOW_PRESETS.find((p) => p.name === e.target.value);
              if (preset) applyWindowPreset(plane, preset);
              e.target.value = '';
            }}
            style={{
              backgroundColor: '#181822',
              border: '1px solid #7c3aed',
              color: '#a78bfa',
              fontSize: '11px',
              padding: '3px 6px',
              borderRadius: '5px',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <option value="" disabled>Preset…</option>
            {WINDOW_PRESETS.map((p) => (
              <option key={p.name} value={p.name}>{p.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Row 3: Slice slider */}
      {totalSlices > 1 && (
        <div style={{ padding: '4px 12px 8px', borderTop: '1px solid #1a1a26' }}>
          <input
            id={`${plane}-slice-slider`}
            type="range"
            min={0}
            max={totalSlices - 1}
            value={v.sliceIndex}
            onChange={(e) => setSlice(plane, parseInt(e.target.value))}
            style={{
              width: '100%',
              height: '3px',
              accentColor: planeColor,
              cursor: 'pointer',
            }}
          />
        </div>
      )}
    </div>
  );
}

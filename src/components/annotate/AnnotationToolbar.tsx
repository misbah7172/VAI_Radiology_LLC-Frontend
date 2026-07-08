'use client';

import { useState } from 'react';
import {
  Pencil, MapPin, Save, RotateCcw, Loader2,
  ChevronLeft, ChevronRight, Eye, EyeOff,
} from 'lucide-react';
import { useAnnotationStore, PRESET_CLASSES } from '@/stores/annotationStore';
import toast from 'react-hot-toast';

export default function AnnotationToolbar() {
  const {
    isDrawing, setIsDrawing, currentPolygon, clearCurrentPolygon, saveAnnotation,
    selectedClass, setSelectedClass,
    selectedColor, setSelectedColor,
    hideAnnotations, setHideAnnotations,
    activeTool, setActiveTool,
    images, activeImageIndex, setActiveImageIndex,
  } = useAnnotationStore();

  const [isSaving, setIsSaving] = useState(false);
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);
  const [inputFocused, setInputFocused] = useState(false);
  const [customLabel, setCustomLabel] = useState('');

  const image = images[activeImageIndex];
  const totalImages = images.length;

  const handleSave = async () => {
    if (currentPolygon.length < 1) {
      toast.error('Place at least one point to save');
      return;
    }
    if (activeTool === 'polygon' && currentPolygon.length < 3) {
      toast.error('Draw at least 3 points to form a polygon');
      return;
    }
    setIsSaving(true);
    const label = customLabel.trim() || selectedClass;
    try {
      await saveAnnotation(label, selectedColor);
      setCustomLabel('');
      toast.success('Annotation saved!');
    } catch {
      toast.error('Failed to save annotation');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleDraw = (tool: 'polygon' | 'point') => {
    if (isDrawing && activeTool === tool) {
      clearCurrentPolygon();
      setIsDrawing(false);
    } else {
      clearCurrentPolygon();
      setActiveTool(tool);
      setIsDrawing(true);
    }
  };

  const btnStyle = (key: string, active = false, danger = false): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '7px 14px',
    borderRadius: '7px',
    border: active ? 'none' : '1px solid #232332',
    fontSize: '12px',
    fontWeight: 500,
    fontFamily: 'inherit',
    background: active
      ? (danger ? '#ef4444' : '#7c3aed')
      : hoveredBtn === key
      ? 'rgba(255,255,255,0.07)'
      : 'rgba(255,255,255,0.03)',
    color: active ? '#ffffff' : hoveredBtn === key ? '#d4d4e8' : '#8888a8',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    userSelect: 'none',
  });

  return (
    <div style={{ backgroundColor: '#111116', borderBottom: '1px solid #1a1a26' }}>
      {/* ── Row 1: Navigation + Class + Hide toggles ─────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px 20px',
        borderBottom: '1px solid #1a1a26',
        flexWrap: 'wrap',
      }}>
        {/* Frame navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            onClick={() => setActiveImageIndex(Math.max(0, activeImageIndex - 1))}
            disabled={activeImageIndex === 0}
            style={{
              ...btnStyle('prev'),
              padding: '6px 10px',
              opacity: activeImageIndex === 0 ? 0.3 : 1,
            }}
            onMouseEnter={() => setHoveredBtn('prev')}
            onMouseLeave={() => setHoveredBtn(null)}
          >
            <ChevronLeft style={{ width: '14px', height: '14px' }} />
          </button>
          <span style={{
            fontSize: '12px',
            color: '#d4d4e8',
            fontWeight: 600,
            padding: '0 8px',
            letterSpacing: '0.02em',
            whiteSpace: 'nowrap',
          }}>
            {image?.filename?.split('/').pop()?.substring(0, 24) ?? '—'}{' '}
            <span style={{ color: '#5a5a7a', fontWeight: 400 }}>({activeImageIndex + 1}/{totalImages})</span>
          </span>
          <button
            onClick={() => setActiveImageIndex(Math.min(totalImages - 1, activeImageIndex + 1))}
            disabled={activeImageIndex >= totalImages - 1}
            style={{
              ...btnStyle('next'),
              padding: '6px 10px',
              opacity: activeImageIndex >= totalImages - 1 ? 0.3 : 1,
            }}
            onMouseEnter={() => setHoveredBtn('next')}
            onMouseLeave={() => setHoveredBtn(null)}
          >
            <ChevronRight style={{ width: '14px', height: '14px' }} />
          </button>
        </div>

        <div style={{ width: '1px', height: '20px', backgroundColor: '#232332', flexShrink: 0 }} />

        {/* Class selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: '#63637e', fontWeight: 600, whiteSpace: 'nowrap' }}>Select Class:</span>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            style={{
              padding: '5px 10px',
              borderRadius: '7px',
              border: '1px solid #232332',
              backgroundColor: '#181822',
              color: '#f4f4f7',
              fontSize: '12px',
              fontFamily: 'inherit',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            {PRESET_CLASSES.map((c) => (
              <option key={c.name} value={c.name} style={{ background: '#111116' }}>{c.name}</option>
            ))}
          </select>
          {/* Color swatch */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {PRESET_CLASSES.slice(0, 6).map((c) => (
              <button
                key={c.color}
                onClick={() => { setSelectedColor(c.color); setSelectedClass(c.name); }}
                style={{
                  width: '18px', height: '18px', borderRadius: '50%', padding: 0, cursor: 'pointer',
                  backgroundColor: c.color,
                  border: selectedColor === c.color ? '2px solid #fff' : '2px solid transparent',
                  boxShadow: selectedColor === c.color ? `0 0 6px ${c.color}` : 'none',
                  transform: selectedColor === c.color ? 'scale(1.25)' : 'scale(1)',
                  transition: 'all 0.12s ease',
                }}
                title={c.name}
              />
            ))}
          </div>
        </div>

        <div style={{ width: '1px', height: '20px', backgroundColor: '#232332', flexShrink: 0 }} />

        {/* Hide toggle */}
        <button
          id="hide-annotations-toggle"
          onClick={() => setHideAnnotations(!hideAnnotations)}
          onMouseEnter={() => setHoveredBtn('hide')}
          onMouseLeave={() => setHoveredBtn(null)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px',
            borderRadius: '7px',
            border: hideAnnotations ? '1px solid #7c3aed' : '1px solid #232332',
            fontSize: '11px',
            fontWeight: 500,
            fontFamily: 'inherit',
            background: hideAnnotations ? 'rgba(124,58,237,0.12)' : 'transparent',
            color: hideAnnotations ? '#a78bfa' : '#8888a8',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          {hideAnnotations ? <EyeOff style={{ width: '13px', height: '13px' }} /> : <Eye style={{ width: '13px', height: '13px' }} />}
          {hideAnnotations ? 'Show Annotations' : 'Hide Annotations'}
        </button>

        {/* Annotation count badge */}
        {image && image.annotations.length > 0 && (
          <span style={{
            padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700,
            backgroundColor: 'rgba(124,58,237,0.15)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.25)',
          }}>
            {image.annotations.length} region{image.annotations.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* ── Row 2: Tool buttons ───────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 20px',
        flexWrap: 'wrap',
      }}>
        {/* Draw Polygon */}
        <button
          id="toggle-polygon-btn"
          onClick={() => toggleDraw('polygon')}
          onMouseEnter={() => setHoveredBtn('polygon')}
          onMouseLeave={() => setHoveredBtn(null)}
          style={btnStyle('polygon', isDrawing && activeTool === 'polygon')}
        >
          <Pencil style={{ width: '13px', height: '13px' }} />
          {isDrawing && activeTool === 'polygon' ? 'Drawing Polygon…' : 'Draw Polygon'}
        </button>

        {/* Mark Point */}
        <button
          id="toggle-point-btn"
          onClick={() => toggleDraw('point')}
          onMouseEnter={() => setHoveredBtn('point')}
          onMouseLeave={() => setHoveredBtn(null)}
          style={btnStyle('point', isDrawing && activeTool === 'point')}
        >
          <MapPin style={{ width: '13px', height: '13px' }} />
          {isDrawing && activeTool === 'point' ? 'Placing Point…' : 'Mark Point'}
        </button>

        {/* Clear */}
        {currentPolygon.length > 0 && (
          <button
            id="clear-polygon-btn"
            onClick={clearCurrentPolygon}
            onMouseEnter={() => setHoveredBtn('clear')}
            onMouseLeave={() => setHoveredBtn(null)}
            style={btnStyle('clear')}
          >
            <RotateCcw style={{ width: '13px', height: '13px' }} />
            Clear ({currentPolygon.length} pts)
          </button>
        )}

        {/* Custom label override */}
        {isDrawing && (
          <input
            id="annotation-label-input"
            type="text"
            value={customLabel}
            onChange={(e) => setCustomLabel(e.target.value)}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            placeholder={`Label (default: ${selectedClass})`}
            style={{
              padding: '7px 12px',
              borderRadius: '7px',
              fontSize: '12px',
              fontFamily: 'inherit',
              backgroundColor: '#181822',
              border: `1px solid ${inputFocused ? '#7c6fcd' : '#232332'}`,
              color: '#f4f4f7',
              outline: 'none',
              width: '190px',
              boxShadow: inputFocused ? '0 0 0 2px rgba(124,58,237,0.12)' : 'none',
              transition: 'all 0.15s ease',
            }}
          />
        )}

        {/* Save button */}
        {isDrawing && currentPolygon.length >= (activeTool === 'polygon' ? 3 : 1) && (
          <button
            id="save-annotation-btn"
            onClick={handleSave}
            disabled={isSaving}
            onMouseEnter={() => setHoveredBtn('save')}
            onMouseLeave={() => setHoveredBtn(null)}
            style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              padding: '7px 16px',
              borderRadius: '7px', border: 'none',
              fontSize: '12px', fontWeight: 600, fontFamily: 'inherit',
              color: '#ffffff',
              background: isSaving
                ? 'rgba(16,185,129,0.5)'
                : hoveredBtn === 'save'
                ? 'linear-gradient(135deg, #059669, #047857)'
                : 'linear-gradient(135deg, #10b981, #059669)',
              boxShadow: hoveredBtn === 'save' && !isSaving ? '0 4px 14px -4px rgba(16,185,129,0.5)' : 'none',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {isSaving
              ? <Loader2 style={{ width: '13px', height: '13px', animation: 'spin 1s linear infinite' }} />
              : <Save style={{ width: '13px', height: '13px' }} />}
            Save {activeTool === 'point' ? 'Point' : 'Region'}
          </button>
        )}

        {/* Hint */}
        {isDrawing && activeTool === 'polygon' && (
          <p style={{ fontSize: '11px', color: '#5a5a7a', marginLeft: 'auto', margin: 0, whiteSpace: 'nowrap' }}>
            Click to add points · Click 1st point or Save to close
          </p>
        )}
      </div>
    </div>
  );
}

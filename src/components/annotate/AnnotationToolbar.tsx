'use client';

import { useState } from 'react';
import { Pencil, Square, Save, RotateCcw, Loader2 } from 'lucide-react';
import { useAnnotationStore } from '@/stores/annotationStore';
import toast from 'react-hot-toast';

const COLORS = [
  '#FF6B6B', '#FF9F43', '#FECA57', '#48DBFB',
  '#A29BFE', '#6C5CE7', '#55EFC4', '#FD79A8',
];

export default function AnnotationToolbar() {
  const { isDrawing, setIsDrawing, currentPolygon, clearCurrentPolygon, saveAnnotation } =
    useAnnotationStore();
  const [label, setLabel] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (currentPolygon.length < 3) {
      toast.error('Draw at least 3 points to form a polygon');
      return;
    }
    setIsSaving(true);
    try {
      await saveAnnotation(label.trim() || 'Unlabeled', selectedColor);
      setLabel('');
      toast.success('Annotation saved!');
    } catch {
      toast.error('Failed to save annotation');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="flex items-center gap-4 px-4 py-3 flex-wrap"
      style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}
    >
      {/* Draw toggle */}
      <button
        id="toggle-draw-btn"
        onClick={() => {
          if (isDrawing) { clearCurrentPolygon(); }
          setIsDrawing(!isDrawing);
        }}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
        style={{
          background: isDrawing ? 'var(--accent)' : 'var(--bg-card)',
          color: isDrawing ? 'white' : 'var(--text-secondary)',
          border: isDrawing ? 'none' : '1px solid var(--border)',
        }}
      >
        <Pencil className="w-4 h-4" />
        {isDrawing ? 'Drawing…' : 'Draw Polygon'}
      </button>

      {/* Clear polygon */}
      {currentPolygon.length > 0 && (
        <button
          id="clear-polygon-btn"
          onClick={clearCurrentPolygon}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors"
          style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
        >
          <RotateCcw className="w-4 h-4" />
          Clear ({currentPolygon.length} pts)
        </button>
      )}

      {/* Label input */}
      {isDrawing && (
        <input
          id="annotation-label-input"
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Label (e.g. Tumor)"
          className="px-3 py-2 rounded-xl text-sm"
          style={{
            background: 'var(--bg-primary)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
            outline: 'none',
            width: '160px',
          }}
        />
      )}

      {/* Color picker */}
      {isDrawing && (
        <div className="flex items-center gap-1.5">
          {COLORS.map((color) => (
            <button
              key={color}
              id={`color-${color.replace('#', '')}`}
              onClick={() => setSelectedColor(color)}
              className="w-6 h-6 rounded-full transition-all duration-200"
              style={{
                background: color,
                transform: selectedColor === color ? 'scale(1.3)' : 'scale(1)',
                boxShadow: selectedColor === color ? `0 0 8px ${color}` : 'none',
                border: selectedColor === color ? '2px solid white' : '2px solid transparent',
              }}
              title={color}
              aria-label={`Select color ${color}`}
            />
          ))}
        </div>
      )}

      {/* Save polygon */}
      {isDrawing && currentPolygon.length >= 3 && (
        <button
          id="save-polygon-btn"
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-60"
          style={{
            background: 'linear-gradient(135deg, #10b981, #059669)',
            color: 'white',
          }}
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Annotation
        </button>
      )}

      {/* Hints */}
      {isDrawing && (
        <p className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>
          Click to add points · Double-click to close polygon
        </p>
      )}
    </div>
  );
}

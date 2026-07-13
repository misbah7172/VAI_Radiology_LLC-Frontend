'use client';

import { useMPRStore } from '@/stores/mprStore';
import { RotateCcw, Maximize, Save } from 'lucide-react';
import type { MPRPlane, DrawingTool } from '@/types/mpr';
import toast from 'react-hot-toast';
import { useState } from 'react';

interface Props {
  plane: MPRPlane;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  imgWidth: number;
  imgHeight: number;
}

const TOOLS: { id: DrawingTool; emoji: string; label: string }[] = [
  { id: 'pencil',    emoji: '✏️',  label: 'Pencil (polygon)' },
  { id: 'brush',     emoji: '🖌️', label: 'Brush (freehand)' },
  { id: 'circle',    emoji: '⭕',  label: 'Circle' },
  { id: 'rectangle', emoji: '⬜', label: 'Rectangle' },
  { id: 'eraser',    emoji: '🧽', label: 'Eraser' },
];

export default function ViewerBottomToolbar({ plane, canvasRef, imgWidth, imgHeight }: Props) {
  const {
    viewers, setTool, undo, redo, resetView, fitToScreen,
    commitAnnotation, clearInProgress,
    undoStack, redoStack,
  } = useMPRStore();

  const v = viewers[plane];
  const [savingHov, setSavingHov] = useState(false);

  const handleSave = async () => {
    const { sliceIndex, inProgressPoints, activeTool } = v;
    if (
      (activeTool === 'pencil' || activeTool === 'brush') && inProgressPoints.length < 2
    ) {
      toast.error('Draw at least 2 points');
      return;
    }
    await commitAnnotation(plane, sliceIndex);
    toast.success('Annotation saved!');
  };

  const toolBtn = (active: boolean, disabled = false): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    borderRadius: '7px',
    border: active ? 'none' : '1px solid #232332',
    background: active
      ? 'linear-gradient(135deg, #7c3aed, #5b21b6)'
      : 'rgba(255,255,255,0.03)',
    color: active ? '#fff' : disabled ? '#3d3d55' : '#a0a0b2',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: '15px',
    boxShadow: active ? '0 2px 10px rgba(124,58,237,0.35)' : 'none',
    transition: 'all 0.15s ease',
    flexShrink: 0,
  });

  const iconBtn = (disabled = false): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '5px 10px',
    borderRadius: '6px',
    border: '1px solid #232332',
    background: 'rgba(255,255,255,0.03)',
    color: disabled ? '#3d3d55' : '#a0a0b2',
    fontSize: '11px',
    fontWeight: 500,
    fontFamily: 'inherit',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.15s ease',
    flexShrink: 0,
  });

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '8px 10px',
      borderTop: '1px solid #1a1a26',
      backgroundColor: '#0e0e14',
      flexWrap: 'wrap',
      userSelect: 'none',
    }}>
      {/* Drawing tools */}
      {TOOLS.map(({ id, emoji, label }) => (
        <button
          key={id}
          id={`${plane}-tool-${id}`}
          title={label}
          onClick={() => setTool(plane, id)}
          style={toolBtn(v.activeTool === id)}
        >
          <span style={{ fontSize: '14px' }}>{emoji}</span>
        </button>
      ))}

      {/* Divider */}
      <div style={{ width: '1px', height: '24px', backgroundColor: '#232332', margin: '0 2px', flexShrink: 0 }} />

      {/* Undo */}
      <button
        id={`${plane}-undo`}
        title="Undo"
        onClick={() => undo()}
        disabled={undoStack.length === 0}
        style={iconBtn(undoStack.length === 0)}
      >
        <RotateCcw style={{ width: '12px', height: '12px' }} />
        Undo
      </button>

      {/* Redo */}
      <button
        id={`${plane}-redo`}
        title="Redo"
        onClick={() => redo()}
        disabled={redoStack.length === 0}
        style={iconBtn(redoStack.length === 0)}
      >
        <RotateCcw style={{ width: '12px', height: '12px', transform: 'scaleX(-1)' }} />
        Redo
      </button>

      {/* Divider */}
      <div style={{ width: '1px', height: '24px', backgroundColor: '#232332', margin: '0 2px', flexShrink: 0 }} />

      {/* Reset View */}
      <button
        id={`${plane}-reset-view`}
        title="Reset zoom/pan"
        onClick={() => resetView(plane)}
        style={iconBtn()}
      >
        Reset
      </button>

      {/* Fit Screen */}
      <button
        id={`${plane}-fit-screen`}
        title="Fit image to screen"
        onClick={() => {
          const canvas = canvasRef.current;
          if (canvas) fitToScreen(plane, canvas.width, canvas.height, imgWidth, imgHeight);
        }}
        style={iconBtn()}
      >
        <Maximize style={{ width: '11px', height: '11px' }} />
        Fit
      </button>

      {/* Divider */}
      <div style={{ flex: 1 }} />

      {/* Clear in-progress */}
      <button
        id={`${plane}-cancel-draw`}
        title="Cancel current drawing"
        onClick={() => clearInProgress(plane)}
        style={iconBtn()}
      >
        Cancel
      </button>

      {/* Save Annotation */}
      <button
        id={`${plane}-save-annotation`}
        title="Save current annotation"
        onClick={handleSave}
        onMouseEnter={() => setSavingHov(true)}
        onMouseLeave={() => setSavingHov(false)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          padding: '6px 12px',
          borderRadius: '6px',
          border: 'none',
          background: savingHov
            ? 'linear-gradient(135deg, #6d28d9, #4c1d95)'
            : 'linear-gradient(135deg, #7c3aed, #5b21b6)',
          color: '#fff',
          fontSize: '11px',
          fontWeight: 600,
          fontFamily: 'inherit',
          cursor: 'pointer',
          boxShadow: '0 2px 10px rgba(124,58,237,0.3)',
          transition: 'all 0.15s ease',
          flexShrink: 0,
        }}
      >
        <Save style={{ width: '11px', height: '11px' }} />
        Save
      </button>
    </div>
  );
}

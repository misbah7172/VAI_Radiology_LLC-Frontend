'use client';

import { useMPRStore } from '@/stores/mprStore';
import { PLANE_COLORS, PLANE_LABELS } from '@/types/mpr';
import type { MPRPlane, AnnotationShape } from '@/types/mpr';
import { Trash2 } from 'lucide-react';

const PLANE_ORDER: MPRPlane[] = ['axial', 'sagittal', 'coronal'];

function shapeIcon(type: AnnotationShape['type']) {
  switch (type) {
    case 'polygon':   return '\u2B21';
    case 'brush':     return '\uD83D\uDD8C';
    case 'circle':    return '\u25CB';
    case 'rectangle': return '\u2B1C';
    default:          return '\u00B7';
  }
}

export default function AnnotationsSidebar() {
  const { mprAnnotations, removeAnnotation } = useMPRStore();

  // 1. Gather all annotations
  const allAnnotations: Array<{
    plane: MPRPlane;
    sliceIndex: number;
    shape: AnnotationShape;
  }> = [];

  PLANE_ORDER.forEach((plane) => {
    Object.entries(mprAnnotations[plane]).forEach(([siStr, shapes]) => {
      const sliceIndex = Number(siStr);
      shapes.forEach((shape) => {
        allAnnotations.push({ plane, sliceIndex, shape });
      });
    });
  });

  const totalCount = allAnnotations.length;

  // 2. Group by category
  const groups: Record<string, typeof allAnnotations> = {};
  allAnnotations.forEach((item) => {
    const cat = item.shape.category || 'General';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(item);
  });

  const sortedCategories = Object.keys(groups).sort();

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#0a0a10', overflow: 'hidden' }}>
      <div style={{ padding: '10px 12px 8px', borderBottom: '1px solid #1a1a26', backgroundColor: '#0e0e14', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#3d3d55', margin: 0 }}>
            Saved Annotations
          </p>
          {totalCount > 0 && (
            <span style={{ fontSize: '10px', fontWeight: 700, backgroundColor: '#7c3aed22', color: '#a78bfa', border: '1px solid #7c3aed44', borderRadius: '10px', padding: '1px 7px' }}>
              {totalCount}
            </span>
          )}
        </div>
        <p style={{ fontSize: '8px', color: '#2a2a3a', margin: '3px 0 0' }}>Auto-saved to database</p>
      </div>

      {totalCount === 0 && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '24px 16px' }}>
          <span style={{ fontSize: '28px', opacity: 0.4 }}>🏷️</span>
          <p style={{ fontSize: '11px', color: '#2a2a3a', textAlign: 'center', margin: 0 }}>
            No annotations yet. Draw on a viewer panel and click Save.
          </p>
        </div>
      )}

      {totalCount > 0 && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
          {sortedCategories.map((category) => {
            const items = groups[category];
            const groupColor = items[0]?.shape.color || '#7c3aed';

            return (
              <div key={category} style={{ marginBottom: '8px' }}>
                <div style={{
                  padding: '6px 12px',
                  display: 'flex', alignItems: 'center', gap: '6px',
                  backgroundColor: 'rgba(255,255,255,0.02)',
                  borderTop: '1px solid #141420',
                  borderBottom: '1px solid #141420',
                }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: groupColor, flexShrink: 0 }} />
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#e2e2e9', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    {category}
                  </span>
                  <span style={{ fontSize: '8.5px', color: '#63637e', marginLeft: 'auto' }}>
                    {items.length} mark(s)
                  </span>
                </div>

                {items.map(({ plane, sliceIndex, shape }) => {
                  const planeColor = PLANE_COLORS[plane];
                  const planeLabel = PLANE_LABELS[plane];

                  return (
                    <div
                      key={shape.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '7px',
                        padding: '6px 10px 6px 16px', borderBottom: '1px solid #12121a',
                        transition: 'background 0.15s', cursor: 'default'
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = '#111118'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent'; }}
                    >
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: shape.color, flexShrink: 0 }} />
                      <span style={{ fontSize: '11px', color: '#63637e', flexShrink: 0 }}>{shapeIcon(shape.type)}</span>
                      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#a0a0b2', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {shape.label}
                        </span>
                        <span style={{ fontSize: '8.5px', color: '#4d4d68', display: 'flex', gap: '4px', alignItems: 'center' }}>
                          <span style={{ color: planeColor, fontWeight: 700 }}>{planeLabel.toUpperCase()}</span>
                          <span>·</span>
                          <span>Slice {sliceIndex + 1}</span>
                        </span>
                      </div>
                      <button
                        title="Delete annotation"
                        onClick={() => removeAnnotation(plane, sliceIndex, shape.id)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '4px', background: 'transparent', border: 'none', color: '#3d3d55', cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s', padding: 0 }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(239,68,68,0.15)'; (e.currentTarget as HTMLButtonElement).style.color = '#ef4444'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#3d3d55'; }}
                      >
                        <Trash2 style={{ width: '11px', height: '11px' }} />
                      </button>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

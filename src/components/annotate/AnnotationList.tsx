'use client';

import { Trash2, Tag } from 'lucide-react';
import { useAnnotationStore } from '@/stores/annotationStore';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';

export default function AnnotationList() {
  const { images, activeImageIndex, deleteAnnotation } = useAnnotationStore();
  const image = images[activeImageIndex];

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this annotation?')) return;
    try {
      await deleteAnnotation(id);
      toast.success('Annotation deleted');
    } catch {
      toast.error('Failed to delete annotation');
    }
  };

  if (!image) return null;

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: 'var(--bg-secondary)' }}
    >
      <div className="px-4 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
          Annotations
        </h3>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {image.filename}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {image.annotations.length === 0 ? (
          <div className="text-center py-10">
            <Tag className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              No annotations yet
            </p>
          </div>
        ) : (
          image.annotations.map((ann, idx) => (
            <div
              key={ann.id}
              id={`annotation-item-${ann.id}`}
              className="group flex items-start gap-3 p-3 rounded-xl transition-colors"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
              }}
            >
              {/* Color indicator */}
              <div
                className="w-3 h-3 rounded-full mt-0.5 flex-shrink-0"
                style={{
                  background: ann.color,
                  boxShadow: `0 0 6px ${ann.color}`,
                }}
              />

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                  {ann.label || 'Unlabeled'}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {ann.polygon_data.length} points ·{' '}
                  {format(parseISO(ann.created_at), 'MMM d, HH:mm')}
                </p>
              </div>

              {/* Delete */}
              <button
                id={`delete-annotation-${ann.id}`}
                onClick={() => handleDelete(ann.id)}
                className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: 'var(--danger)' }}
                title="Delete annotation"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Summary */}
      {image.annotations.length > 0 && (
        <div
          className="px-4 py-3 text-xs"
          style={{
            borderTop: '1px solid var(--border)',
            color: 'var(--text-muted)',
          }}
        >
          {image.annotations.length} annotation(s) on this image
        </div>
      )}
    </div>
  );
}

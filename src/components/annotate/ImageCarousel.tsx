'use client';

import { Trash2 } from 'lucide-react';
import { useAnnotationStore } from '@/stores/annotationStore';
import toast from 'react-hot-toast';

export default function ImageCarousel() {
  const { images, activeImageIndex, setActiveImageIndex, deleteImage } = useAnnotationStore();

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!confirm('Delete this image and all its annotations?')) return;
    try {
      await deleteImage(id);
      toast.success('Image deleted');
    } catch {
      toast.error('Failed to delete image');
    }
  };

  return (
    <div className="flex flex-row lg:flex-col h-full overflow-x-auto lg:overflow-y-auto p-3 gap-3"
      style={{ background: 'var(--bg-secondary)' }}>
      <div className="hidden lg:block shrink-0 px-1 py-1">
        <p className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: 'var(--text-muted)' }}>
          Images ({images.length})
        </p>
      </div>
      {images.map((img, idx) => (
        <div
          key={img.id}
          id={`image-thumb-${img.id}`}
          onClick={() => setActiveImageIndex(idx)}
          className="group relative rounded-xl overflow-hidden cursor-pointer transition-all duration-200 shrink-0 w-24 h-16 lg:w-full lg:h-24"
          style={{
            border: idx === activeImageIndex
              ? '2px solid var(--accent-light)'
              : '2px solid var(--border)',
            background: 'var(--bg-card)',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={img.file_url}
            alt={img.filename}
            className="w-full h-full object-cover"
          />

          {/* Overlay on active */}
          {idx === activeImageIndex && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ border: '2px solid var(--accent-light)', borderRadius: 'inherit' }}
            />
          )}

          {/* Delete button */}
          <button
            id={`delete-image-${img.id}`}
            onClick={(e) => handleDelete(e, img.id)}
            className="absolute top-1 right-1 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            style={{ background: 'rgba(239,68,68,0.9)', color: 'white' }}
            title="Delete image"
          >
            <Trash2 className="w-3 h-3" />
          </button>

          {/* Annotation count badge */}
          {img.annotations.length > 0 && (
            <div
              className="absolute bottom-1 left-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: 'var(--accent)', color: 'white' }}
            >
              {img.annotations.length}
            </div>
          )}

          {/* Filename tooltip */}
          <div
            className="absolute bottom-0 left-0 right-0 px-2 py-0.5 text-[10px] truncate opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: 'rgba(0,0,0,0.8)', color: 'white' }}
          >
            {img.filename}
          </div>
        </div>
      ))}
    </div>
  );
}

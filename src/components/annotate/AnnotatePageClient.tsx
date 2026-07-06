'use client';

import { useEffect } from 'react';
import { useAnnotationStore } from '@/stores/annotationStore';
import ImageUploader from './ImageUploader';
import ImageCarousel from './ImageCarousel';
import AnnotationCanvas from './AnnotationCanvas';
import AnnotationToolbar from './AnnotationToolbar';
import AnnotationList from './AnnotationList';

export default function AnnotatePageClient() {
  const { fetchImages, images, isLoading } = useAnnotationStore();

  useEffect(() => {
    fetchImages();
  }, []);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-4 sm:px-8 sm:py-5 gap-4 flex-shrink-0"
        style={{
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-secondary)',
        }}
      >
        <div>
          <h1 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Image Annotation
          </h1>
          <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Draw polygons to annotate your images
          </p>
        </div>
        <ImageUploader />
      </div>

      {/* Main content */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div
              className="w-10 h-10 rounded-full border-2 animate-spin"
              style={{ borderColor: 'var(--accent-light)', borderTopColor: 'transparent' }}
            />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Loading images…
            </p>
          </div>
        </div>
      ) : images.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">🖼️</div>
            <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              No images yet
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Upload some images to start annotating
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden min-h-0">
          {/* Top/Left: carousel */}
          <div
            className="w-full lg:w-48 h-28 lg:h-full shrink-0 overflow-hidden border-b lg:border-b-0 lg:border-r border-border"
          >
            <ImageCarousel />
          </div>

          {/* Center: canvas */}
          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            <AnnotationToolbar />
            <div className="flex-1 overflow-hidden relative min-h-[300px] lg:min-h-0 bg-black">
              <AnnotationCanvas />
            </div>
          </div>

          {/* Bottom/Right: annotation list */}
          <div
            className="w-full lg:w-72 h-64 lg:h-full shrink-0 overflow-hidden border-t lg:border-t-0 lg:border-l border-border"
          >
            <AnnotationList />
          </div>
        </div>
      )}
    </div>
  );
}

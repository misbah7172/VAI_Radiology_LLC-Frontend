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
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-8 py-5 flex-shrink-0"
        style={{
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-secondary)',
        }}
      >
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Image Annotation
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
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
        <div className="flex flex-1 overflow-hidden">
          {/* Left: carousel */}
          <div
            className="w-48 flex-shrink-0 overflow-hidden"
            style={{ borderRight: '1px solid var(--border)' }}
          >
            <ImageCarousel />
          </div>

          {/* Center: canvas */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <AnnotationToolbar />
            <div className="flex-1 overflow-hidden relative">
              <AnnotationCanvas />
            </div>
          </div>

          {/* Right: annotation list */}
          <div
            className="w-72 flex-shrink-0 overflow-hidden"
            style={{ borderLeft: '1px solid var(--border)' }}
          >
            <AnnotationList />
          </div>
        </div>
      )}
    </div>
  );
}

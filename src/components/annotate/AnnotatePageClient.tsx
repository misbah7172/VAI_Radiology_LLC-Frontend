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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '24px 32px',
          borderBottom: '1px solid #1a1a26',
          background: '#111116',
          flexShrink: 0,
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 700,
            letterSpacing: '-0.025em',
            color: '#f4f4f7',
            margin: 0,
            lineHeight: 1.1,
          }}>
            Image & Video Annotation
          </h1>
          <p style={{
            fontSize: '14px',
            color: '#63637e',
            marginTop: '5px',
          }}>
            Draw polygons to annotate medical images or video files
          </p>
        </div>
        <ImageUploader />
      </div>

      {/* Main content */}
      {isLoading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#08080c' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                border: '2px solid #7c3aed',
                borderTopColor: 'transparent',
                animation: 'spin 0.8s linear infinite',
              }}
            />
            <p style={{ fontSize: '13px', color: '#3d3d55' }}>
              Loading media files…
            </p>
          </div>
        </div>
      ) : images.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#08080c', padding: '32px' }}>
          <div style={{ textAlign: 'center', maxWidth: '360px' }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '20px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '80px',
              height: '80px',
              borderRadius: '24px',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.04)',
            }}>
              📹
            </div>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#f4f4f7', marginBottom: '8px' }}>
              No media files uploaded yet
            </h2>
            <p style={{ fontSize: '13px', color: '#63637e', lineHeight: 1.5 }}>
              Upload your images or video scans to start drawing region annotations.
            </p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0, flexDirection: 'row' }} className="annotate-layout-container">
          {/* Left: carousel list */}
          <div
            style={{
              width: '180px',
              height: '100%',
              flexShrink: 0,
              overflow: 'hidden',
              borderRight: '1px solid #1a1a26',
            }}
            className="annotate-carousel-sidebar"
          >
            <ImageCarousel />
          </div>

          {/* Center: canvas */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
            <AnnotationToolbar />
            <div style={{ flex: 1, overflow: 'hidden', position: 'relative', minHeight: '300px', backgroundColor: '#030303' }}>
              <AnnotationCanvas />
            </div>
          </div>

          {/* Right: annotation list */}
          <div
            style={{
              width: '280px',
              height: '100%',
              flexShrink: 0,
              overflow: 'hidden',
              borderLeft: '1px solid #1a1a26',
            }}
            className="annotate-list-sidebar"
          >
            <AnnotationList />
          </div>
        </div>
      )}
    </div>
  );
}

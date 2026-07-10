'use client';

import { useEffect, useState } from 'react';
import { useAnnotationStore } from '@/stores/annotationStore';
import ImageUploader from './ImageUploader';
import ImageCarousel from './ImageCarousel';
import AnnotationCanvas from './AnnotationCanvas';
import AnnotationToolbar from './AnnotationToolbar';
import AnnotationList from './AnnotationList';
import ComparisonGrid from './ComparisonGrid';

type CenterView = 'annotate' | 'compare';

export default function AnnotatePageClient() {
  const { fetchSets, imageSets, isLoading, gridSetIds } = useAnnotationStore();
  const [centerView, setCenterView] = useState<CenterView>('annotate');

  useEffect(() => {
    fetchSets();
  }, [fetchSets]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 32px',
          borderBottom: '1px solid #1a1a26',
          background: '#111116',
          flexShrink: 0,
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1 style={{
            fontSize: '26px',
            fontWeight: 700,
            letterSpacing: '-0.025em',
            color: '#f4f4f7',
            margin: 0,
            lineHeight: 1.1,
          }}>
            Image &amp; Video Annotation
          </h1>
          <p style={{ fontSize: '13px', color: '#63637e', marginTop: '4px' }}>
            Draw polygons to annotate medical images or video files
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Center view tabs */}
          <div style={{
            display: 'flex',
            borderRadius: '8px',
            border: '1px solid #232332',
            overflow: 'hidden',
            backgroundColor: '#0c0c11',
          }}>
            {(['annotate', 'compare'] as CenterView[]).map((view) => (
              <button
                key={view}
                onClick={() => setCenterView(view)}
                style={{
                  padding: '7px 16px',
                  fontSize: '12px',
                  fontWeight: 600,
                  fontFamily: 'inherit',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  backgroundColor: centerView === view ? '#7c3aed' : 'transparent',
                  color: centerView === view ? '#ffffff' : '#8888a8',
                  textTransform: 'capitalize',
                }}
              >
                {view === 'compare'
                  ? `Compare${gridSetIds.length > 0 ? ` (${gridSetIds.length})` : ''}`
                  : 'Annotate'}
              </button>
            ))}
          </div>
          <ImageUploader />
        </div>
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
      ) : imageSets.length === 0 ? (
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
              No image sets yet
            </h2>
            <p style={{ fontSize: '13px', color: '#63637e', lineHeight: 1.5 }}>
              Upload images or videos — they&apos;ll be grouped into a set automatically.
              You can then drag sets into the comparison grid to view them side-by-side.
            </p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0, flexDirection: 'row' }} className="annotate-layout-container">
          {/* Left: Sets sidebar */}
          <div
            style={{
              width: '200px',
              height: '100%',
              flexShrink: 0,
              overflow: 'hidden',
              borderRight: '1px solid #1a1a26',
            }}
            className="annotate-carousel-sidebar"
          >
            <ImageCarousel />
          </div>

          {/* Center: either Annotate canvas or Comparison Grid */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
            {centerView === 'annotate' ? (
              <>
                <AnnotationToolbar />
                <div style={{ flex: 1, overflow: 'hidden', position: 'relative', minHeight: '300px', backgroundColor: '#030303' }}>
                  <AnnotationCanvas />
                </div>
              </>
            ) : (
              <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
                <ComparisonGrid />
              </div>
            )}
          </div>

          {/* Right: annotation list — only visible in annotate mode */}
          {centerView === 'annotate' && (
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
          )}
        </div>
      )}
    </div>
  );
}

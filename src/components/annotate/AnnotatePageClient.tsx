'use client';

import { useEffect } from 'react';
import { useAnnotationStore } from '@/stores/annotationStore';
import ImageUploader from './ImageUploader';
import ImageCarousel from './ImageCarousel';
import MPRWorkspace from './mpr/MPRWorkspace';

export default function AnnotatePageClient() {
  const { fetchSets, imageSets, isLoading } = useAnnotationStore();

  useEffect(() => {
    fetchSets();
  }, [fetchSets]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 28px',
          borderBottom: '1px solid #1a1a26',
          background: '#111116',
          flexShrink: 0,
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1 style={{
            fontSize: '22px',
            fontWeight: 700,
            letterSpacing: '-0.025em',
            color: '#f4f4f7',
            margin: 0,
            lineHeight: 1.1,
          }}>
            Multi-Planar Viewer
          </h1>
          <p style={{ fontSize: '12px', color: '#63637e', marginTop: '3px' }}>
            Drag image sets from sidebar → viewer panels · Scroll to navigate slices
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ImageUploader />
        </div>
      </div>

      {/* ── Main content ────────────────────────────────────────────────────── */}
      {isLoading ? (
        /* Loading spinner */
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          backgroundColor: '#08080c',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              border: '2px solid #7c3aed', borderTopColor: 'transparent',
              animation: 'spin 0.8s linear infinite',
            }} />
            <p style={{ fontSize: '12px', color: '#3d3d55' }}>Loading series…</p>
          </div>
        </div>
      ) : (
        /* ── Sidebar + MPR Workspace ─────────────────────────────────────── */
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
          {/* Left sidebar — image sets */}
          <div style={{
            width: '190px',
            flexShrink: 0,
            height: '100%',
            overflow: 'hidden',
            borderRight: '1px solid #1a1a26',
            display: 'flex',
            flexDirection: 'column',
          }}>
            {/* Sidebar header */}
            <div style={{
              padding: '10px 12px 8px',
              borderBottom: '1px solid #1a1a26',
              backgroundColor: '#0e0e14',
              flexShrink: 0,
            }}>
              <p style={{
                fontSize: '9px', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.08em',
                color: '#3d3d55', margin: 0,
              }}>
                Image Sets
              </p>
              <p style={{ fontSize: '8px', color: '#2a2a3a', margin: '3px 0 0' }}>
                Drag a set → Axial or Sagittal panel
              </p>
            </div>

            {/* Empty state */}
            {imageSets.length === 0 ? (
              <div style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: '10px', padding: '20px',
              }}>
                <span style={{ fontSize: '28px' }}>📁</span>
                <p style={{ fontSize: '11px', color: '#2a2a3a', textAlign: 'center' }}>
                  Upload images to create a series
                </p>
              </div>
            ) : (
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <ImageCarousel />
              </div>
            )}
          </div>

          {/* MPR Workspace (Axial + Sagittal) */}
          <div style={{ flex: 1, height: '100%', overflow: 'hidden', minWidth: 0 }}>
            <MPRWorkspace />
          </div>
        </div>
      )}
    </div>
  );
}

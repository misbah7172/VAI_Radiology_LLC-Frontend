'use client';

import { useEffect, useState } from 'react';
import { HelpCircle, PanelLeft, PanelLeftClose, PanelRight, PanelRightClose } from 'lucide-react';
import { useAnnotationStore } from '@/stores/annotationStore';
import ImageUploader from './ImageUploader';
import ImageCarousel from './ImageCarousel';
import MPRWorkspace from './mpr/MPRWorkspace';
import UserGuideModal from './UserGuideModal';
import AnnotationsSidebar from './mpr/AnnotationsSidebar';

export default function AnnotatePageClient() {
  const { fetchSets, imageSets, isLoading } = useAnnotationStore();
  const [guideOpen, setGuideOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [annSidebarOpen, setAnnSidebarOpen] = useState(false);

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

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Left sidebar (image sets) toggle */}
          <button
            id="sidebar-toggle"
            onClick={() => setSidebarOpen((v) => !v)}
            title={sidebarOpen ? 'Hide image sets sidebar' : 'Show image sets sidebar'}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '36px', height: '36px', borderRadius: '8px',
              background: sidebarOpen ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.05)',
              border: sidebarOpen ? '1px solid rgba(124,58,237,0.4)' : '1px solid #232332',
              color: sidebarOpen ? '#a78bfa' : '#63637e',
              cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            {sidebarOpen
              ? <PanelLeftClose style={{ width: '16px', height: '16px' }} />
              : <PanelLeft style={{ width: '16px', height: '16px' }} />}
          </button>

          {/* Right annotations sidebar toggle */}
          <button
            id="ann-sidebar-toggle"
            onClick={() => setAnnSidebarOpen((v) => !v)}
            title={annSidebarOpen ? 'Hide annotations panel' : 'Show annotations panel'}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '36px', height: '36px', borderRadius: '8px',
              background: annSidebarOpen ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.05)',
              border: annSidebarOpen ? '1px solid rgba(124,58,237,0.4)' : '1px solid #232332',
              color: annSidebarOpen ? '#a78bfa' : '#63637e',
              cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            {annSidebarOpen
              ? <PanelRightClose style={{ width: '16px', height: '16px' }} />
              : <PanelRight style={{ width: '16px', height: '16px' }} />}
          </button>

          <ImageUploader />

          {/* Help button */}
          <button
            id="open-user-guide"
            onClick={() => setGuideOpen(true)}
            title="Open User Guide"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '36px', height: '36px', borderRadius: '8px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid #232332',
              color: '#63637e',
              cursor: 'pointer', transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(124,58,237,0.15)'; (e.currentTarget as HTMLElement).style.color = '#a78bfa'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(124,58,237,0.4)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLElement).style.color = '#63637e'; (e.currentTarget as HTMLElement).style.borderColor = '#232332'; }}
          >
            <HelpCircle style={{ width: '16px', height: '16px' }} />
          </button>
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
            width: sidebarOpen ? '190px' : '0px',
            flexShrink: 0,
            height: '100%',
            overflow: 'hidden',
            borderRight: sidebarOpen ? '1px solid #1a1a26' : 'none',
            display: 'flex',
            flexDirection: 'column',
            transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
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
                Drag a set → any viewer panel
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

          {/* MPR Workspace */}
          <div style={{ flex: 1, height: '100%', overflow: 'hidden', minWidth: 0 }}>
            <MPRWorkspace />
          </div>

          {/* Right sidebar — annotations list */}
          <div style={{
            width: annSidebarOpen ? '190px' : '0px',
            flexShrink: 0,
            height: '100%',
            overflow: 'hidden',
            borderLeft: annSidebarOpen ? '1px solid #1a1a26' : 'none',
            transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          }}>
            <AnnotationsSidebar />
          </div>
        </div>
      )}
      {/* ── User Guide Modal ───────────────────────────────────────────────────── */}
      <UserGuideModal isOpen={guideOpen} onClose={() => setGuideOpen(false)} />
    </div>
  );
}


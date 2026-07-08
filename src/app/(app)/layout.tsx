'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Menu, Zap } from 'lucide-react';
import Sidebar from '@/components/ui/Sidebar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, fetchMe } = useAuthStore();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) { router.replace('/login'); return; }
    if (!isAuthenticated) {
      fetchMe().then(() => {
        if (!useAuthStore.getState().isAuthenticated) router.replace('/login');
      });
    }
  }, []);

  // Loading state
  if (!isAuthenticated) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#08080c',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            border: '2px solid #7c3aed',
            borderTopColor: 'transparent',
            animation: 'spin 0.8s linear infinite',
          }} />
          <p style={{ fontSize: '13px', color: '#3d3d55' }}>Loading workspace…</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      position: 'relative',
      overflow: 'hidden',
      backgroundColor: '#08080c',
    }}>
      {/* Background ambient glow */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        <div style={{
          position: 'absolute', top: '-80px', right: '-80px',
          width: '500px', height: '500px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.12), transparent 70%)',
          filter: 'blur(40px)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-50px', left: '100px',
          width: '350px', height: '350px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.07), transparent 70%)',
          filter: 'blur(40px)',
        }} />
      </div>

      {/* Mobile Top Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 20px',
        borderBottom: '1px solid #1a1a26',
        backgroundColor: '#111116',
        position: 'sticky',
        top: 0,
        zIndex: 30,
      }}
        className="md-hidden-topbar"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '30px', height: '30px', borderRadius: '8px',
            background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
          }}>
            <Zap style={{ width: '15px', height: '15px', color: 'white' }} />
          </div>
          <span style={{ fontWeight: 700, fontSize: '13px', color: '#f4f4f7' }}>VAI Radiology</span>
        </div>
        <button
          onClick={() => setIsSidebarOpen(true)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '36px', height: '36px',
            borderRadius: '9px',
            border: '1px solid #232332',
            backgroundColor: '#181822',
            color: '#a0a0b2',
            cursor: 'pointer',
          }}
          aria-label="Open navigation menu"
        >
          <Menu style={{ width: '17px', height: '17px' }} />
        </button>
      </div>

      {/* Mobile Sidebar Backdrop */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="animate-fade-in"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 40,
            backgroundColor: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
          }}
        />
      )}

      {/* Main layout: sidebar + content */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        display: 'flex',
        flex: 1,
        width: '100%',
        overflow: 'hidden',
        height: '100vh',
      }}>
        {/* Sidebar */}
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 50,
          transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          height: '100vh',
        }}
          className="sidebar-mobile"
        >
          <Sidebar onClose={() => setIsSidebarOpen(false)} />
        </div>

        {/* Desktop sidebar — always visible */}
        <div style={{
          flexShrink: 0,
          height: '100vh',
          position: 'sticky',
          top: 0,
        }}
          className="sidebar-desktop"
        >
          <Sidebar />
        </div>

        {/* Page content */}
        <main style={{
          flex: 1,
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          minWidth: 0,
        }}>
          {children}
        </main>
      </div>
    </div>
  );
}

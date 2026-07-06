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
    if (!token) {
      router.replace('/login');
      return;
    }
    if (!isAuthenticated) {
      fetchMe().then(() => {
        const stillAuthenticated = useAuthStore.getState().isAuthenticated;
        if (!stillAuthenticated) router.replace('/login');
      });
    }
  }, []);

  if (!isAuthenticated) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--bg-primary)' }}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: 'var(--accent-light)', borderTopColor: 'transparent' }}
          />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Loading workspace…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen relative overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* Background gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute rounded-full blur-3xl opacity-10"
          style={{ width: '500px', height: '500px', background: 'radial-gradient(circle, #7c3aed, transparent)', top: '-80px', right: '-80px' }} />
        <div className="absolute rounded-full blur-3xl opacity-6"
          style={{ width: '350px', height: '350px', background: 'radial-gradient(circle, #3b82f6, transparent)', bottom: '-50px', left: '100px' }} />
        <div className="absolute rounded-full blur-3xl opacity-6"
          style={{ width: '250px', height: '250px', background: 'radial-gradient(circle, #10b981, transparent)', top: '50%', right: '30%' }} />
      </div>

      {/* Mobile Top Navigation Header */}
      <div className="md:hidden flex items-center justify-between px-6 py-4 border-b border-border z-30" style={{ background: 'var(--bg-secondary)' }}>
        <div className="flex items-center gap-2.5">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-lg"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #3b82f6)' }}
          >
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>VAI Radiology</span>
        </div>
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 rounded-xl transition-colors"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Sidebar Drawer Backdrop (Mobile only) */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden animate-fade-in"
        />
      )}

      {/* Main layout container */}
      <div className="relative z-10 flex flex-col md:flex-row flex-1 w-full overflow-hidden">
        {/* Sidebar component - responsive position */}
        <Sidebar
          onClose={() => setIsSidebarOpen(false)}
          className={`fixed md:sticky top-0 bottom-0 left-0 z-50 h-screen md:h-screen md:flex ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        />

        {/* Content body container */}
        <main className="flex-1 overflow-auto flex flex-col h-full min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}

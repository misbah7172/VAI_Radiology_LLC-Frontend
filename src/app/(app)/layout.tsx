'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import Sidebar from '@/components/ui/Sidebar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, fetchMe } = useAuthStore();
  const router = useRouter();

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
    <div className="flex min-h-screen relative" style={{ background: 'var(--bg-primary)' }}>
      {/* Background gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute rounded-full blur-3xl opacity-10"
          style={{ width: '500px', height: '500px', background: 'radial-gradient(circle, #7c3aed, transparent)', top: '-80px', right: '-80px' }} />
        <div className="absolute rounded-full blur-3xl opacity-6"
          style={{ width: '350px', height: '350px', background: 'radial-gradient(circle, #3b82f6, transparent)', bottom: '-50px', left: '100px' }} />
        <div className="absolute rounded-full blur-3xl opacity-6"
          style={{ width: '250px', height: '250px', background: 'radial-gradient(circle, #10b981, transparent)', top: '50%', right: '30%' }} />
      </div>
      <div className="relative z-10 flex w-full">
        <Sidebar />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

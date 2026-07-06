'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Columns2, ImageIcon, LogOut, Zap } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';

const navItems = [
  { href: '/tasks', icon: Columns2, label: 'Tasks' },
  { href: '/annotate', icon: ImageIcon, label: 'Annotate' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    router.replace('/login');
  };

  return (
    <aside
      className="flex flex-col w-64 h-screen sticky top-0 p-4"
      style={{
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-2 mb-8 pt-2">
        <div
          className="flex items-center justify-center w-9 h-9 rounded-xl"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #3b82f6)' }}
        >
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-sm leading-tight" style={{ color: 'var(--text-primary)' }}>
            VAI Radiology
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Workspace
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider mb-3 px-3"
          style={{ color: 'var(--text-muted)' }}>
          Navigation
        </p>
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive ? 'sidebar-item-active' : 'hover:bg-white/5'
              }`}
              style={{
                color: isActive ? 'var(--accent-light)' : 'var(--text-secondary)',
              }}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User info + logout */}
      <div
        className="mt-4 p-3 rounded-xl"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold"
            style={{ background: 'var(--accent)', color: 'white' }}
          >
            {user?.email?.charAt(0).toUpperCase() ?? 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
              {user?.full_name || user?.email}
            </p>
            <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
              {user?.email}
            </p>
          </div>
        </div>
        <button
          id="logout-btn"
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-xs transition-colors duration-200"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--danger)';
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.08)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
          }}
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </button>
      </div>
    </aside>
  );
}

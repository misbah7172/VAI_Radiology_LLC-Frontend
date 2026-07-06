'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Columns2, ImageIcon, LogOut, Zap, X } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';

const navItems = [
  { href: '/tasks', icon: Columns2, label: 'Tasks' },
  { href: '/annotate', icon: ImageIcon, label: 'Annotate' },
];

interface SidebarProps {
  onClose?: () => void;
  className?: string;
}

export default function Sidebar({ onClose, className = '' }: SidebarProps) {
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
      className={`flex flex-col w-64 h-full p-5 shrink-0 transition-transform duration-300 ${className}`}
      style={{
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-subtle)',
      }}
    >
      {/* Logo & Close Button */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-lg"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)' }}
          >
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-semibold text-sm tracking-tight" style={{ color: 'var(--text-primary)' }}>
              VAI Radiology
            </p>
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              Workspace
            </p>
          </div>
        </div>

        {/* Mobile close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg md:hidden hover:bg-white/5 transition-colors cursor-pointer"
            style={{ color: 'var(--text-secondary)' }}
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        <p
          className="text-[11px] font-semibold uppercase tracking-wider mb-2.5 px-3"
          style={{ color: 'var(--text-muted)' }}
        >
          Navigation
        </p>
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => onClose?.()}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 cursor-pointer ${
                isActive ? 'sidebar-item-active' : 'hover:bg-white/[0.04]'
              }`}
              style={{
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              }}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User info + logout */}
      <div className="mt-auto">
        <div className="h-px mb-4" style={{ background: 'var(--border)' }} />
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="flex items-center justify-center w-9 h-9 rounded-lg text-xs font-bold shrink-0 border border-white/10"
              style={{ background: 'var(--accent)', color: 'white' }}
            >
              {user?.email?.charAt(0).toUpperCase() ?? 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                {user?.full_name || user?.email?.split('@')[0]}
              </p>
              <p className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>
                {user?.email}
              </p>
            </div>
          </div>
          <button
            id="logout-btn"
            onClick={handleLogout}
            className="p-1.5 rounded-lg transition-colors duration-150 hover:bg-white/5 cursor-pointer shrink-0"
            style={{ color: 'var(--text-muted)' }}
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

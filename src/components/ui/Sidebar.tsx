'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Columns2, ImageIcon, LogOut, Zap, X } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';
import { useState } from 'react';

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
  const [logoutHovered, setLogoutHovered] = useState(false);
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    router.replace('/login');
  };

  return (
    <aside
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '240px',
        height: '100%',
        padding: '20px 16px',
        flexShrink: 0,
        backgroundColor: '#111116',
        borderRight: '1px solid #1a1a26',
      }}
    >
      {/* Logo & Close Button */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '28px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            borderRadius: '9px',
            background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
            boxShadow: '0 4px 12px -4px rgba(124,58,237,0.5)',
            flexShrink: 0,
          }}>
            <Zap style={{ width: '16px', height: '16px', color: 'white' }} />
          </div>
          <div>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#f4f4f7', margin: 0, letterSpacing: '-0.01em' }}>
              VAI Radiology
            </p>
            <p style={{ fontSize: '11px', color: '#3d3d55', margin: 0, marginTop: '1px' }}>
              Workspace
            </p>
          </div>
        </div>

        {/* Mobile close button */}
        {onClose && (
          <button
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: 'transparent',
              color: '#63637e',
              cursor: 'pointer',
            }}
            aria-label="Close sidebar"
          >
            <X style={{ width: '15px', height: '15px' }} />
          </button>
        )}
      </div>

      {/* Nav label */}
      <p style={{
        fontSize: '10px',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: '#3d3d55',
        marginBottom: '6px',
        paddingLeft: '8px',
      }}>
        Navigation
      </p>

      {/* Navigation */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname.startsWith(href);
          const isHov = hoveredNav === href;

          return (
            <Link
              key={href}
              href={href}
              onClick={() => onClose?.()}
              onMouseEnter={() => setHoveredNav(href)}
              onMouseLeave={() => setHoveredNav(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 10px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: isActive ? 500 : 400,
                textDecoration: 'none',
                color: isActive ? '#f4f4f7' : isHov ? '#c4c4d8' : '#8888a8',
                backgroundColor: isActive
                  ? 'rgba(124,58,237,0.1)'
                  : isHov
                  ? 'rgba(255,255,255,0.04)'
                  : 'transparent',
                boxShadow: isActive ? 'inset 2px 0 0 #7c3aed' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon style={{ width: '15px', height: '15px', flexShrink: 0 }} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div style={{ marginTop: 'auto' }}>
        <div style={{ height: '1px', backgroundColor: '#1a1a26', marginBottom: '14px' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              backgroundColor: '#7c3aed',
              color: 'white',
              fontSize: '13px',
              fontWeight: 700,
              flexShrink: 0,
              border: '1px solid rgba(255,255,255,0.1)',
            }}>
              {user?.email?.charAt(0).toUpperCase() ?? 'U'}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{
                fontSize: '12px',
                fontWeight: 500,
                color: '#d4d4e8',
                margin: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {user?.full_name || user?.email?.split('@')[0]}
              </p>
              <p style={{
                fontSize: '11px',
                color: '#3d3d55',
                margin: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {user?.email}
              </p>
            </div>
          </div>

          <button
            id="logout-btn"
            onClick={handleLogout}
            onMouseEnter={() => setLogoutHovered(true)}
            onMouseLeave={() => setLogoutHovered(false)}
            title="Sign out"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '30px',
              height: '30px',
              borderRadius: '7px',
              border: 'none',
              backgroundColor: logoutHovered ? 'rgba(255,255,255,0.06)' : 'transparent',
              color: logoutHovered ? '#c4c4d8' : '#4a4a6a',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'all 0.15s ease',
            }}
          >
            <LogOut style={{ width: '14px', height: '14px' }} />
          </button>
        </div>
      </div>
    </aside>
  );
}

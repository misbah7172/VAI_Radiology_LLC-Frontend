import type { Metadata } from 'next';
import LoginForm from '@/components/auth/LoginForm';

export const metadata: Metadata = {
  title: 'Login — VAI Radiology',
  description: 'Sign in to your VAI Radiology account',
};

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'var(--bg-primary)' }}>
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute rounded-full blur-3xl opacity-20 animate-pulse"
          style={{
            width: '600px',
            height: '600px',
            background: 'radial-gradient(circle, #7c3aed, transparent)',
            top: '-100px',
            right: '-100px',
          }}
        />
        <div
          className="absolute rounded-full blur-3xl opacity-10"
          style={{
            width: '400px',
            height: '400px',
            background: 'radial-gradient(circle, #3b82f6, transparent)',
            bottom: '-50px',
            left: '-50px',
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md px-4">
        <LoginForm />
      </div>
    </main>
  );
}

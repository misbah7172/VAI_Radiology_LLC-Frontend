'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/authStore';

export default function LoginForm() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    if (!email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Enter a valid email';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await login(email, password);
      toast.success('Welcome back! 🎉');
      router.push('/tasks');
    } catch (err: any) {
      const msg =
        err?.response?.data?.non_field_errors?.[0] ||
        err?.response?.data?.detail ||
        'Invalid credentials. Please try again.';
      toast.error(msg);
    }
  };

  return (
    <div className="animate-fade-in-up">
      {/* Logo/Brand */}
      <div className="text-center mb-10">
        <div
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 animate-pulse-glow"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #3b82f6)' }}
        >
          <Zap className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          VAI Radiology
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
          Sign in to your workspace
        </p>
      </div>

      {/* Card */}
      <div className="glass-card p-8">
        <form onSubmit={handleSubmit} noValidate>
          {/* Email */}
          <div className="mb-5">
            <label
              htmlFor="email"
              className="block text-sm font-medium mb-2"
              style={{ color: 'var(--text-secondary)' }}
            >
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              placeholder="demo@vai.com"
              className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-200"
              style={{
                background: 'var(--bg-primary)',
                border: `1px solid ${errors.email ? 'var(--danger)' : 'var(--border)'}`,
                color: 'var(--text-primary)',
                outline: 'none',
              }}
              onFocus={(e) => {
                if (!errors.email)
                  e.target.style.borderColor = 'var(--accent-light)';
              }}
              onBlur={(e) => {
                if (!errors.email) e.target.style.borderColor = 'var(--border)';
              }}
            />
            {errors.email && (
              <p className="mt-1.5 text-xs" style={{ color: 'var(--danger)' }}>
                {errors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="mb-7">
            <label
              htmlFor="password"
              className="block text-sm font-medium mb-2"
              style={{ color: 'var(--text-secondary)' }}
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                }}
                placeholder="••••••••"
                className="w-full px-4 py-3 pr-12 rounded-xl text-sm transition-all duration-200"
                style={{
                  background: 'var(--bg-primary)',
                  border: `1px solid ${errors.password ? 'var(--danger)' : 'var(--border)'}`,
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
                onFocus={(e) => {
                  if (!errors.password)
                    e.target.style.borderColor = 'var(--accent-light)';
                }}
                onBlur={(e) => {
                  if (!errors.password) e.target.style.borderColor = 'var(--border)';
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-colors"
                style={{ color: 'var(--text-muted)' }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1.5 text-xs" style={{ color: 'var(--danger)' }}>
                {errors.password}
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            id="login-submit"
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
              color: 'white',
              boxShadow: '0 4px 20px rgba(124, 58, 237, 0.4)',
            }}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing in…
              </>
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        {/* Demo credentials hint */}
        <div
          className="mt-6 p-3.5 rounded-xl text-center text-xs"
          style={{
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-muted)',
          }}
        >
          Demo: <span style={{ color: 'var(--accent-light)' }}>demo@vai.com</span> /{' '}
          <span style={{ color: 'var(--accent-light)' }}>demo1234</span>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, Zap, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/authStore';

export default function LoginForm() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);

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
      toast.success('Welcome back!');
      router.push('/tasks');
    } catch (err) {
      const e = err as { response?: { data?: { non_field_errors?: string[]; detail?: string } } };
      const msg =
        e?.response?.data?.non_field_errors?.[0] ||
        e?.response?.data?.detail ||
        'Invalid credentials. Please try again.';
      toast.error(msg);
    }
  };

  const inputStyle = (field: string, hasError: boolean): React.CSSProperties => ({
    display: 'block',
    width: '100%',
    padding: '11px 14px',
    fontSize: '14px',
    fontFamily: 'inherit',
    color: '#f4f4f7',
    backgroundColor: '#111116',
    border: `1px solid ${hasError ? '#ef4444' : focusedField === field ? '#a78bfa' : '#232332'}`,
    borderRadius: '10px',
    outline: 'none',
    boxShadow: focusedField === field && !hasError ? '0 0 0 3px rgba(124,58,237,0.12)' : 'none',
    transition: 'border-color 0.18s ease, box-shadow 0.18s ease',
    WebkitAppearance: 'none',
  });

  return (
    <div className="animate-fade-in-up" style={{ width: '100%', maxWidth: '380px', margin: '0 auto' }}>

      {/* Brand Header */}
      <div style={{ textAlign: 'center', marginBottom: '36px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
          marginBottom: '20px',
          boxShadow: '0 8px 32px -8px rgba(124,58,237,0.5)',
        }}>
          <Zap style={{ width: '28px', height: '28px', color: 'white' }} />
        </div>
        <h1 style={{
          fontSize: '24px',
          fontWeight: 700,
          letterSpacing: '-0.025em',
          color: '#f4f4f7',
          marginBottom: '6px',
        }}>
          VAI Radiology
        </h1>
        <p style={{ fontSize: '14px', color: '#63637e' }}>
          Sign in to your workspace
        </p>
      </div>

      {/* Card */}
      <div style={{
        background: '#181822',
        border: '1px solid #232332',
        borderRadius: '20px',
        padding: '32px',
        boxShadow: '0 24px 64px -12px rgba(0,0,0,0.85), 0 1px 0 rgba(255,255,255,0.04) inset',
      }}>
        <form onSubmit={handleSubmit} noValidate>

          {/* Email */}
          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="email" style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#63637e',
              marginBottom: '8px',
            }}>
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
              }}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              placeholder="you@example.com"
              style={inputStyle('email', !!errors.email)}
            />
            {errors.email && (
              <p style={{ marginTop: '6px', fontSize: '11px', color: '#ef4444', fontWeight: 500 }}>
                {errors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div style={{ marginBottom: '28px' }}>
            <label htmlFor="password" style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#63637e',
              marginBottom: '8px',
            }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((p) => ({ ...p, password: undefined }));
                }}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                placeholder="••••••••"
                style={{ ...inputStyle('password', !!errors.password), paddingRight: '44px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  padding: '4px',
                  cursor: 'pointer',
                  color: '#63637e',
                  display: 'flex',
                  alignItems: 'center',
                }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff style={{ width: '16px', height: '16px' }} /> : <Eye style={{ width: '16px', height: '16px' }} />}
              </button>
            </div>
            {errors.password && (
              <p style={{ marginTop: '6px', fontSize: '11px', color: '#ef4444', fontWeight: 500 }}>
                {errors.password}
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            id="login-submit"
            type="submit"
            disabled={isLoading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%',
              padding: '13px 24px',
              fontSize: '14px',
              fontWeight: 600,
              fontFamily: 'inherit',
              color: '#ffffff',
              background: isLoading
                ? 'rgba(124,58,237,0.6)'
                : 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
              border: 'none',
              borderRadius: '10px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 20px -4px rgba(124,58,237,0.5)',
              transition: 'all 0.2s ease',
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {isLoading ? (
              <>
                <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                Signing in…
              </>
            ) : (
              <>
                Sign in
                <ArrowRight style={{ width: '16px', height: '16px' }} />
              </>
            )}
          </button>
        </form>

        {/* Demo hint */}
        <div style={{
          marginTop: '20px',
          padding: '12px 16px',
          borderRadius: '10px',
          background: 'rgba(124,58,237,0.06)',
          border: '1px solid rgba(124,58,237,0.14)',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '11px', color: '#63637e', marginBottom: '2px' }}>Demo credentials</p>
          <p style={{ fontSize: '12px', fontFamily: 'monospace', color: '#a78bfa', fontWeight: 500 }}>
            demo@vai.com · demo1234
          </p>
        </div>
      </div>

      {/* Footer */}
      <p style={{
        textAlign: 'center',
        fontSize: '11px',
        color: '#3d3d55',
        marginTop: '24px',
      }}>
        VAI Radiology LLC · AI-Assisted Diagnostic Platform
      </p>
    </div>
  );
}

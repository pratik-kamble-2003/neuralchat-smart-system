import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import useThemeStore from '../store/themeStore';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { login } = useAuthStore();
  const { theme, toggle } = useThemeStore();
  const navigate = useNavigate();

  const validate = () => {
    const e = {};
    if (!form.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (!form.password) e.password = 'Password is required';
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setIsLoading(true);
    try {
      await login(form);
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      toast.error(msg);
      if (msg.toLowerCase().includes('credentials')) {
        setErrors({ password: 'Invalid email or password' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 transition-theme"
      style={{ background: 'var(--color-surface)' }}>
      {/* Theme toggle */}
      <button onClick={toggle} className="fixed top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center transition-colors"
        style={{ background: 'var(--color-surface-overlay)', color: 'var(--color-text-secondary)' }}>
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>

      <div className="w-full max-w-sm animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{ background: 'var(--color-accent)', color: '#fff' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>NeuralChat</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>Sign in to continue</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-6 border" style={{ background: 'var(--color-surface-raised)', borderColor: 'var(--color-border)' }}>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                Email
              </label>
              <input
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all border"
                style={{
                  background: 'var(--color-surface)',
                  borderColor: errors.email ? '#ef4444' : 'var(--color-border)',
                  color: 'var(--color-text-primary)',
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--color-accent)'}
                onBlur={(e) => e.target.style.borderColor = errors.email ? '#ef4444' : 'var(--color-border)'}
              />
              {errors.email && <p className="text-xs mt-1 text-red-500">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all border pr-10"
                  style={{
                    background: 'var(--color-surface)',
                    borderColor: errors.password ? '#ef4444' : 'var(--color-border)',
                    color: 'var(--color-text-primary)',
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--color-accent)'}
                  onBlur={(e) => e.target.style.borderColor = errors.password ? '#ef4444' : 'var(--color-border)'}
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
                  style={{ color: 'var(--color-text-muted)' }}>
                  {showPass ? 'Hide' : 'Show'}
                </button>
              </div>
              {errors.password && <p className="text-xs mt-1 text-red-500">{errors.password}</p>}
            </div>

            {/* Submit */}
            <button type="submit" disabled={isLoading}
              className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              style={{ background: 'var(--color-accent)', color: '#fff' }}
              onMouseEnter={(e) => { if (!isLoading) e.target.style.background = 'var(--color-accent-hover)'; }}
              onMouseLeave={(e) => e.target.style.background = 'var(--color-accent)'}>
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30 70" />
                  </svg>
                  Signing in…
                </span>
              ) : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm mt-5" style={{ color: 'var(--color-text-muted)' }}>
          Don't have an account?{' '}
          <Link to="/register" className="font-medium hover:underline" style={{ color: 'var(--color-accent)' }}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

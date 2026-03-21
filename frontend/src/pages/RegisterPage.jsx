import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import useThemeStore from '../store/themeStore';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { register } = useAuthStore();
  const { theme, toggle } = useThemeStore();
  const navigate = useNavigate();

  const validate = () => {
    const e = {};
    if (!form.name || form.name.trim().length < 2) e.name = 'Name must be at least 2 characters';
    if (!form.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email address';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 8) e.password = 'Minimum 8 characters';
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password))
      e.password = 'Must include uppercase, lowercase & number';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match';
    return e;
  };

  const strength = () => {
    const p = form.password;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  };

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColor = ['', '#ef4444', '#f59e0b', '#3b82f6', '#22c55e'];
  const s = strength();

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setIsLoading(true);
    try {
      await register({ name: form.name.trim(), email: form.email, password: form.password });
      toast.success('Account created!');
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      toast.error(msg);
      if (msg.toLowerCase().includes('email')) setErrors({ email: 'Email already registered' });
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle = (field) => ({
    background: 'var(--color-surface)',
    borderColor: errors[field] ? '#ef4444' : 'var(--color-border)',
    color: 'var(--color-text-primary)',
  });

  const inputClass = 'w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all border';
  const handleFocus = (e) => (e.target.style.borderColor = 'var(--color-accent)');
  const handleBlur = (field) => (e) =>
    (e.target.style.borderColor = errors[field] ? '#ef4444' : 'var(--color-border)');

  return (
    <div className="min-h-screen flex items-center justify-center p-4 transition-theme"
      style={{ background: 'var(--color-surface)' }}>
      <button onClick={toggle}
        className="fixed top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center transition-colors"
        style={{ background: 'var(--color-surface-overlay)', color: 'var(--color-text-secondary)' }}>
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>

      <div className="w-full max-w-sm animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{ background: 'var(--color-accent)', color: '#fff' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Create account</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>Start chatting with AI</p>
        </div>

        <div className="rounded-2xl p-6 border"
          style={{ background: 'var(--color-surface-raised)', borderColor: 'var(--color-border)' }}>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Name */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Name</label>
              <input type="text" autoComplete="name" placeholder="Your name"
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputClass} style={inputStyle('name')}
                onFocus={handleFocus} onBlur={handleBlur('name')} />
              {errors.name && <p className="text-xs mt-1 text-red-500">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Email</label>
              <input type="email" autoComplete="email" placeholder="you@example.com"
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={inputClass} style={inputStyle('email')}
                onFocus={handleFocus} onBlur={handleBlur('email')} />
              {errors.email && <p className="text-xs mt-1 text-red-500">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} autoComplete="new-password" placeholder="Min 8 chars"
                  value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className={`${inputClass} pr-10`} style={inputStyle('password')}
                  onFocus={handleFocus} onBlur={handleBlur('password')} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
                  style={{ color: 'var(--color-text-muted)' }}>
                  {showPass ? 'Hide' : 'Show'}
                </button>
              </div>
              {form.password && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-1 flex-1 rounded-full transition-all"
                        style={{ background: i <= s ? strengthColor[s] : 'var(--color-border)' }} />
                    ))}
                  </div>
                  <p className="text-xs mt-1" style={{ color: s >= 3 ? '#22c55e' : 'var(--color-text-muted)' }}>
                    {strengthLabel[s]}
                  </p>
                </div>
              )}
              {errors.password && <p className="text-xs mt-1 text-red-500">{errors.password}</p>}
            </div>

            {/* Confirm */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Confirm password</label>
              <input type={showPass ? 'text' : 'password'} autoComplete="new-password" placeholder="Re-enter password"
                value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                className={inputClass} style={inputStyle('confirm')}
                onFocus={handleFocus} onBlur={handleBlur('confirm')} />
              {errors.confirm && <p className="text-xs mt-1 text-red-500">{errors.confirm}</p>}
            </div>

            <button type="submit" disabled={isLoading}
              className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-60 mt-2"
              style={{ background: 'var(--color-accent)', color: '#fff' }}
              onMouseEnter={(e) => { if (!isLoading) e.target.style.background = 'var(--color-accent-hover)'; }}
              onMouseLeave={(e) => (e.target.style.background = 'var(--color-accent)')}>
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30 70" />
                  </svg>
                  Creating account…
                </span>
              ) : 'Create account'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm mt-5" style={{ color: 'var(--color-text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" className="font-medium hover:underline" style={{ color: 'var(--color-accent)' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}

import { Film, Lock, Eye, EyeOff, Clapperboard } from 'lucide-react';
import { useState } from 'react';

export function LoginScreen({ form, error, onChange, onSubmit, isLoading }) {
  const [showPass, setShowPass] = useState(false);

  return (
    <div className="login-shell">
      <div className="login-panel">
        {/* Left intro */}
        <div className="glass-card login-intro">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="sidebar__logo-icon">
              <Film size={20} />
            </div>
            <p className="login-intro__eyebrow">CineBook — Shared Cinema Admin</p>
          </div>

          <h1 className="login-intro__title">
            The command centre for your cinema operations.
          </h1>
          <p className="login-intro__body">
            Manage today's movies, services, users, and booking activity from one shared
            Supabase database — synced in real-time with the mobile app.
          </p>

          <div className="credential-box">
            <p>Admin account requirements</p>
            <strong>Supabase Auth user</strong>
            <span>Matching app_users row with role = admin &amp; status = active</span>
          </div>

          <ul className="feature-list">
            <li>Movies &amp; showtimes from the shared database</li>
            <li>Services, users, and bookings — live data</li>
            <li>Updates written back to Supabase instantly</li>
            <li>Secure role-based admin access only</li>
          </ul>
        </div>

        {/* Right login form */}
        <div className="glass-card glass-card--gold login-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.25rem' }}>
            <Lock size={16} style={{ color: 'var(--gold)' }} />
            <h2 className="login-card__title">Admin Sign In</h2>
          </div>

          <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="field-group">
              <label htmlFor="admin-email">Admin Email</label>
              <input
                id="admin-email"
                type="email"
                value={form.email}
                placeholder="admin@cinebook.com"
                onChange={e => onChange(cur => ({ ...cur, email: e.target.value }))}
              />
            </div>

            <div className="field-group">
              <label htmlFor="admin-password">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="admin-password"
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  placeholder="••••••••"
                  onChange={e => onChange(cur => ({ ...cur, password: e.target.value }))}
                  style={{ paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  style={{
                    position: 'absolute', right: '0.75rem', top: '50%',
                    transform: 'translateY(-50%)', background: 'none',
                    border: 'none', color: 'var(--text-dim)', padding: 0
                  }}
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="error-text">
                <Lock size={13} /> {error}
              </p>
            )}

            <button
              type="submit"
              className="btn btn-gold"
              disabled={isLoading}
              style={{ width: '100%', justifyContent: 'center', minHeight: '44px' }}
            >
              <Clapperboard size={16} />
              {isLoading ? 'Connecting…' : 'Sign In to Dashboard'}
            </button>
          </form>

          <p className="login-card__help">
            The email must exist in Supabase Auth and also in app_users with admin access.
          </p>
        </div>
      </div>
    </div>
  );
}

export function ConfigScreen({ message }) {
  return (
    <div className="login-shell">
      <div className="glass-card glass-card--gold" style={{ maxWidth: 520, padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gold)' }}>
          Supabase Setup Needed
        </p>
        <h1 style={{ fontSize: '1.2rem', color: 'var(--text)' }}>Missing environment variables</h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.65 }}>{message}</p>
        <div className="credential-box">
          <p>Required in .env</p>
          <strong>VITE_SUPABASE_URL</strong>
          <span>VITE_SUPABASE_PUBLISHABLE_KEY</span>
        </div>
      </div>
    </div>
  );
}

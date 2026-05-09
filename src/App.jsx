import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createMovieSchedule, createService, fetchDashboardData,
  getCurrentSession, loadAdminProfile, signInAdmin, signOutAdmin,
  subscribeToAuthChanges, updateMovieStatus, updateServiceStatus,
  deleteMovieSchedule,
} from './supabaseAdminApi';
import { getSupabaseConfigError, hasSupabaseConfig } from './supabaseClient';

import { Sidebar }                              from './components/Sidebar.jsx';
import { PageState, SectionPanel, EmptyState }  from './components/UI.jsx';
import { LoginScreen, ConfigScreen }             from './components/LoginScreen.jsx';
import {
  MoviesTable, ServicesTable, UsersTable, BookingsTable,
  MovieForm, ServiceForm, formatCurrency,
} from './components/DataComponents.jsx';
import { TMDBSearch } from './components/TMDBSearch.jsx';

import {
  Film, Ticket, Users, TrendingUp, RefreshCw,
  Calendar, Database, CheckCircle2, AlertCircle,
} from 'lucide-react';

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const emptyMovieForm = {
  title: '', genre: '', language: '', theaterName: '', city: '',
  hall: '', format: '2D', showTime: '', ticketPrice: '', status: 'now_showing',
};
const emptyServiceForm = { name: '', category: '', branch: '', price: '', status: 'active' };

function getErrorMessage(e) {
  if (!e) return 'Unexpected error.';
  if (typeof e === 'string') return e;
  return e.message || 'Unexpected error.';
}

function getTodayLabel() {
  return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date());
}

function getViewTitle(v) {
  const map = { dashboard: 'Dashboard', movies: 'Today Movies', services: 'Services', users: 'App Users', bookings: 'Bookings', database: 'Database' };
  return map[v] || v;
}

// ── APP ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [session, setSession]           = useState(null);
  const [adminProfile, setAdminProfile] = useState(null);
  const [movies, setMovies]             = useState([]);
  const [services, setServices]         = useState([]);
  const [users, setUsers]               = useState([]);
  const [bookings, setBookings]         = useState([]);
  const [activeView, setActiveView]     = useState('dashboard');
  const [notice, setNotice]             = useState(null); // { type, msg }
  const [loginForm, setLoginForm]       = useState({ email: '', password: '' });
  const [loginError, setLoginError]     = useState('');
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isSyncing, setIsSyncing]       = useState(false);
  const [movieForm, setMovieForm]       = useState(emptyMovieForm);
  const [serviceForm, setServiceForm]   = useState(emptyServiceForm);

  // Auto-clear notice
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(t);
  }, [notice]);

  // Restore session
  useEffect(() => {
    if (!hasSupabaseConfig) { setIsBootstrapping(false); return; }
    let ignore = false;
    async function restore() {
      try {
        const s = await getCurrentSession();
        if (!ignore) setSession(s);
      } catch (e) {
        if (!ignore) setNotice({ type: 'error', msg: getErrorMessage(e) });
      } finally {
        if (!ignore) setIsBootstrapping(false);
      }
    }
    restore();
    const sub = subscribeToAuthChanges((_, s) => setSession(s));
    return () => { ignore = true; sub.unsubscribe(); };
  }, []);

  // Load dashboard data
  const refreshDashboard = useCallback(async () => {
    setIsSyncing(true);
    try {
      const d = await fetchDashboardData();
      setMovies(d.movies); setServices(d.services);
      setUsers(d.users);   setBookings(d.bookings);
    } catch (e) {
      setNotice({ type: 'error', msg: getErrorMessage(e) });
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Hydrate admin profile on login
  useEffect(() => {
    if (!session?.user) {
      setAdminProfile(null); setMovies([]); setServices([]); setUsers([]); setBookings([]);
      return;
    }
    let ignore = false;
    async function hydrate() {
      setIsBootstrapping(true); setLoginError('');
      try {
        const profile = await loadAdminProfile(session.user);
        if (!ignore) { setAdminProfile(profile); setNotice({ type: 'success', msg: 'Connected to the Supabase admin database.' }); }
      } catch (e) {
        if (!ignore) { await signOutAdmin().catch(() => {}); setLoginError(getErrorMessage(e)); }
      } finally {
        if (!ignore) setIsBootstrapping(false);
      }
    }
    hydrate();
    return () => { ignore = true; };
  }, [session?.user?.id]);

  useEffect(() => {
    if (adminProfile?.id) refreshDashboard();
  }, [adminProfile?.id, refreshDashboard]);

  // Metrics
  const metrics = useMemo(() => {
    const liveMovies    = movies.filter(m => ['now_showing', 'featured'].includes(m.status)).length;
    const activeServices = services.filter(s => s.status === 'active').length;
    const activeUsers   = users.filter(u => u.status === 'active').length;
    const revenue       = bookings.filter(b => b.paymentStatus === 'paid').reduce((t, b) => t + b.total, 0);
    return [
      { label: 'Live Shows',      value: `${liveMovies}`,         hint: "Today's active showtimes",  icon: Film },
      { label: 'Total Bookings',  value: `${bookings.length}`,    hint: 'All booking records',       icon: Ticket },
      { label: 'Mobile Users',    value: `${activeUsers}`,        hint: 'Active customer accounts',  icon: Users },
      { label: 'Paid Revenue',    value: formatCurrency(revenue), hint: 'Confirmed paid bookings',   icon: TrendingUp },
    ];
  }, [movies, services, users, bookings]);

  const topMovies = useMemo(() => [...movies].sort((a, b) => b.ticketsSold - a.ticketsSold).slice(0, 5), [movies]);

  // Handlers
  async function handleLogin(e) {
    e.preventDefault(); setLoginError('');
    try { await signInAdmin(loginForm); } catch (err) { setLoginError(getErrorMessage(err)); }
  }

  async function handleLogout() {
    try { await signOutAdmin(); setActiveView('dashboard'); setNotice({ type: 'success', msg: 'Signed out.' }); }
    catch (e) { setNotice({ type: 'error', msg: getErrorMessage(e) }); }
  }

  async function handleMovieSubmit(e) {
    e.preventDefault();
    const p = { ...movieForm, title: movieForm.title.trim(), ticketPrice: Number(movieForm.ticketPrice) };
    if (!p.title || !p.genre || !p.language || !p.theaterName || !p.city || !p.hall || !p.showTime || !p.ticketPrice) {
      setNotice({ type: 'error', msg: 'Fill in all movie fields before saving.' }); return;
    }
    try {
      await createMovieSchedule(p, adminProfile.id);
      setMovieForm(emptyMovieForm); await refreshDashboard();
      setNotice({ type: 'success', msg: `Movie "${p.title}" saved to Supabase.` });
    } catch (err) { setNotice({ type: 'error', msg: getErrorMessage(err) }); }
  }

  async function handleServiceSubmit(e) {
    e.preventDefault();
    const p = { ...serviceForm, price: Number(serviceForm.price) };
    if (!p.name || !p.category || !p.branch || !p.price) {
      setNotice({ type: 'error', msg: 'Fill in all service fields.' }); return;
    }
    try {
      await createService(p, adminProfile.id);
      setServiceForm(emptyServiceForm); await refreshDashboard();
      setNotice({ type: 'success', msg: `Service "${p.name}" saved.` });
    } catch (err) { setNotice({ type: 'error', msg: getErrorMessage(err) }); }
  }

  async function handleMovieStatusChange(id, status) {
    try { await updateMovieStatus(id, status, adminProfile.id); await refreshDashboard(); setNotice({ type: 'success', msg: 'Movie status updated.' }); }
    catch (e) { setNotice({ type: 'error', msg: getErrorMessage(e) }); }
  }

  async function handleServiceStatusChange(id, status) {
    try { await updateServiceStatus(id, status, adminProfile.id); await refreshDashboard(); setNotice({ type: 'success', msg: 'Service status updated.' }); }
    catch (e) { setNotice({ type: 'error', msg: getErrorMessage(e) }); }
  }

  async function handleDeleteMovie(showtimeId, movieId, title) {
    try {
      await deleteMovieSchedule(showtimeId, movieId, title, adminProfile.id);
      await refreshDashboard();
      setNotice({ type: 'success', msg: `"${title}" deleted successfully.` });
    } catch (e) {
      setNotice({ type: 'error', msg: getErrorMessage(e) });
    }
  }

  // ── RENDER GUARDS ──────────────────────────────────────────────────────────
  if (!hasSupabaseConfig)     return <ConfigScreen message={getSupabaseConfigError()} />;
  if (!session)               return <LoginScreen form={loginForm} error={loginError} onChange={setLoginForm} onSubmit={handleLogin} isLoading={isBootstrapping} />;
  if (isBootstrapping && !adminProfile) return <PageState title="Connecting to Supabase" body="Loading the admin account…" />;

  // ── MAIN LAYOUT ────────────────────────────────────────────────────────────
  return (
    <div className="admin-app">
      <Sidebar activeView={activeView} onNavigate={setActiveView} adminProfile={adminProfile} onLogout={handleLogout} />

      <div className="main-shell">
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar__left">
            <p className="topbar__eyebrow">Supabase Admin Workspace</p>
            <h2 className="topbar__title">{getViewTitle(activeView)}</h2>
          </div>
          <div className="topbar__actions">
            <div className="topbar__date">
              <Calendar size={13} />
              <span>Today</span>
              <strong>{getTodayLabel()}</strong>
            </div>
            <button type="button" className="btn btn-ghost" onClick={refreshDashboard} disabled={isSyncing}>
              <RefreshCw size={14} style={{ animation: isSyncing ? 'spin 0.8s linear infinite' : 'none' }} />
              {isSyncing ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        </header>

        {/* Notice */}
        {notice && (
          <div style={{ padding: '0 1.75rem' }}>
            <div className={`notice-bar notice-bar--${notice.type}`}>
              {notice.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
              {notice.msg}
            </div>
          </div>
        )}

        {/* Views */}
        <main className="page-content">
          {activeView === 'dashboard' && (
            <DashboardView metrics={metrics} movies={movies} services={services} users={users} bookings={bookings} topMovies={topMovies} />
          )}
          {activeView === 'movies' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* TMDB Search */}
              <SectionPanel
                title="Search Movie from TMDB"
                description="Search a movie to auto-fill the form below — powered by The Movie Database."
              >
                <TMDBSearch
                  onSelect={({ title, genre, language }) =>
                    setMovieForm(cur => ({
                      ...cur,
                      ...(title    ? { title }    : {}),
                      ...(genre    ? { genre }    : {}),
                      ...(language ? { language } : {}),
                    }))
                  }
                />
              </SectionPanel>

              {/* Form + Schedule */}
              <div className="content-grid--wide" style={{ display: 'grid', gap: '1.25rem' }}>
                <SectionPanel title="Add Movie Schedule" description="Fill in the remaining details and save to Supabase.">
                  <MovieForm form={movieForm} onChange={setMovieForm} onSubmit={handleMovieSubmit} />
                </SectionPanel>
                <SectionPanel title="Today's Schedule" description="Live showtime data from the movies + showtimes tables.">
                  <MoviesTable movies={movies} onStatusChange={handleMovieStatusChange} onDelete={handleDeleteMovie} />
                </SectionPanel>
              </div>
            </div>
          )}
          {activeView === 'services' && (
            <div className="content-grid--wide" style={{ display: 'grid', gap: '1.25rem' }}>
              <SectionPanel title="Create Service" description="Add cinema services to the shared services table.">
                <ServiceForm form={serviceForm} onChange={setServiceForm} onSubmit={handleServiceSubmit} />
              </SectionPanel>
              <SectionPanel title="Current Services" description="Live data from the services table in Supabase.">
                <ServicesTable services={services} onStatusChange={handleServiceStatusChange} />
              </SectionPanel>
            </div>
          )}
          {activeView === 'users' && (
            <SectionPanel title="Mobile App Users" description="Customer accounts from the app_users table with booking counts.">
              <UsersTable users={users} />
            </SectionPanel>
          )}
          {activeView === 'bookings' && (
            <SectionPanel title="All Bookings" description="Live booking and seat data from Supabase.">
              <BookingsTable bookings={bookings} />
            </SectionPanel>
          )}
          {activeView === 'database' && <DatabaseView />}
        </main>
      </div>
    </div>
  );
}

// ── DASHBOARD VIEW ─────────────────────────────────────────────────────────────
function DashboardView({ metrics, movies, services, users, bookings, topMovies }) {
  return (
    <>
      {/* Metric cards */}
      <section className="metric-grid">
        {metrics.map(m => (
          <article key={m.label} className="glass-card metric-card">
            <div className="metric-card__header">
              <p className="metric-card__label">{m.label}</p>
              <div className="metric-card__icon"><m.icon size={15} /></div>
            </div>
            <p className="metric-card__value">{m.value}</p>
            <p className="metric-card__hint">{m.hint}</p>
          </article>
        ))}
      </section>

      {/* Top movies + system counts */}
      <div className="content-grid">
        <SectionPanel title="Top Movies Today" description="Ranked by tickets sold from today's Supabase showtimes.">
          {topMovies.length ? (
            <div className="list-stack">
              {topMovies.map((m, i) => (
                <div key={m.id} className="row-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--gold)', minWidth: 16 }}>#{i + 1}</span>
                    <div>
                      <strong style={{ fontSize: '0.875rem' }}>{m.title}</strong>
                      <p className="row-card__sub">{m.branch} · {m.hall} · {m.showTime}</p>
                    </div>
                  </div>
                  <div className="row-card__meta">
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{m.ticketsSold} sold</span>
                    <span className={`badge badge--${m.status}`}>{m.status.replace('_', ' ')}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={Film} message="No showtimes found for today." />
          )}
        </SectionPanel>

        <SectionPanel title="System Counts" description="Live row counts from all Supabase tables.">
          <div className="mini-stats">
            {[
              { label: 'Showtimes',  val: movies.length },
              { label: 'Services',   val: services.length },
              { label: 'Customers',  val: users.length },
              { label: 'Bookings',   val: bookings.length },
            ].map(s => (
              <div key={s.label} className="mini-stat">
                <strong>{s.val}</strong>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </SectionPanel>
      </div>

      {/* Recent bookings */}
      <SectionPanel title="Recent Bookings" description="Latest booking activity from the shared database.">
        <BookingsTable bookings={bookings.slice(0, 5)} compact />
      </SectionPanel>
    </>
  );
}

// ── DATABASE VIEW ──────────────────────────────────────────────────────────────
function DatabaseView() {
  const tables = [
    { name: 'movies',         desc: 'Movie catalogue — title, genre, language, status' },
    { name: 'showtimes',      desc: 'Daily show schedule linked to movies and screens' },
    { name: 'theaters',       desc: 'Theater branches across cities' },
    { name: 'screens',        desc: 'Individual halls within each theater' },
    { name: 'app_users',      desc: 'Mobile app customer accounts' },
    { name: 'bookings',       desc: 'Customer booking records' },
    { name: 'booking_seats',  desc: 'Individual seat labels per booking' },
    { name: 'services',       desc: 'Cinema service offerings (food, packages, etc.)' },
    { name: 'admin_audit_logs', desc: 'Admin action history' },
  ];
  return (
    <SectionPanel title="Database Schema" description="All tables used by the CineBook admin and mobile app via Supabase." icon={Database}>
      <div className="list-stack">
        {tables.map(t => (
          <div key={t.name} className="row-card">
            <div>
              <strong style={{ fontSize: '0.875rem', fontFamily: 'monospace', color: 'var(--gold)' }}>{t.name}</strong>
              <p className="row-card__sub">{t.desc}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="db-info" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--line)' }}>
        <p>Schema file: <code>shared-database/schema.sql</code></p>
        <p>The mobile app and admin website share the same Supabase project. All reads and writes go through the same tables.</p>
      </div>
    </SectionPanel>
  );
}

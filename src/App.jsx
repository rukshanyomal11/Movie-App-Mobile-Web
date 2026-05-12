import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Film, Ticket, Users, TrendingUp, RefreshCw,
  Calendar, Database, CheckCircle2, AlertCircle,
} from 'lucide-react';

import {
  fetchDashboardData, createMovieSchedule, updateMovieSchedule, deleteMovieSchedule,
  updateMovieStatus, createService, updateServiceStatus,
  getCurrentSession, loadAdminProfile, signInAdmin, signOutAdmin,
  subscribeToAuthChanges
} from './supabaseAdminApi';
import { ConfirmModal } from './components/DataComponents.jsx';
import { getSupabaseConfigError, hasSupabaseConfig } from './supabaseClient';

import { Sidebar }                              from './components/Sidebar.jsx';
import { Topbar }                               from './components/Topbar.jsx';
import { PageState, SectionPanel, EmptyState }  from './components/UI.jsx';
import { LoginScreen, ConfigScreen }             from './components/LoginScreen.jsx';
import { formatCurrency }                        from './components/DataComponents.jsx';

import { MoviesView }    from './components/MoviesView.jsx';
import { ServicesView }  from './components/ServicesView.jsx';
import { UsersView }     from './components/UsersView.jsx';
import { BookingsView }  from './components/BookingsView.jsx';
import { SeatMapsView }  from './components/SeatMapsView.jsx';
import { DashboardView } from './components/DashboardView.jsx';
import { DatabaseView }  from './components/DatabaseView.jsx';

import {
  emptyMovieForm, emptyServiceForm, movieBoardFilters,
  getErrorMessage, getMoviesEmptyMessage,
  todayDateStr
} from './utils/dashboardUtils';

export default function App() {
  const [session, setSession]           = useState(null);
  const [adminProfile, setAdminProfile] = useState(null);
  const [movies, setMovies]             = useState([]);
  const [services, setServices]         = useState([]);
  const [users, setUsers]               = useState([]);
  const [bookings, setBookings]         = useState([]);
  const [activeView, setActiveView]     = useState('dashboard');
  const [notice, setNotice]             = useState(null);
  const [loginForm, setLoginForm]       = useState({ email: '', password: '' });
  const [loginError, setLoginError]     = useState('');
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isSyncing, setIsSyncing]       = useState(false);
  
  const [movieForm, setMovieForm]       = useState({ ...emptyMovieForm, showDate: todayDateStr });
  const [serviceForm, setServiceForm]   = useState(emptyServiceForm);
  const [movieBoardFilter, setMovieBoardFilter] = useState('today');
  const [editingMovie, setEditingMovie] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [userPage, setUserPage] = useState(1);
  const usersPerPage = 6;

  const [bookingDate, setBookingDate] = useState('');
  const [bookingMovieTitle, setBookingMovieTitle] = useState('');
  const [bookingShowtimeId, setBookingShowtimeId] = useState('');

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

  const refreshDashboard = useCallback(async (silent = false) => {
    if (!silent) setIsSyncing(true);
    try {
      const data = await fetchDashboardData();
      setMovies(data.movies);
      setServices(data.services);
      setUsers(data.users);
      setBookings(data.bookings);
    } catch (e) {
      setNotice({ type: 'error', msg: getErrorMessage(e) });
    } finally {
      if (!silent) setIsSyncing(false);
    }
  }, []);

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
        if (!ignore) { setAdminProfile(profile); }
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

  // Derived State (Metrics, Filters, etc.)
  const metrics = useMemo(() => {
    const liveMovies    = movies.filter((m) => m.showDateValue === todayDateStr && m.showtimeStatus !== 'cancelled').length;
    const activeUsers   = users.filter(u => u.status === 'active').length;
    const revenue       = bookings.filter(b => b.paymentStatus === 'paid').reduce((t, b) => t + b.total, 0);
    return [
      { label: 'Now Showing',    value: `${liveMovies}`,         icon: Film,        hint: 'Movies that stay live until paused' },
      { label: 'Total Bookings', value: `${bookings.length}`,    icon: Ticket,      hint: 'All booking records' },
      { label: 'Mobile Users',   value: `${activeUsers}`,        icon: Users,       hint: 'Active customer accounts' },
      { label: 'Paid Revenue',   value: formatCurrency(revenue), icon: TrendingUp,  hint: 'Confirmed paid bookings' },
    ];
  }, [movies, users, bookings]);

  const visibleMovies = useMemo(() => {
    // 1. Group ALL movies into "Runs" first to ensure consistent data
    const groups = new Map();
    [...movies].forEach(m => {
      const key = `${m.title}-${m.branch}-${m.hall}-${m.showTimeValue}`;
      if (!groups.has(key)) {
        groups.set(key, { 
          ...m, 
          startDate: m.showDateValue, 
          endDate: m.showDateValue,
          allShowtimeIds: [m.id],
          totalTickets: m.ticketsSold
        });
      } else {
        const g = groups.get(key);
        if (m.showDateValue < g.startDate) g.startDate = m.showDateValue;
        if (m.showDateValue > g.endDate) g.endDate = m.showDateValue;
        g.allShowtimeIds.push(m.id);
        g.totalTickets += m.ticketsSold;
      }
    });

    const result = Array.from(groups.values()).map(g => ({
      ...g,
      showDateDisplay: g.startDate === g.endDate ? g.startDate : `${g.startDate} — ${g.endDate}`,
      ticketsSold: g.totalTickets
    }));

    // 2. Filter based on selected tab
    if (movieBoardFilter === 'today') {
      // Show runs that are active TODAY
      return result.filter(g => g.startDate <= todayDateStr && g.endDate >= todayDateStr);
    }
    if (movieBoardFilter === 'upcoming') {
      // Show runs that start in the future
      return result.filter(g => g.startDate > todayDateStr);
    }

    return result;
  }, [movies, movieBoardFilter]);

  const topMovies = useMemo(() => [...movies].filter(m => m.showDateValue === todayDateStr).sort((a, b) => b.ticketsSold - a.ticketsSold).slice(0, 5), [movies]);
  
  const filteredUsers = useMemo(() => {
    if (selectedUserId) return users.filter(u => u.id === selectedUserId);
    return users.filter(u => u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) || u.email.toLowerCase().includes(userSearchQuery.toLowerCase()));
  }, [users, userSearchQuery, selectedUserId]);

  const totalUserPages = Math.ceil(filteredUsers.length / usersPerPage);
  const paginatedUsers = useMemo(() => filteredUsers.slice((userPage - 1) * usersPerPage, userPage * usersPerPage), [filteredUsers, userPage]);
  
  const userSuggestions = useMemo(() => {
    if (!userSearchQuery.trim() || !showSuggestions) return [];
    const matches = users.filter(u => u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) || u.email.toLowerCase().includes(userSearchQuery.toLowerCase()));
    if (matches.length === 1 && (matches[0].name.toLowerCase() === userSearchQuery.toLowerCase() || matches[0].email.toLowerCase() === userSearchQuery.toLowerCase())) return [];
    return matches.slice(0, 5);
  }, [users, userSearchQuery, showSuggestions]);

  const availableBookingDates = useMemo(() => Array.from(new Set(movies.map(m => m.showDateValue || m.showDate))).sort((a, b) => b.localeCompare(a)).map(d => ({ value: d, label: d })), [movies]);
  const availableBookingMovies = useMemo(() => !bookingDate ? [] : Array.from(new Set(movies.filter(m => (m.showDateValue || m.showDate) === bookingDate).map(m => m.title))).sort().map(t => ({ value: t, label: t })), [movies, bookingDate]);
  const availableBookingShowtimes = useMemo(() => !bookingDate || !bookingMovieTitle ? [] : movies.filter(m => (m.showDateValue || m.showDate) === bookingDate && m.title === bookingMovieTitle).map(m => ({ value: m.id, label: `${m.city} — ${m.branch} ${m.hall} (${m.showTime})` })), [movies, bookingDate, bookingMovieTitle]);
  const filteredBookings = useMemo(() => {
    let res = [...bookings];
    if (bookingShowtimeId) res = res.filter(b => b.showtimeId === bookingShowtimeId);
    else if (bookingMovieTitle) {
      const stIds = movies.filter(m => (m.showDateValue || m.showDate) === bookingDate && m.title === bookingMovieTitle).map(m => m.id);
      res = res.filter(b => stIds.includes(b.showtimeId));
    } else if (bookingDate) {
      const stIds = movies.filter(m => (m.showDateValue || m.showDate) === bookingDate).map(m => m.id);
      res = res.filter(b => stIds.includes(b.showtimeId));
    }
    return res;
  }, [bookings, movies, bookingDate, bookingMovieTitle, bookingShowtimeId]);

  // Effect resets
  useEffect(() => setUserPage(1), [userSearchQuery]);
  useEffect(() => { setBookingMovieTitle(''); setBookingShowtimeId(''); }, [bookingDate]);
  useEffect(() => { setBookingShowtimeId(''); }, [bookingMovieTitle]);

  // Handlers
  async function handleLogin(e) { e.preventDefault(); setLoginError(''); try { await signInAdmin(loginForm); } catch (err) { setLoginError(getErrorMessage(err)); } }
  async function handleLogout() { try { await signOutAdmin(); setActiveView('dashboard'); setNotice({ type: 'success', msg: 'Signed out.' }); } catch (e) { setNotice({ type: 'error', msg: getErrorMessage(e) }); } }

  async function handleMovieSubmit(e) {
    e.preventDefault();
    const p = { ...movieForm, title: movieForm.title.trim(), ticketPrice: Number(movieForm.ticketPrice) };
    if (!p.title || !p.genre || !p.language || !p.theaterName || !p.city || !p.hall || !p.showTime || !p.ticketPrice) { setNotice({ type: 'error', msg: 'Fill in all fields.' }); return; }
    try {
      if (editingMovie) await updateMovieSchedule(editingMovie.id, editingMovie.movieId, p, adminProfile.id);
      else await createMovieSchedule(p, adminProfile.id);
      setMovieForm({ ...emptyMovieForm, showDate: todayDateStr }); setEditingMovie(null); await refreshDashboard();
      setNotice({ type: 'success', msg: 'Movie schedule saved.' });
    } catch (err) { setNotice({ type: 'error', msg: getErrorMessage(err) }); }
  }

  function handleEditMovie(m) { 
    setEditingMovie(m); 
    setMovieForm({ 
      ...m, 
      theaterName: m.branch, 
      showDate: m.startDate || m.showDateValue,
      showDateEnd: m.endDate || '',
      showTime: m.showTimeValue ? m.showTimeValue.slice(0, 5) : '', 
      ticketPrice: String(m.ticketPrice) 
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleServiceSubmit(e) {
    e.preventDefault();
    const p = { ...serviceForm, price: Number(serviceForm.price) };
    if (!p.name || !p.category || !p.branch || !p.price) { setNotice({ type: 'error', msg: 'Fill in all fields.' }); return; }
    try { await createService(p, adminProfile.id); setServiceForm(emptyServiceForm); await refreshDashboard(); setNotice({ type: 'success', msg: 'Service saved.' }); }
    catch (err) { setNotice({ type: 'error', msg: getErrorMessage(err) }); }
  }

  async function handleServiceStatusChange(id, status) { try { await updateServiceStatus(id, status, adminProfile.id); await refreshDashboard(); } catch (e) { setNotice({ type: 'error', msg: getErrorMessage(e) }); } }
  
  async function handleDeleteMovie(id, mId, title, idsToDelete) { 
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Movie Schedule?',
      message: `Are you sure you want to delete "${title}" and its showtime(s)? This cannot be undone.`,
      onConfirm: async () => {
        try { 
          const targetIds = idsToDelete || [id];
          for (const sId of targetIds) {
            await deleteMovieSchedule(sId, mId, title, adminProfile.id); 
          }
          await refreshDashboard(); 
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        } catch (e) { 
          setNotice({ type: 'error', msg: getErrorMessage(e) }); 
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        } 
      }
    });
  }

  function handleDuplicateMovie(m) {
    setMovieForm({ 
      ...m, 
      theaterName: m.branch, 
      showDate: todayDateStr,
      showDateEnd: '',
      showTime: m.showTimeValue ? m.showTimeValue.slice(0, 5) : '', 
      ticketPrice: String(m.ticketPrice) 
    });
    setEditingMovie(null); // Ensure it saves as NEW
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (!hasSupabaseConfig) return <ConfigScreen message={getSupabaseConfigError()} />;
  if (!session) return <LoginScreen form={loginForm} error={loginError} onChange={setLoginForm} onSubmit={handleLogin} isLoading={isBootstrapping} />;
  if (isBootstrapping && !adminProfile) return <PageState title="Connecting" body="Loading admin account…" />;

  return (
    <div className="admin-app">
      <Sidebar activeView={activeView} onNavigate={setActiveView} adminProfile={adminProfile} onLogout={handleLogout} />
      <div className="main-shell">
        <Topbar activeView={activeView} isSyncing={isSyncing} refreshDashboard={refreshDashboard} />
        {notice && (
          <div style={{ padding: '0 1.75rem' }}>
            <div className={`notice-bar notice-bar--${notice.type}`}>
              {notice.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
              {notice.msg}
            </div>
          </div>
        )}
        <main className="page-content">
          {activeView === 'dashboard' && <DashboardView metrics={metrics} movies={movies} services={services} users={users} bookings={bookings} topMovies={topMovies} />}
          {activeView === 'movies'    && <MoviesView movieForm={movieForm} setMovieForm={setMovieForm} handleMovieSubmit={handleMovieSubmit} editingMovie={editingMovie} handleCancelEdit={() => {setEditingMovie(null); setMovieForm({ ...emptyMovieForm, showDate: todayDateStr });}} movieBoardFilters={movieBoardFilters} movieBoardFilter={movieBoardFilter} setMovieBoardFilter={setMovieBoardFilter} visibleMovies={visibleMovies} handleDeleteMovie={handleDeleteMovie} handleEditMovie={handleEditMovie} handleDuplicateMovie={handleDuplicateMovie} getMoviesEmptyMessage={getMoviesEmptyMessage} />}
          {activeView === 'services'  && <ServicesView serviceForm={serviceForm} setServiceForm={setServiceForm} handleServiceSubmit={handleServiceSubmit} services={services} handleServiceStatusChange={handleServiceStatusChange} />}
          {activeView === 'users'     && <UsersView userSearchQuery={userSearchQuery} setUserSearchQuery={setUserSearchQuery} setShowSuggestions={setShowSuggestions} userSuggestions={userSuggestions} setSelectedUserId={setSelectedUserId} paginatedUsers={paginatedUsers} totalUserPages={totalUserPages} userPage={userPage} setUserPage={setUserPage} />}
          {activeView === 'bookings'  && <BookingsView bookingDate={bookingDate} setBookingDate={setBookingDate} availableBookingDates={availableBookingDates} bookingMovieTitle={bookingMovieTitle} setBookingMovieTitle={setBookingMovieTitle} availableBookingMovies={availableBookingMovies} bookingShowtimeId={bookingShowtimeId} setBookingShowtimeId={setBookingShowtimeId} availableBookingShowtimes={availableBookingShowtimes} filteredBookings={filteredBookings} />}
          {activeView === 'seat-maps' && <SeatMapsView movies={movies} bookings={bookings} />}
          {activeView === 'database'  && <DatabaseView />}
        </main>
      </div>
      <ConfirmModal 
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />
    </div>
  );
}

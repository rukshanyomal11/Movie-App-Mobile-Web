import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  createMovieSchedule,
  createService,
  fetchDashboardData,
  getCurrentSession,
  loadAdminProfile,
  signInAdmin,
  signOutAdmin,
  subscribeToAuthChanges,
  updateMovieStatus,
  updateServiceStatus,
} from './supabaseAdminApi';
import { getSupabaseConfigError, hasSupabaseConfig } from './supabaseClient';

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'movies', label: 'Today Movies' },
  { id: 'services', label: 'Services' },
  { id: 'users', label: 'App Users' },
  { id: 'bookings', label: 'Bookings' },
  { id: 'database', label: 'Database' },
];

const movieStatusOptions = [
  { value: 'now_showing', label: 'Now Showing' },
  { value: 'featured', label: 'Featured' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'paused', label: 'Paused' },
];

const serviceStatusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'maintenance', label: 'Maintenance' },
];

const emptyMovieForm = {
  title: '',
  genre: '',
  language: '',
  theaterName: '',
  city: '',
  hall: '',
  format: '2D',
  showTime: '',
  ticketPrice: '',
  status: 'now_showing',
};

const emptyServiceForm = {
  name: '',
  category: '',
  branch: '',
  price: '',
  status: 'active',
};

const moneyFormatter = new Intl.NumberFormat('en-LK', {
  style: 'currency',
  currency: 'LKR',
  maximumFractionDigits: 0,
});

function formatCurrency(amount) {
  return moneyFormatter.format(Number(amount) || 0);
}

function formatStatusLabel(value) {
  return value
    .split('_')
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ');
}

function getTodayLabel() {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());
}

function getErrorMessage(error) {
  if (!error) {
    return 'Unexpected error.';
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error.message) {
    return error.message;
  }

  return 'Unexpected error.';
}

function App() {
  const [session, setSession] = useState(null);
  const [adminProfile, setAdminProfile] = useState(null);
  const [movies, setMovies] = useState([]);
  const [services, setServices] = useState([]);
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [activeView, setActiveView] = useState('dashboard');
  const [notice, setNotice] = useState('');
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  });
  const [loginError, setLoginError] = useState('');
  const [dataError, setDataError] = useState('');
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [movieForm, setMovieForm] = useState(emptyMovieForm);
  const [serviceForm, setServiceForm] = useState(emptyServiceForm);

  useEffect(() => {
    if (!notice) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      setNotice('');
    }, 5000);

    return () => window.clearTimeout(timeout);
  }, [notice]);

  useEffect(() => {
    if (!hasSupabaseConfig) {
      setIsBootstrapping(false);
      return undefined;
    }

    let ignore = false;

    async function restoreSession() {
      try {
        const currentSession = await getCurrentSession();

        if (!ignore) {
          setSession(currentSession);
        }
      } catch (error) {
        if (!ignore) {
          setDataError(getErrorMessage(error));
        }
      } finally {
        if (!ignore) {
          setIsBootstrapping(false);
        }
      }
    }

    restoreSession();

    const subscription = subscribeToAuthChanges((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      ignore = true;
      subscription.unsubscribe();
    };
  }, []);

  const refreshDashboard = useCallback(async () => {
    setIsSyncing(true);
    setDataError('');

    try {
      const data = await fetchDashboardData();
      setMovies(data.movies);
      setServices(data.services);
      setUsers(data.users);
      setBookings(data.bookings);
    } catch (error) {
      setDataError(getErrorMessage(error));
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    if (!session?.user) {
      setAdminProfile(null);
      setMovies([]);
      setServices([]);
      setUsers([]);
      setBookings([]);
      return;
    }

    let ignore = false;

    async function hydrateProfile() {
      setIsBootstrapping(true);
      setLoginError('');
      setDataError('');

      try {
        const profile = await loadAdminProfile(session.user);

        if (ignore) {
          return;
        }

        setAdminProfile(profile);
        setNotice('Connected to the Supabase admin database.');
      } catch (error) {
        if (ignore) {
          return;
        }

        await signOutAdmin().catch(() => undefined);
        setLoginError(getErrorMessage(error));
      } finally {
        if (!ignore) {
          setIsBootstrapping(false);
        }
      }
    }

    hydrateProfile();

    return () => {
      ignore = true;
    };
  }, [session?.user?.id]);

  useEffect(() => {
    if (!adminProfile?.id) {
      return;
    }

    refreshDashboard();
  }, [adminProfile?.id, refreshDashboard]);

  const metrics = useMemo(() => {
    const liveMovies = movies.filter((movie) =>
      ['now_showing', 'featured'].includes(movie.status),
    ).length;
    const activeServices = services.filter((service) => service.status === 'active').length;
    const activeUsers = users.filter((user) => user.status === 'active').length;
    const totalRevenue = bookings
      .filter((booking) => booking.paymentStatus === 'paid')
      .reduce((total, booking) => total + booking.total, 0);

    return [
      {
        label: 'Live Movies',
        value: `${liveMovies}`,
        hint: 'Today showtimes from Supabase',
      },
      {
        label: 'Active Services',
        value: `${activeServices}`,
        hint: 'Live service records from Supabase',
      },
      {
        label: 'Mobile App Users',
        value: `${activeUsers}`,
        hint: 'Customer accounts in app_users',
      },
      {
        label: 'Paid Revenue',
        value: formatCurrency(totalRevenue),
        hint: 'Paid bookings from the shared database',
      },
    ];
  }, [bookings, movies, services, users]);

  const topMovies = useMemo(
    () => [...movies].sort((left, right) => right.ticketsSold - left.ticketsSold).slice(0, 3),
    [movies],
  );

  function showNotice(message) {
    setNotice(message);
  }

  async function handleLogin(event) {
    event.preventDefault();
    setLoginError('');

    try {
      await signInAdmin(loginForm);
    } catch (error) {
      setLoginError(getErrorMessage(error));
    }
  }

  async function handleLogout() {
    try {
      await signOutAdmin();
      setActiveView('dashboard');
      showNotice('Signed out of the admin dashboard.');
    } catch (error) {
      setDataError(getErrorMessage(error));
    }
  }

  async function handleMovieSubmit(event) {
    event.preventDefault();

    const payload = {
      title: movieForm.title.trim(),
      genre: movieForm.genre.trim(),
      language: movieForm.language.trim(),
      theaterName: movieForm.theaterName.trim(),
      city: movieForm.city.trim(),
      hall: movieForm.hall.trim(),
      format: movieForm.format,
      showTime: movieForm.showTime.trim(),
      ticketPrice: Number(movieForm.ticketPrice),
      status: movieForm.status,
    };

    if (
      !payload.title ||
      !payload.genre ||
      !payload.language ||
      !payload.theaterName ||
      !payload.city ||
      !payload.hall ||
      !payload.showTime ||
      !payload.ticketPrice
    ) {
      showNotice('Fill in all movie fields before saving.');
      return;
    }

    try {
      await createMovieSchedule(payload, adminProfile.id);
      setMovieForm(emptyMovieForm);
      await refreshDashboard();
      showNotice(`Movie "${payload.title}" was saved to Supabase.`);
    } catch (error) {
      setDataError(getErrorMessage(error));
    }
  }

  async function handleServiceSubmit(event) {
    event.preventDefault();

    const payload = {
      name: serviceForm.name.trim(),
      category: serviceForm.category.trim(),
      branch: serviceForm.branch.trim(),
      price: Number(serviceForm.price),
      status: serviceForm.status,
    };

    if (!payload.name || !payload.category || !payload.branch || !payload.price) {
      showNotice('Fill in all service fields before saving.');
      return;
    }

    try {
      await createService(payload, adminProfile.id);
      setServiceForm(emptyServiceForm);
      await refreshDashboard();
      showNotice(`Service "${payload.name}" was saved to Supabase.`);
    } catch (error) {
      setDataError(getErrorMessage(error));
    }
  }

  async function handleMovieStatusChange(movieId, nextStatus) {
    try {
      await updateMovieStatus(movieId, nextStatus, adminProfile.id);
      await refreshDashboard();
      showNotice('Movie status updated in Supabase.');
    } catch (error) {
      setDataError(getErrorMessage(error));
    }
  }

  async function handleServiceStatusChange(serviceId, nextStatus) {
    try {
      await updateServiceStatus(serviceId, nextStatus, adminProfile.id);
      await refreshDashboard();
      showNotice('Service status updated in Supabase.');
    } catch (error) {
      setDataError(getErrorMessage(error));
    }
  }

  if (!hasSupabaseConfig) {
    return <ConfigScreen message={getSupabaseConfigError()} />;
  }

  if (!session) {
    return (
      <LoginScreen
        form={loginForm}
        error={loginError}
        onChange={setLoginForm}
        onSubmit={handleLogin}
        isLoading={isBootstrapping}
      />
    );
  }

  if (isBootstrapping && !adminProfile) {
    return <PageState title="Connecting to Supabase" body="Loading the admin account." />;
  }

  return (
    <div className="admin-app">
      <aside className="sidebar">
        <div className="sidebar__brand">
          <p className="sidebar__eyebrow">CineBook</p>
          <h1>Admin Panel</h1>
          <p className="sidebar__copy">
            Manage today&apos;s movies, services, users, and booking activity from one shared
            Supabase database.
          </p>
        </div>

        <nav className="sidebar__nav" aria-label="Admin navigation">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`nav-button ${activeView === item.id ? 'nav-button--active' : ''}`}
              onClick={() => setActiveView(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar__footer">
          <p className="sidebar__footer-label">Signed in as</p>
          <strong>{adminProfile?.name}</strong>
          <span>{adminProfile?.email}</span>
        </div>
      </aside>

      <div className="main-shell">
        <header className="topbar">
          <div>
            <p className="topbar__eyebrow">Supabase admin workspace</p>
            <h2>{getViewTitle(activeView)}</h2>
          </div>

          <div className="topbar__actions">
            <div className="topbar__date">
              <span>Today</span>
              <strong>{getTodayLabel()}</strong>
            </div>
            <button type="button" className="ghost-button" onClick={refreshDashboard}>
              {isSyncing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button type="button" className="ghost-button" onClick={handleLogout}>
              Sign Out
            </button>
          </div>
        </header>

        {notice ? <div className="notice-banner">{notice}</div> : null}
        {dataError ? <div className="error-banner">{dataError}</div> : null}

        <main className="page-content">
          {activeView === 'dashboard' ? (
            <DashboardView
              metrics={metrics}
              movies={movies}
              services={services}
              users={users}
              bookings={bookings}
              topMovies={topMovies}
            />
          ) : null}

          {activeView === 'movies' ? (
            <div className="content-grid content-grid--wide">
              <SectionPanel
                title="Today movie updates"
                description="Add movie and showtime records directly into Supabase for today."
              >
                <MovieForm form={movieForm} onChange={setMovieForm} onSubmit={handleMovieSubmit} />
              </SectionPanel>

              <SectionPanel
                title="Movie schedule"
                description="These rows come directly from the showtimes, movies, screens, and theaters tables."
              >
                <MoviesTable movies={movies} onStatusChange={handleMovieStatusChange} />
              </SectionPanel>
            </div>
          ) : null}

          {activeView === 'services' ? (
            <div className="content-grid content-grid--wide">
              <SectionPanel
                title="Service management"
                description="Create or update cinema services stored in the shared services table."
              >
                <ServiceForm
                  form={serviceForm}
                  onChange={setServiceForm}
                  onSubmit={handleServiceSubmit}
                />
              </SectionPanel>

              <SectionPanel
                title="Current services"
                description="These rows come directly from Supabase."
              >
                <ServicesTable
                  services={services}
                  onStatusChange={handleServiceStatusChange}
                />
              </SectionPanel>
            </div>
          ) : null}

          {activeView === 'users' ? (
            <SectionPanel
              title="People using the mobile app"
              description="These customer accounts come from app_users, and booking counts come from bookings."
            >
              <UsersTable users={users} />
            </SectionPanel>
          ) : null}

          {activeView === 'bookings' ? (
            <SectionPanel
              title="Booking details"
              description="These rows come directly from bookings and booking_seats in Supabase."
            >
              <BookingsTable bookings={bookings} />
            </SectionPanel>
          ) : null}

          {activeView === 'database' ? <DatabaseView /> : null}
        </main>
      </div>
    </div>
  );
}

function ConfigScreen({ message }) {
  return (
    <div className="login-shell">
      <section className="login-panel login-panel--single">
        <div className="login-panel__intro">
          <p className="sidebar__eyebrow">Supabase setup needed</p>
          <h1>The admin site needs valid Supabase environment values.</h1>
          <p>{message}</p>
          <div className="credential-box">
            <p>Required variables</p>
            <strong>VITE_SUPABASE_URL</strong>
            <span>VITE_SUPABASE_PUBLISHABLE_KEY</span>
          </div>
        </div>
      </section>
    </div>
  );
}

function LoginScreen({ form, error, onChange, onSubmit, isLoading }) {
  return (
    <div className="login-shell">
      <section className="login-panel">
        <div className="login-panel__intro">
          <p className="sidebar__eyebrow">Shared Cinema Admin</p>
          <h1>Sign in with your Supabase admin account.</h1>
          <p>
            This website no longer uses local demo data. It reads movies, services, users, and
            bookings from your shared Supabase database.
          </p>

          <div className="credential-box">
            <p>Admin account requirements</p>
            <strong>Supabase Auth user</strong>
            <span>Matching app_users row with role = admin</span>
          </div>

          <ul className="feature-list">
            <li>Movies come from movies + showtimes</li>
            <li>Services come from services</li>
            <li>Users come from app_users</li>
            <li>Bookings come from bookings + booking_seats</li>
            <li>Updates are written back to Supabase</li>
          </ul>
        </div>

        <form className="login-card" onSubmit={onSubmit}>
          <div className="field-group">
            <label htmlFor="admin-email">Admin Email</label>
            <input
              id="admin-email"
              type="email"
              value={form.email}
              onChange={(event) =>
                onChange((current) => ({ ...current, email: event.target.value }))
              }
            />
          </div>

          <div className="field-group">
            <label htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              type="password"
              value={form.password}
              onChange={(event) =>
                onChange((current) => ({ ...current, password: event.target.value }))
              }
            />
          </div>

          {error ? <p className="error-text">{error}</p> : null}

          <button type="submit" className="primary-button" disabled={isLoading}>
            {isLoading ? 'Connecting...' : 'Log In'}
          </button>

          <p className="login-help">
            The email must exist in Supabase Auth and also in app_users with admin access.
          </p>
        </form>
      </section>
    </div>
  );
}

function DashboardView({ metrics, movies, services, users, bookings, topMovies }) {
  return (
    <div className="dashboard-stack">
      <section className="metric-grid">
        {metrics.map((metric) => (
          <article key={metric.label} className="metric-card">
            <p className="metric-card__label">{metric.label}</p>
            <strong>{metric.value}</strong>
            <span>{metric.hint}</span>
          </article>
        ))}
      </section>

      <div className="content-grid">
        <SectionPanel
          title="Top movies today"
          description="These titles have the most sold seats in today&apos;s Supabase data."
        >
          {topMovies.length ? (
            <div className="list-stack">
              {topMovies.map((movie) => (
                <article key={movie.id} className="row-card">
                  <div>
                    <strong>{movie.title}</strong>
                    <p>
                      {movie.branch} | {movie.hall} | {movie.showTime}
                    </p>
                  </div>
                  <div className="row-card__meta">
                    <span>{movie.ticketsSold} sold</span>
                    <span className={`badge badge--${movie.status}`}>
                      {formatStatusLabel(movie.status)}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState message="No movie showtimes found in Supabase for today." />
          )}
        </SectionPanel>

        <SectionPanel
          title="Live data summary"
          description="The website and the mobile app should both use these same tables."
        >
          <div className="database-summary">
            <p>Admin website reads and writes the shared Supabase project.</p>
            <p>Mobile app should read the same movies, services, and bookings tables.</p>
            <p>Today&apos;s movie list comes from the showtimes table joined to movies.</p>
            <p className="database-summary__path">
              Update SQL: <code>shared-database/schema.sql</code>
            </p>
          </div>
        </SectionPanel>
      </div>

      <div className="content-grid">
        <SectionPanel
          title="Recent bookings"
          description="A quick view of the latest shared booking data."
        >
          <BookingsTable bookings={bookings.slice(0, 4)} compact />
        </SectionPanel>

        <SectionPanel
          title="System counts"
          description="Counts from live Supabase tables."
        >
          <div className="mini-stats">
            <div className="mini-stat">
              <strong>{movies.length}</strong>
              <span>Today showtimes</span>
            </div>
            <div className="mini-stat">
              <strong>{services.length}</strong>
              <span>Service rows</span>
            </div>
            <div className="mini-stat">
              <strong>{users.length}</strong>
              <span>Customer rows</span>
            </div>
            <div className="mini-stat">
              <strong>{bookings.length}</strong>
              <span>Booking rows</span>
            </div>
          </div>
        </SectionPanel>
      </div>
    </div>
  );
}

function MovieForm({ form, onChange, onSubmit }) {
  return (
    <form className="form-grid" onSubmit={onSubmit}>
      <InputField
        label="Movie Title"
        value={form.title}
        onChange={(value) => onChange((current) => ({ ...current, title: value }))}
      />
      <InputField
        label="Genre"
        value={form.genre}
        onChange={(value) => onChange((current) => ({ ...current, genre: value }))}
      />
      <InputField
        label="Language"
        value={form.language}
        onChange={(value) => onChange((current) => ({ ...current, language: value }))}
      />
      <InputField
        label="Theater Branch"
        value={form.theaterName}
        onChange={(value) => onChange((current) => ({ ...current, theaterName: value }))}
      />
      <InputField
        label="City"
        value={form.city}
        onChange={(value) => onChange((current) => ({ ...current, city: value }))}
      />
      <InputField
        label="Hall"
        value={form.hall}
        placeholder="Hall A"
        onChange={(value) => onChange((current) => ({ ...current, hall: value }))}
      />
      <SelectField
        label="Format"
        value={form.format}
        options={[
          { value: '2D', label: '2D' },
          { value: '3D', label: '3D' },
          { value: 'IMAX', label: 'IMAX' },
        ]}
        onChange={(value) => onChange((current) => ({ ...current, format: value }))}
      />
      <InputField
        label="Show Time"
        value={form.showTime}
        placeholder="18:30"
        onChange={(value) => onChange((current) => ({ ...current, showTime: value }))}
      />
      <InputField
        label="Ticket Price"
        value={form.ticketPrice}
        placeholder="1800"
        onChange={(value) => onChange((current) => ({ ...current, ticketPrice: value }))}
      />
      <SelectField
        label="Status"
        value={form.status}
        options={movieStatusOptions}
        onChange={(value) => onChange((current) => ({ ...current, status: value }))}
      />

      <div className="form-actions">
        <button type="submit" className="primary-button">
          Save Movie
        </button>
      </div>
    </form>
  );
}

function ServiceForm({ form, onChange, onSubmit }) {
  return (
    <form className="form-grid" onSubmit={onSubmit}>
      <InputField
        label="Service Name"
        value={form.name}
        onChange={(value) => onChange((current) => ({ ...current, name: value }))}
      />
      <InputField
        label="Category"
        value={form.category}
        onChange={(value) => onChange((current) => ({ ...current, category: value }))}
      />
      <InputField
        label="Branch"
        value={form.branch}
        onChange={(value) => onChange((current) => ({ ...current, branch: value }))}
      />
      <InputField
        label="Price"
        value={form.price}
        placeholder="950"
        onChange={(value) => onChange((current) => ({ ...current, price: value }))}
      />
      <SelectField
        label="Status"
        value={form.status}
        options={serviceStatusOptions}
        onChange={(value) => onChange((current) => ({ ...current, status: value }))}
      />

      <div className="form-actions">
        <button type="submit" className="primary-button">
          Save Service
        </button>
      </div>
    </form>
  );
}

function MoviesTable({ movies, onStatusChange }) {
  if (!movies.length) {
    return <EmptyState message="No showtimes found in Supabase for today." />;
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Movie</th>
            <th>Show</th>
            <th>Price</th>
            <th>Seats Left</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {movies.map((movie) => (
            <tr key={movie.id}>
              <td>
                <strong>{movie.title}</strong>
                <span>
                  {movie.genre} | {movie.language}
                </span>
              </td>
              <td>
                <strong>{movie.showTime}</strong>
                <span>
                  {movie.branch} | {movie.hall} | {movie.format}
                </span>
              </td>
              <td>{formatCurrency(movie.ticketPrice)}</td>
              <td>{movie.seatsLeft}</td>
              <td>
                <select
                  className="status-select"
                  value={movie.status}
                  onChange={(event) => onStatusChange(movie.movieId, event.target.value)}
                >
                  {movieStatusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ServicesTable({ services, onStatusChange }) {
  if (!services.length) {
    return <EmptyState message="No services found in Supabase yet." />;
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Service</th>
            <th>Category</th>
            <th>Branch</th>
            <th>Price</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {services.map((service) => (
            <tr key={service.id}>
              <td>
                <strong>{service.name}</strong>
                <span>Updated {service.updatedAt}</span>
              </td>
              <td>{service.category}</td>
              <td>{service.branch}</td>
              <td>{formatCurrency(service.price)}</td>
              <td>
                <select
                  className="status-select"
                  value={service.status}
                  onChange={(event) => onStatusChange(service.id, event.target.value)}
                >
                  {serviceStatusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UsersTable({ users }) {
  if (!users.length) {
    return <EmptyState message="No customer accounts found in app_users." />;
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Joined</th>
            <th>Last Seen</th>
            <th>Bookings</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>
                <strong>{user.name}</strong>
                <span>{user.email}</span>
              </td>
              <td>{user.joinedAt}</td>
              <td>{user.lastSeen}</td>
              <td>{user.bookingsCount}</td>
              <td>
                <span className={`badge badge--${user.status}`}>
                  {formatStatusLabel(user.status)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BookingsTable({ bookings, compact = false }) {
  if (!bookings.length) {
    return <EmptyState message="No bookings found in Supabase yet." />;
  }

  return (
    <div className="table-wrap">
      <table className={`data-table ${compact ? 'data-table--compact' : ''}`}>
        <thead>
          <tr>
            <th>Code</th>
            <th>User</th>
            <th>Movie</th>
            <th>Seats</th>
            <th>Total</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((booking) => (
            <tr key={booking.id}>
              <td>
                <strong>{booking.code}</strong>
                <span>{booking.bookedAt}</span>
              </td>
              <td>{booking.userName}</td>
              <td>{booking.movieTitle}</td>
              <td>{booking.seats}</td>
              <td>{formatCurrency(booking.total)}</td>
              <td>
                <div className="stacked-badges">
                  <span className={`badge badge--${booking.bookingStatus}`}>
                    {formatStatusLabel(booking.bookingStatus)}
                  </span>
                  <span className={`badge badge--${booking.paymentStatus}`}>
                    {formatStatusLabel(booking.paymentStatus)}
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DatabaseView() {
  return (
    <div className="content-grid">
      <SectionPanel
        title="How the common database works"
        description="The admin website and the mobile app now point to the same Supabase project."
      >
        <ol className="ordered-list">
          <li>Admin signs in with Supabase Auth.</li>
          <li>The app checks app_users to confirm role = admin.</li>
          <li>Movie updates are written to movies, showtimes, theaters, and screens.</li>
          <li>Service updates are written to services.</li>
          <li>Users and bookings are read from app_users, bookings, and booking_seats.</li>
        </ol>
      </SectionPanel>

      <SectionPanel
        title="Files to run in Supabase"
        description="Apply these files in the Supabase SQL editor before using the live dashboard."
      >
        <div className="file-list">
          <div className="file-row">
            <code>shared-database/schema.sql</code>
            <span>Tables, functions, grants, and RLS policies</span>
          </div>
          <div className="file-row">
            <code>shared-database/sample-data.sql</code>
            <span>Now empty on purpose so no demo rows are inserted</span>
          </div>
          <div className="file-row">
            <code>website/.env</code>
            <span>Supabase URL and publishable key only</span>
          </div>
        </div>
      </SectionPanel>

      <SectionPanel
        title="Required admin setup"
        description="Before login works, create the auth user and matching app_users row."
      >
        <div className="database-summary">
          <p>1. Create the admin email/password user in Supabase Auth.</p>
          <p>2. Insert the same email in app_users with role = admin and status = active.</p>
          <p>3. Sign in here with that same email and password.</p>
          <p>4. The dashboard will then read live data from Supabase.</p>
        </div>
      </SectionPanel>
    </div>
  );
}

function SectionPanel({ title, description, children }) {
  return (
    <section className="section-panel">
      <div className="section-panel__header">
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function InputField({ label, value, onChange, placeholder = '' }) {
  return (
    <label className="field-group">
      <span>{label}</span>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function SelectField({ label, value, options, onChange }) {
  return (
    <label className="field-group">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function PageState({ title, body }) {
  return (
    <div className="login-shell">
      <section className="login-panel login-panel--single">
        <div className="login-panel__intro">
          <p className="sidebar__eyebrow">Loading</p>
          <h1>{title}</h1>
          <p>{body}</p>
        </div>
      </section>
    </div>
  );
}

function EmptyState({ message }) {
  return <div className="empty-state">{message}</div>;
}

function getViewTitle(activeView) {
  switch (activeView) {
    case 'movies':
      return 'Today Movies';
    case 'services':
      return 'Services';
    case 'users':
      return 'Mobile App Users';
    case 'bookings':
      return 'Booking Details';
    case 'database':
      return 'Common Database Guide';
    default:
      return 'Dashboard Overview';
  }
}

export default App;

import { Trash2, Film, ShoppingBag, Users, Ticket, Pencil } from 'lucide-react';

import { Badge, EmptyState, InputField, SelectField } from './UI.jsx';

const moneyFmt = new Intl.NumberFormat('en-LK', {
  style: 'currency',
  currency: 'LKR',
  maximumFractionDigits: 0,
});

export function formatCurrency(value) {
  return moneyFmt.format(Number(value) || 0);
}

export function formatStatusLabel(value) {
  return value
    .split('_')
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ');
}

const movieStatusOpts = [
  { value: 'now_showing', label: 'Now Showing' },
  { value: 'featured', label: 'Featured' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'paused', label: 'Paused' },
];

const serviceStatusOpts = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'maintenance', label: 'Maintenance' },
];

const formatOpts = [
  { value: '2D', label: '2D' },
  { value: '3D', label: '3D' },
  { value: 'IMAX', label: 'IMAX' },
];

export function MoviesTable({
  movies,
  onStatusChange,
  onDelete,
  onEdit,
  editingId,
  compact,
  emptyMessage = 'No movies found in the schedule.',
}) {
  if (!movies.length) {
    return <EmptyState icon={Film} message={emptyMessage} />;
  }

  return (
    <div className="table-wrap">
      <table className={`data-table ${compact ? 'data-table--compact' : ''}`}>
        <thead>
          <tr>
            <th>Movie</th>
            <th>Venue</th>
            <th>Added</th>
            <th>Sold</th>
            <th>Status</th>
            {onDelete || onEdit ? <th /> : null}
          </tr>
        </thead>
        <tbody>
          {movies.map((movie) => (
            <tr 
              key={movie.id} 
              className={movie.id === editingId ? 'row--editing' : ''}
              style={movie.id === editingId ? { 
                background: 'rgba(212, 175, 55, 0.08)', 
                boxShadow: 'inset 4px 0 0 var(--gold)',
                transition: 'all 0.3s ease'
              } : {}}
            >
              <td>
                <div className="movie-cell">
                  <div className="movie-thumb">
                    {movie.posterUrl ? (
                      <img
                        src={movie.posterUrl}
                        alt={movie.title}
                        className="movie-thumb__image"
                      />
                    ) : (
                      <div className="movie-thumb__fallback" aria-hidden="true">
                        <Film size={16} />
                      </div>
                    )}
                  </div>
                  <div className="movie-cell__content">
                    <strong>{movie.title}</strong>
                    <span>
                      {movie.genre} | {movie.language}
                    </span>
                  </div>
                </div>
              </td>
              <td>
                <span>{movie.branch}</span>
                <span>
                  {movie.hall} | {movie.format}
                </span>
              </td>
              <td>
                <div className="table-cell-stack">
                  <strong>{movie.showDate}</strong>
                  <span>{movie.showTime}</span>
                </div>
              </td>
              <td>
                <span>{movie.ticketsSold} tickets</span>
              </td>
              <td>
                {onStatusChange ? (
                  <select
                    className="status-select"
                    style={{ width: 'auto', minWidth: 130, fontSize: '0.78rem' }}
                    value={movie.status}
                    onChange={(event) => onStatusChange(movie.movieId, event.target.value)}
                  >
                    {movieStatusOpts.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Badge status={movie.status} />
                )}
              </td>
              {onDelete || onEdit ? (
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {onEdit && (
                      <button
                        type="button"
                        className="btn btn-ghost"
                        style={{ 
                          padding: '0.3rem 0.6rem', 
                          minHeight: 'unset', 
                          background: movie.id === editingId ? 'var(--gold)' : 'var(--surface-light)',
                          color: movie.id === editingId ? 'var(--bg)' : 'inherit'
                        }}
                        title={`Edit ${movie.title}`}
                        onClick={() => onEdit(movie)}
                      >
                        <Pencil size={14} />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        type="button"
                        className="btn btn-danger"
                        style={{ padding: '0.3rem 0.6rem', minHeight: 'unset' }}
                        title={`Delete ${movie.title}`}
                        onClick={() => {
                          if (
                            window.confirm(
                              `Delete "${movie.title}" and its showtime? This cannot be undone.`,
                            )
                          ) {
                            onDelete(movie.id, movie.movieId, movie.title);
                          }
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ServicesTable({ services, onStatusChange }) {
  if (!services.length) {
    return <EmptyState icon={ShoppingBag} message="No services found." />;
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Service</th>
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
                <span>{service.category}</span>
              </td>
              <td>
                <span>{service.branch}</span>
              </td>
              <td>
                <span>{formatCurrency(service.price)}</span>
              </td>
              <td>
                {onStatusChange ? (
                  <select
                    className="status-select"
                    style={{ width: 'auto', minWidth: 130, fontSize: '0.78rem' }}
                    value={service.status}
                    onChange={(event) => onStatusChange(service.id, event.target.value)}
                  >
                    {serviceStatusOpts.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Badge status={service.status} />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function UsersTable({ users }) {
  if (!users.length) {
    return <EmptyState icon={Users} message="No customer accounts found." />;
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Bookings</th>
            <th>Last Seen</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>
                <strong>{user.name}</strong>
              </td>
              <td>
                <span>{user.email}</span>
              </td>
              <td>
                <span>{user.bookingsCount}</span>
              </td>
              <td>
                <span>{user.lastSeen}</span>
              </td>
              <td>
                <Badge status={user.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function BookingsTable({ bookings, compact }) {
  if (!bookings.length) {
    return <EmptyState icon={Ticket} message="No bookings found." />;
  }

  return (
    <div className="table-wrap">
      <table className={`data-table ${compact ? 'data-table--compact' : ''}`}>
        <thead>
          <tr>
            <th>Code</th>
            <th>Customer</th>
            {compact ? null : <th>Movie</th>}
            <th>Seats</th>
            <th>Total</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((booking) => (
            <tr key={booking.id}>
              <td>
                <strong
                  style={{ fontFamily: 'monospace', color: 'var(--gold)', fontSize: '0.8rem' }}
                >
                  {booking.code}
                </strong>
              </td>
              <td>
                <strong>{booking.userName}</strong>
              </td>
              {compact ? null : (
                <td>
                  <span>{booking.movieTitle}</span>
                </td>
              )}
              <td>
                <span>{booking.seats}</span>
              </td>
              <td>
                <span>{formatCurrency(booking.total)}</span>
              </td>
              <td>
                <Badge status={booking.bookingStatus} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function MovieForm({ form, onChange, onSubmit, isEditing, onCancel }) {
  const setField = (key) => (value) => onChange((current) => ({ ...current, [key]: value }));

  return (
    <form className="form-grid" onSubmit={onSubmit}>
      <InputField
        id="m-title"
        label="Movie Title"
        value={form.title}
        onChange={setField('title')}
        placeholder="Avengers: Endgame"
      />
      <InputField
        id="m-genre"
        label="Genre"
        value={form.genre}
        onChange={setField('genre')}
        placeholder="Action"
      />
      <InputField
        id="m-lang"
        label="Language"
        value={form.language}
        onChange={setField('language')}
        placeholder="English"
      />
      <InputField
        id="m-theater"
        label="Theater Branch"
        value={form.theaterName}
        onChange={setField('theaterName')}
        placeholder="Majestic Cinemas"
      />
      <InputField
        id="m-city"
        label="City"
        value={form.city}
        onChange={setField('city')}
        placeholder="Colombo"
      />
      <InputField
        id="m-hall"
        label="Hall"
        value={form.hall}
        onChange={setField('hall')}
        placeholder="Hall A"
      />
      <SelectField
        id="m-fmt"
        label="Format"
        value={form.format}
        onChange={setField('format')}
        options={formatOpts}
      />
      <div className="field-group">
        <label htmlFor="m-time">Show Time</label>
        <input
          id="m-time"
          type="time"
          value={form.showTime}
          onChange={(event) => setField('showTime')(event.target.value)}
          style={{ colorScheme: 'dark' }}
        />
      </div>
      <InputField
        id="m-price"
        label="Ticket Price"
        value={form.ticketPrice}
        onChange={setField('ticketPrice')}
        placeholder="1800"
        type="number"
      />
      <SelectField
        id="m-status"
        label="Status"
        value={form.status}
        onChange={setField('status')}
        options={movieStatusOpts}
      />
      <div className="form-actions" style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem' }}>
        <button
          type="submit"
          className="btn btn-gold"
          style={{ flex: 1, justifyContent: 'center', minHeight: 44 }}
        >
          <Film size={15} /> {isEditing ? 'Update Movie & Showtime' : 'Save Movie & Showtime'}
        </button>
        {isEditing && (
          <button
            type="button"
            className="btn btn-ghost"
            style={{ padding: '0 1.5rem', background: 'var(--surface-light)' }}
            onClick={onCancel}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export function ServiceForm({ form, onChange, onSubmit }) {
  const setField = (key) => (value) => onChange((current) => ({ ...current, [key]: value }));

  return (
    <form className="form-grid" onSubmit={onSubmit}>
      <InputField
        id="s-name"
        label="Service Name"
        value={form.name}
        onChange={setField('name')}
        placeholder="Popcorn Combo"
      />
      <InputField
        id="s-category"
        label="Category"
        value={form.category}
        onChange={setField('category')}
        placeholder="Food & Beverage"
      />
      <InputField
        id="s-branch"
        label="Branch"
        value={form.branch}
        onChange={setField('branch')}
        placeholder="Colombo"
      />
      <InputField
        id="s-price"
        label="Price (LKR)"
        value={form.price}
        onChange={setField('price')}
        placeholder="850"
        type="number"
      />
      <SelectField
        id="s-status"
        label="Status"
        value={form.status}
        onChange={setField('status')}
        options={serviceStatusOpts}
      />
      <div className="form-actions">
        <button
          type="submit"
          className="btn btn-gold"
          style={{ width: '100%', justifyContent: 'center', minHeight: 44 }}
        >
          <ShoppingBag size={15} /> Save Service
        </button>
      </div>
    </form>
  );
}

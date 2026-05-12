import { Trash2, Film, ShoppingBag, Users, Ticket, Pencil, RefreshCw, Copy } from 'lucide-react';

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
  onRenew,
  onDuplicate,
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
            {onDelete || onEdit ? <th /> : null}
          </tr>
        </thead>
        <tbody>
          {movies.map((movie) => (
            <tr 
              key={movie.id} 
              className={movie.id === editingId ? 'row--editing' : ''}
              style={movie.id === editingId ? { 
                background: 'rgba(212, 175, 55, 0.12)', 
                boxShadow: 'inset 4px 0 0 #d4af37, 0 0 15px rgba(212, 175, 55, 0.1)',
                zIndex: 10,
                position: 'relative'
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
                  <strong>{movie.showDateDisplay || movie.showDate}</strong>
                  <span>{movie.showTime}</span>
                </div>
              </td>
              <td>
                <span>{movie.ticketsSold} tickets</span>
              </td>
              {onDelete || onEdit ? (
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {onDuplicate && (
                      <button
                        type="button"
                        className="btn btn-ghost"
                        style={{ padding: '0.3rem 0.6rem', minHeight: 'unset' }}
                        title="Duplicate"
                        onClick={() => onDuplicate(movie)}
                      >
                        <Copy size={14} />
                      </button>
                    )}
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
                        onClick={() => onDelete(movie.id, movie.movieId, movie.title, movie.allShowtimeIds)}
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
        <label htmlFor="m-date-start">Show Date (Start)</label>
        <input
          id="m-date-start"
          type="date"
          value={form.showDate}
          onChange={(event) => setField('showDate')(event.target.value)}
          style={{ colorScheme: 'dark' }}
        />
      </div>
      <div className="field-group">
        <label htmlFor="m-date-end">Show Date (End)</label>
        <input
          id="m-date-end"
          type="date"
          value={form.showDateEnd}
          onChange={(event) => setField('showDateEnd')(event.target.value)}
          style={{ colorScheme: 'dark' }}
        />
        <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
          Leave empty for single day
        </span>
      </div>
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

export function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, confirmLabel = 'Delete', confirmVariant = 'danger' }) {
  if (!isOpen) return null;

  return (
    <div 
      className="modal-overlay" 
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999, padding: '1rem',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={onCancel}
    >
      <div 
        className="modal-card" 
        style={{
          background: 'var(--surface)', border: '1px solid var(--surface-light)',
          borderRadius: '1.25rem', width: '100%', maxWidth: '400px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          overflow: 'hidden'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', color: 'var(--text)' }}>{title}</h3>
          <p style={{ color: 'var(--text-dim)', lineHeight: '1.5', fontSize: '0.9rem' }}>{message}</p>
        </div>
        <div style={{ 
          padding: '1.25rem 1.75rem', background: 'rgba(255,255,255,0.02)', 
          borderTop: '1px solid var(--surface-light)',
          display: 'flex', gap: '1rem', justifyContent: 'flex-end'
        }}>
          <button 
            className="btn btn-ghost" 
            onClick={onCancel}
            style={{ padding: '0.6rem 1.25rem', minHeight: 'unset' }}
          >
            Cancel
          </button>
          <button 
            className={`btn btn-${confirmVariant}`}
            onClick={onConfirm}
            style={{ padding: '0.6rem 1.25rem', minHeight: 'unset', fontWeight: '600' }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

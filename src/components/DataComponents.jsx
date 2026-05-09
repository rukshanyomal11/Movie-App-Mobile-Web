import { Badge, EmptyState, InputField, SelectField } from './UI.jsx';
import { Film, ShoppingBag, Users, Ticket } from 'lucide-react';

// ── FORMATTERS ──────────────────────────────────────────────────────────────
const moneyFmt = new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', maximumFractionDigits: 0 });
export function formatCurrency(n) { return moneyFmt.format(Number(n) || 0); }
export function formatStatusLabel(v) {
  return v.split('_').map(p => p[0].toUpperCase() + p.slice(1)).join(' ');
}

// ── MOVIES TABLE ─────────────────────────────────────────────────────────────
const movieStatusOpts = [
  { value: 'now_showing', label: 'Now Showing' },
  { value: 'featured',    label: 'Featured' },
  { value: 'upcoming',    label: 'Upcoming' },
  { value: 'paused',      label: 'Paused' },
];

export function MoviesTable({ movies, onStatusChange, compact }) {
  if (!movies.length) return <EmptyState icon={Film} message="No showtimes found for today." />;
  return (
    <div className="table-wrap">
      <table className={`data-table ${compact ? 'data-table--compact' : ''}`}>
        <thead>
          <tr>
            <th>Movie</th>
            <th>Venue</th>
            <th>Time</th>
            <th>Sold</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {movies.map(m => (
            <tr key={m.id}>
              <td>
                <strong>{m.title}</strong>
                <span>{m.genre} · {m.language}</span>
              </td>
              <td><span>{m.branch}</span><span>{m.hall} · {m.format}</span></td>
              <td><span>{m.showTime}</span></td>
              <td><span>{m.ticketsSold} tickets</span></td>
              <td>
                {onStatusChange ? (
                  <select
                    className="status-select"
                    style={{ width: 'auto', minWidth: 130, fontSize: '0.78rem' }}
                    value={m.status}
                    onChange={e => onStatusChange(m.movieId, e.target.value)}
                  >
                    {movieStatusOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                ) : (
                  <Badge status={m.status} />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── SERVICES TABLE ────────────────────────────────────────────────────────────
const serviceStatusOpts = [
  { value: 'active',      label: 'Active' },
  { value: 'inactive',    label: 'Inactive' },
  { value: 'maintenance', label: 'Maintenance' },
];

export function ServicesTable({ services, onStatusChange }) {
  if (!services.length) return <EmptyState icon={ShoppingBag} message="No services found." />;
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
          {services.map(s => (
            <tr key={s.id}>
              <td><strong>{s.name}</strong><span>{s.category}</span></td>
              <td><span>{s.branch}</span></td>
              <td><span>{formatCurrency(s.price)}</span></td>
              <td>
                {onStatusChange ? (
                  <select
                    className="status-select"
                    style={{ width: 'auto', minWidth: 130, fontSize: '0.78rem' }}
                    value={s.status}
                    onChange={e => onStatusChange(s.id, e.target.value)}
                  >
                    {serviceStatusOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                ) : (
                  <Badge status={s.status} />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── USERS TABLE ───────────────────────────────────────────────────────────────
export function UsersTable({ users }) {
  if (!users.length) return <EmptyState icon={Users} message="No customer accounts found." />;
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
          {users.map(u => (
            <tr key={u.id}>
              <td><strong>{u.name}</strong></td>
              <td><span>{u.email}</span></td>
              <td><span>{u.bookingsCount}</span></td>
              <td><span>{u.lastSeen}</span></td>
              <td><Badge status={u.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── BOOKINGS TABLE ────────────────────────────────────────────────────────────
export function BookingsTable({ bookings, compact }) {
  if (!bookings.length) return <EmptyState icon={Ticket} message="No bookings found." />;
  return (
    <div className="table-wrap">
      <table className={`data-table ${compact ? 'data-table--compact' : ''}`}>
        <thead>
          <tr>
            <th>Code</th>
            <th>Customer</th>
            {!compact && <th>Movie</th>}
            <th>Seats</th>
            <th>Total</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map(b => (
            <tr key={b.id}>
              <td><strong style={{ fontFamily: 'monospace', color: 'var(--gold)', fontSize: '0.8rem' }}>{b.code}</strong></td>
              <td><strong>{b.userName}</strong></td>
              {!compact && <td><span>{b.movieTitle}</span></td>}
              <td><span>{b.seats}</span></td>
              <td><span>{formatCurrency(b.total)}</span></td>
              <td><Badge status={b.bookingStatus} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── MOVIE FORM ────────────────────────────────────────────────────────────────
const formatOpts = [
  { value: '2D',   label: '2D' },
  { value: '3D',   label: '3D' },
  { value: 'IMAX', label: 'IMAX' },
];

export function MovieForm({ form, onChange, onSubmit }) {
  const set = key => val => onChange(cur => ({ ...cur, [key]: val }));
  return (
    <form className="form-grid" onSubmit={onSubmit}>
      <InputField id="m-title"   label="Movie Title"     value={form.title}       onChange={set('title')}       placeholder="Avengers: Endgame" />
      <InputField id="m-genre"   label="Genre"           value={form.genre}       onChange={set('genre')}       placeholder="Action" />
      <InputField id="m-lang"    label="Language"        value={form.language}    onChange={set('language')}    placeholder="English" />
      <InputField id="m-theater" label="Theater Branch"  value={form.theaterName} onChange={set('theaterName')} placeholder="Majestic Cinemas" />
      <InputField id="m-city"    label="City"            value={form.city}        onChange={set('city')}        placeholder="Colombo" />
      <InputField id="m-hall"    label="Hall"            value={form.hall}        onChange={set('hall')}        placeholder="Hall A" />
      <SelectField id="m-fmt"   label="Format"          value={form.format}      onChange={set('format')}      options={formatOpts} />
      <InputField id="m-time"    label="Show Time"       value={form.showTime}    onChange={set('showTime')}    placeholder="18:30" />
      <InputField id="m-price"   label="Ticket Price"    value={form.ticketPrice} onChange={set('ticketPrice')} placeholder="1800" type="number" />
      <SelectField id="m-status" label="Status"          value={form.status}      onChange={set('status')}      options={movieStatusOpts} />
      <div className="form-actions" style={{ gridColumn: '1 / -1' }}>
        <button type="submit" className="btn btn-gold" style={{ width: '100%', justifyContent: 'center', minHeight: 44 }}>
          <Film size={15} /> Save Movie &amp; Showtime
        </button>
      </div>
    </form>
  );
}

// ── SERVICE FORM ──────────────────────────────────────────────────────────────
export function ServiceForm({ form, onChange, onSubmit }) {
  const set = key => val => onChange(cur => ({ ...cur, [key]: val }));
  return (
    <form className="form-grid" onSubmit={onSubmit}>
      <InputField id="s-name"     label="Service Name" value={form.name}     onChange={set('name')}     placeholder="Popcorn Combo" />
      <InputField id="s-category" label="Category"     value={form.category} onChange={set('category')} placeholder="Food &amp; Beverage" />
      <InputField id="s-branch"   label="Branch"       value={form.branch}   onChange={set('branch')}   placeholder="Colombo" />
      <InputField id="s-price"    label="Price (LKR)"  value={form.price}    onChange={set('price')}    placeholder="850" type="number" />
      <SelectField id="s-status"  label="Status"       value={form.status}   onChange={set('status')}   options={serviceStatusOpts} />
      <div className="form-actions">
        <button type="submit" className="btn btn-gold" style={{ width: '100%', justifyContent: 'center', minHeight: 44 }}>
          <ShoppingBag size={15} /> Save Service
        </button>
      </div>
    </form>
  );
}

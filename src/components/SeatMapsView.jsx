import { useState, useMemo } from 'react';
import { SectionPanel, EmptyState } from './UI';
import { Grid, Calendar } from 'lucide-react';

export function SeatMapsView({ movies, bookings }) {
  const [selectedShowtimeId, setSelectedShowtimeId] = useState('');

  // Group movies by title and date
  const showtimes = useMemo(() => {
    return movies.filter(m => m.status === 'now_showing' || m.status === 'featured').map(m => ({
      ...m,
      label: `${m.title} — ${m.showDate} at ${m.showTime} (${m.hall})`
    }));
  }, [movies]);

  // Find the selected showtime
  const selectedShowtime = showtimes.find(s => s.id === selectedShowtimeId);

  // Extract booked seats for the selected showtime
  const bookedSeats = useMemo(() => {
    if (!selectedShowtimeId) return [];
    
    const showtimeBookings = bookings.filter(b => b.showtimeId === selectedShowtimeId && b.bookingStatus !== 'cancelled');
    
    const seats = [];
    showtimeBookings.forEach(booking => {
      if (booking.seats && typeof booking.seats === 'string') {
        const labels = booking.seats.split(', ').map(s => s.trim()).filter(Boolean);
        labels.forEach(label => {
          // Exclude the raw count format like "2 seat(s)" if it fallback
          if (!label.includes('seat(s)')) {
            seats.push(label);
          }
        });
      }
    });
    return seats;
  }, [selectedShowtimeId, bookings]);

  // Generate a dummy seat map (e.g., A-F rows, 1-10 cols) for visualization
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const cols = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  return (
    <SectionPanel title="Seat Maps" description="Select a showtime to view live booked seats." icon={Grid}>
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
          Select Showtime
        </label>
        <select 
          className="form-input" 
          value={selectedShowtimeId} 
          onChange={(e) => setSelectedShowtimeId(e.target.value)}
        >
          <option value="">-- Choose a showtime --</option>
          {showtimes.map(s => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
      </div>

      {selectedShowtime ? (
        <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--gold)' }}>{selectedShowtime.title}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              <Calendar size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
              {selectedShowtime.showDate} • {selectedShowtime.showTime} • {selectedShowtime.hall}
            </p>
            <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <span className="badge badge--paid">Sold: {selectedShowtime.ticketsSold}</span>
              <span className="badge badge--active">Available: {selectedShowtime.seatsLeft}</span>
            </div>
          </div>

          <div className="seat-map-legend" style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: 20, height: 20, background: 'var(--surface-light)', borderRadius: 4, border: '1px solid var(--line)' }}></div>
              <span style={{ fontSize: '0.78rem' }}>Available</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: 20, height: 20, background: 'var(--gold)', borderRadius: 4 }}></div>
              <span style={{ fontSize: '0.78rem' }}>Booked</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
            {/* Screen indicator */}
            <div style={{ width: '80%', height: 4, background: 'var(--gold)', borderRadius: 2, marginBottom: '2rem', opacity: 0.5, boxShadow: '0 4px 20px var(--gold)' }}></div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: 4, textTransform: 'uppercase', marginBottom: '1rem' }}>Screen</span>

            {rows.map(row => (
              <div key={row} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ width: 20, fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>{row}</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {cols.map(col => {
                    const seatLabel = `${row}${col}`;
                    const isBooked = bookedSeats.includes(seatLabel);
                    return (
                      <div 
                        key={col}
                        style={{
                          width: 28,
                          height: 28,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.65rem',
                          fontWeight: 600,
                          borderRadius: 6,
                          background: isBooked ? 'var(--gold)' : 'var(--surface-light)',
                          color: isBooked ? 'var(--bg)' : 'var(--text-muted)',
                          border: isBooked ? 'none' : '1px solid var(--line)',
                          cursor: 'default',
                          transition: 'all 0.2s ease',
                          opacity: (col === 5) ? 1 : 1, // Optional: add visual gap after col 5
                          marginRight: col === 5 ? '1rem' : 0
                        }}
                        title={`${seatLabel} ${isBooked ? '(Booked)' : '(Available)'}`}
                      >
                        {col}
                      </div>
                    );
                  })}
                </div>
                <span style={{ width: 20, fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>{row}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState icon={Grid} message="Please select a showtime above to view the seat map." />
      )}
    </SectionPanel>
  );
}

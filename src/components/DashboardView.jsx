import { Film, Ticket, Users, TrendingUp } from 'lucide-react';
import { SectionPanel, EmptyState } from './UI.jsx';
import { BookingsTable, formatCurrency } from './DataComponents.jsx';

export function DashboardView({ metrics, movies, services, users, bookings, topMovies }) {
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
        <SectionPanel title="Top Now Showing Movies" description="Ranked by tickets sold from the active movie board.">
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
            <EmptyState icon={Film} message="No now showing movies found." />
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

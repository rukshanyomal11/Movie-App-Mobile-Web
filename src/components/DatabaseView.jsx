import { Database } from 'lucide-react';
import { SectionPanel } from './UI.jsx';

export function DatabaseView() {
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

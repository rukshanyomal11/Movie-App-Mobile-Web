import { Film, LayoutDashboard, Ticket, Users, ShoppingBag, Database, LogOut } from 'lucide-react';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'movies',    label: 'Movie Schedule', icon: Film },
  { id: 'services',  label: 'Services', icon: ShoppingBag },
  { id: 'users',     label: 'App Users', icon: Users },
  { id: 'bookings',  label: 'Bookings', icon: Ticket },
  { id: 'database',  label: 'Database', icon: Database },
];

export function Sidebar({ activeView, onNavigate, adminProfile, onLogout }) {
  const initials = adminProfile?.name
    ? adminProfile.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'A';

  return (
    <aside className="sidebar">
      <div className="sidebar__inner">
        {/* Logo */}
        <div className="sidebar__logo">
          <div className="sidebar__logo-icon">
            <Film size={18} />
          </div>
          <div className="sidebar__brand-text">
            <span className="sidebar__title">CineBook</span>
            <span className="sidebar__sub">Admin Panel</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="sidebar__nav" aria-label="Admin navigation">
          <p className="sidebar__nav-label">Main Menu</p>
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={`nav-button ${activeView === id ? 'nav-button--active' : ''}`}
              onClick={() => onNavigate(id)}
            >
              <Icon size={16} className="nav-button__icon" />
              {label}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar__footer">
          <div className="sidebar__avatar">{initials}</div>
          <div className="sidebar__user">
            <p className="sidebar__user-name">{adminProfile?.name ?? 'Admin'}</p>
            <p className="sidebar__user-role">Administrator</p>
          </div>
          <button
            type="button"
            className="btn btn-ghost"
            style={{ padding: '0.4rem', minHeight: 'unset' }}
            onClick={onLogout}
            title="Sign out"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}

import { Calendar, RefreshCw } from 'lucide-react';
import { getTodayLabel, getViewTitle } from '../utils/dashboardUtils';

export function Topbar({ activeView, isSyncing, refreshDashboard }) {
  return (
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
  );
}

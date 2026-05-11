import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { SectionPanel } from './UI.jsx';
import { UsersTable } from './DataComponents.jsx';

export function UsersView({ 
  userSearchQuery, setUserSearchQuery, setShowSuggestions, 
  userSuggestions, setSelectedUserId, paginatedUsers, 
  totalUserPages, userPage, setUserPage 
}) {
  return (
    <div className="content-grid--wide">
      <SectionPanel 
        title="Customer Accounts" 
        description="Manage registered mobile app users."
        action={
          <div className="search-bar" style={{ width: '300px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', marginLeft: '10px', marginTop: '12px', color: 'var(--text-dim)' }} />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              value={userSearchQuery}
              onChange={(e) => {
                const val = e.target.value;
                setUserSearchQuery(val);
                setShowSuggestions(true);
                if (!val) setSelectedUserId(null);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              style={{ paddingLeft: '35px' }}
            />
            
            {userSuggestions.length > 0 && (
              <div className="search-suggestions">
                {userSuggestions.map(user => (
                  <div 
                    key={user.id}
                    className="suggestion-item"
                    onClick={() => {
                      setUserSearchQuery(user.name);
                      setSelectedUserId(user.id);
                      setShowSuggestions(false);
                    }}
                  >
                    <div className="suggestion-item__name">{user.name}</div>
                    <div className="suggestion-item__email">{user.email}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        }
      >
        <UsersTable users={paginatedUsers} />
        
        {totalUserPages > 1 && (
          <div className="pagination-controls" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem', borderTop: '1px solid var(--line)', paddingTop: '1.5rem' }}>
            <button 
              className="btn btn-ghost" 
              disabled={userPage === 1}
              onClick={() => setUserPage(p => Math.max(1, p - 1))}
            >
              <ChevronLeft size={16} /> Previous
            </button>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Page <strong>{userPage}</strong> of {totalUserPages}
            </span>
            <button 
              className="btn btn-ghost" 
              disabled={userPage === totalUserPages}
              onClick={() => setUserPage(p => Math.min(totalUserPages, p + 1))}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        )}
      </SectionPanel>
    </div>
  );
}

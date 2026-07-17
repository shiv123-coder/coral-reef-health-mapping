import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <aside className="sidebar" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '24px 20px', background: 'var(--bg)', borderRight: '1px solid var(--card-border)', position: 'relative', overflow: 'hidden' }}>
      <style>{`
        .nav a { display: flex; alignItems: center; gap: 12px; padding: 12px 16px; border-radius: 12px; color: var(--text-dim); font-size: 14.5px; font-weight: 500; transition: background .2s, color .2s; text-decoration: none; align-items: center; }
        .nav a:hover { background: rgba(255,255,255,0.03); color: var(--text); }
        .nav a.active { background: linear-gradient(90deg, rgba(59,158,255,0.15), rgba(79,214,232,0.05)); color: var(--cyan); border: 1px solid rgba(79,214,232,0.2); }
      `}</style>
      <div className="sb-logo" style={{ marginBottom: 40, paddingLeft: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" style={{ marginBottom: 12 }}><path d="M12 2C9 2 7 5 7 8c0 2 1 3 1 5 0 3-2 4-2 7 0 1 1 2 2 2s2-1 2-2c0-2 1-3 2-3s2 1 2 3c0 1 1 2 2 2s2-1 2-2c0-3-2-4-2-7 0-2 1-3 1-5 0-3-2-6-5-6z" fill="url(#sg)"/><defs><linearGradient id="sg" x1="7" y1="2" x2="17" y2="22"><stop stopColor="#4fd6e8"/><stop offset="1" stopColor="#3b7dff"/></linearGradient></defs></svg>
          <div><h1 style={{ fontSize: 18, fontWeight: 800 }}>Coral<span style={{ background: 'linear-gradient(90deg,#7dd8ff,#4fd6e8)', WebkitBackgroundClip: 'text', color: 'transparent' }}>AI</span></h1><div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 1 }}>Coral Reef Health Analyzer</div></div>
        </div>
        <ThemeToggle />
      </div>

      <nav className="nav" style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        <Link to="/dashboard" className={location.pathname === '/dashboard' ? 'active' : ''}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
          Dashboard
        </Link>
        <Link to="/upload" className={location.pathname === '/upload' ? 'active' : ''}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 3v4a1 1 0 001 1h4"/><path d="M17 21H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z"/><path d="M9 13h6M9 17h4"/></svg>
          New Analysis
        </Link>
        <Link to="/history" className={location.pathname === '/history' ? 'active' : ''}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
          History
        </Link>
        <Link to="/map" className={location.pathname === '/map' ? 'active' : ''}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 21s-7-4.6-9-9.3C1.6 8 3.4 5 6.6 5c1.8 0 3 .9 3.9 2.2C11.4 5.9 12.6 5 14.4 5c3.2 0 5 3 3.6 6.7-2 4.7-9 9.3-9 9.3z"/><path d="M9 12l2 2 4-4"/></svg>
          Reef Map
        </Link>
        <Link to="/settings" className={location.pathname === '/settings' ? 'active' : ''}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
          Settings
        </Link>
        {user?.email?.includes('admin') && (
          <Link to="/admin" className={location.pathname === '/admin' ? 'active' : ''}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 6-9 12-9 12S3 16 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
            Admin Panel
          </Link>
        )}
      </nav>

      <div className="user-card" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, borderRadius: 12, background: 'rgba(255,255,255,0.02)', margin: '0 4px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', flex: 'none', background: 'linear-gradient(135deg, #3b7dff, #4fd6e8)' }}></div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.displayName || 'Coral User'}</div>
          <div style={{ fontSize: 11, color: 'var(--text-faint)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
        </div>
        <button 
          onClick={logout} 
          style={{ background: 'transparent', border: 'none', color: 'var(--text-faint)', cursor: 'pointer', padding: 6, display: 'flex', alignItems: 'center', borderRadius: 8, transition: 'all 0.2s', marginLeft: 'auto' }}
          title="Log out"
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-faint)'; e.currentTarget.style.background = 'transparent'; }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
        </button>
      </div>
      <div style={{ position: 'absolute', bottom: -10, right: -20, opacity: .12, fontSize: 130, pointerEvents: 'none', transform: 'rotate(-8deg)' }}>🐢</div>
    </aside>
  );
}

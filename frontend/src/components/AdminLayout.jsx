import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth } from '../firebase';

export default function AdminLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/admin/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100vw', fontFamily: '"Inter", "Segoe UI", sans-serif', background: '#020617', color: '#f8fafc', overflow: 'hidden' }}>
      
      {/* Admin Sidebar */}
      <aside style={{ width: 260, background: '#0f172a', borderRight: '1px solid #1e293b', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '24px 20px', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, background: '#ef4444', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, letterSpacing: '-0.5px' }}>CoralAI <span style={{ color: '#ef4444' }}>Admin</span></h1>
        </div>

        <nav style={{ padding: '20px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#64748b', marginBottom: 8, paddingLeft: 8 }}>Overview</div>
          
          <NavLink to="/admin" end style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 6, textDecoration: 'none',
            fontSize: 14, fontWeight: 500, transition: 'all 0.2s',
            background: isActive ? '#1e293b' : 'transparent',
            color: isActive ? '#f8fafc' : '#94a3b8',
            borderLeft: isActive ? '3px solid #ef4444' : '3px solid transparent'
          })}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>
            System Dashboard
          </NavLink>

          {/* Add more admin routes here in the future like /admin/users, /admin/settings */}
        </nav>

        <div style={{ padding: '20px 16px', borderTop: '1px solid #1e293b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#cbd5e1' }}>
              {user?.email?.[0].toUpperCase() || 'A'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#f8fafc', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>System Administrator</div>
              <div style={{ fontSize: 11, color: '#64748b', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{user?.email}</div>
            </div>
          </div>
          <button onClick={handleLogout} style={{ width: '100%', padding: '8px', background: 'transparent', border: '1px solid #334155', color: '#cbd5e1', borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s' }} onMouseOver={(e) => {e.target.style.background = '#1e293b'; e.target.style.color = '#f8fafc'}} onMouseOut={(e) => {e.target.style.background = 'transparent'; e.target.style.color = '#cbd5e1'}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            End Session
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Top Navbar */}
        <header style={{ height: 64, background: '#0f172a', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#64748b' }}>Admin</span>
            <span>/</span>
            <span style={{ color: '#ef4444' }}>System Dashboard</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ padding: '6px 12px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: 20, fontSize: 12, fontWeight: 600, color: '#10b981', display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }}></div>
              System Healthy
            </div>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 32 }}>
          <Outlet />
        </div>
      </main>

    </div>
  );
}

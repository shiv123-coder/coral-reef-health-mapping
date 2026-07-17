import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Waves, LogOut } from 'lucide-react';

export default function Navbar() {
  const { profile, logout, isAdmin } = useAuth();
  const location = useLocation();

  const links = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/upload', label: 'Upload' },
    { to: '/live', label: 'Live Scan' },
    { to: '/map', label: 'Reef Map' },
    { to: '/history', label: 'History' },
  ];
  if (isAdmin) links.push({ to: '/admin', label: 'Admin' });

  return (
    <nav className="navbar">
      <Link to="/dashboard" className="nav-brand">
        <Waves size={24} /> CoralReef AI
      </Link>
      <div className="nav-links">
        {links.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className={`nav-link ${location.pathname === l.to ? 'active' : ''}`}
          >
            {l.label}
          </Link>
        ))}
        {profile && (
          <span style={{ color: '#94a3b8', fontSize: '0.85rem', marginLeft: 8 }}>
            {profile.firstName} ({profile.role})
          </span>
        )}
        <button className="btn btn-ghost" onClick={logout} style={{ padding: '8px 12px' }}>
          <LogOut size={16} />
        </button>
      </div>
    </nav>
  );
}

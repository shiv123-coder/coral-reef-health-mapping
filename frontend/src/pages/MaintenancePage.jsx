import { Link } from 'react-router-dom';

export default function MaintenancePage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#020617', color: 'var(--text)', padding: 24, textAlign: 'center' }}>
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5" style={{ marginBottom: 24 }}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <h1 style={{ fontSize: 32, fontWeight: 700, margin: '0 0 12px 0' }}>System Maintenance</h1>
      <p style={{ fontSize: 16, color: 'var(--text-faint)', maxWidth: 500, lineHeight: 1.6, marginBottom: 32 }}>
        CoralAI is currently undergoing scheduled maintenance or an emergency system update. All non-administrative access has been temporarily disabled.
      </p>
      <p style={{ fontSize: 14, color: 'var(--text-dim)', maxWidth: 500, marginBottom: 32 }}>
        Please check back later. We apologize for the inconvenience.
      </p>
      <Link to="/login" style={{ padding: '12px 24px', background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text)', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: 14, transition: 'all 0.2s' }}>
        Return to Login
      </Link>
    </div>
  );
}

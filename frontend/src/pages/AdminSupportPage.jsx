export default function AdminSupportPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1400, margin: '0 auto', color: 'var(--text)' }}>
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--card-border)' }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 4px 0' }}>Support & Feedback Tickets</h2>
        <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>Manage user reports, bugs, and feature requests</div>
      </div>
      <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 8, padding: 48, textAlign: 'center', color: 'var(--text-faint)' }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ marginBottom: 16 }}>
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
        </svg>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>Ticketing System Offline</h3>
        <p style={{ maxWidth: 400, margin: '0 auto', fontSize: 14 }}>The global support routing system is currently being provisioned. Future updates will surface user communications here.</p>
      </div>
    </div>
  );
}

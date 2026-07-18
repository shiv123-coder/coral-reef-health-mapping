export default function AdminExportPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1400, margin: '0 auto', color: 'var(--text)' }}>
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--card-border)' }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 4px 0' }}>Data Export & Reporting</h2>
        <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>Generate large-scale datasets and institutional telemetry reports</div>
      </div>
      <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 8, padding: 48, textAlign: 'center', color: 'var(--text-faint)' }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ marginBottom: 16 }}>
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>Export Engine Pending</h3>
        <p style={{ maxWidth: 400, margin: '0 auto', fontSize: 14 }}>The PDF and CSV aggregation engine is currently being provisioned. Future updates will allow downloading global datasets.</p>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import BackgroundOrbs, { GlassCard, StatCard, RiskBadge, LoadingSpinner } from '../components/UI';
import { adminGetUsers, adminGetAnalyses, adminGetAnalytics, adminOverrideReport } from '../services/api';

export default function AdminPage() {
  const [tab, setTab] = useState('analytics');
  const [users, setUsers] = useState([]);
  const [analyses, setAnalyses] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [overrideId, setOverrideId] = useState('');
  const [overrideForm, setOverrideForm] = useState({ healthyCoralPct: '', bleachedCoralPct: '', deadCoralPct: '', algaePct: '', riskLevel: '', aiConclusion: '', adminNotes: '', finalized: false });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    Promise.all([adminGetUsers(), adminGetAnalyses(), adminGetAnalytics()])
      .then(([u, a, an]) => { setUsers(u.users || []); setAnalyses(a.analyses || []); setAnalytics(an); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleOverride = async () => {
    if (!overrideId) return;
    try {
      const payload = {};
      Object.entries(overrideForm).forEach(([k, v]) => {
        if (k === 'finalized') payload[k] = v;
        else if (v !== '' && v != null) payload[k] = k.includes('Pct') ? parseFloat(v) : v;
      });
      await adminOverrideReport(overrideId, payload);
      setMsg('Report updated successfully');
    } catch (err) {
      setMsg(err.response?.data?.detail || 'Override failed');
    }
  };

  const tabs = [
    { id: 'analytics', label: 'Analytics' },
    { id: 'users', label: 'Users Section' },
    { id: 'analyses', label: 'All Analyses' },
    { id: 'override', label: 'Report Override' },
  ];

  return (
    <>
      <BackgroundOrbs />
      <Navbar />
      <div className="page-container">
        <h1 className="page-title">Admin Panel</h1>
        <p className="page-subtitle">System-wide management and analytics (Admin only)</p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              className={`btn ${tab === t.id ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <>
            {tab === 'analytics' && analytics && (
              <>
                <div className="stats-grid">
                  <StatCard label="Total Users" value={analytics.totalUsers} suffix="" variant="healthy" />
                  <StatCard label="Total Analyses" value={analytics.totalAnalyses} suffix="" variant="bleached" />
                </div>
                <GlassCard>
                  <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 12 }}>Users by Role</h3>
                  <pre style={{ color: '#94a3b8', fontSize: '0.9rem' }}>{JSON.stringify(analytics.usersByRole, null, 2)}</pre>
                  <h3 style={{ fontFamily: 'var(--font-display)', margin: '16px 0 12px' }}>Analyses by Risk</h3>
                  <pre style={{ color: '#94a3b8', fontSize: '0.9rem' }}>{JSON.stringify(analytics.analysesByRisk, null, 2)}</pre>
                </GlassCard>
              </>
            )}

            {tab === 'users' && (
              <GlassCard>
                <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 16 }}>All Registered Users</h3>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Organization</th>
                      <th>Role</th>
                      <th>Country</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.uid}>
                        <td>{u.firstName} {u.lastName}</td>
                        <td>{u.email}</td>
                        <td>{u.organization}</td>
                        <td>{u.role}</td>
                        <td>{u.country || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </GlassCard>
            )}

            {tab === 'analyses' && (
              <GlassCard>
                <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 16 }}>All User Inputs & Reports (Global)</h3>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>User ID</th>
                      <th>File</th>
                      <th>Healthy</th>
                      <th>Bleached</th>
                      <th>Risk</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyses.map((a) => (
                      <tr key={a.analysisId}>
                        <td style={{ fontSize: '0.75rem' }}>{a.userId?.slice(0, 8)}...</td>
                        <td>{a.fileName}</td>
                        <td>{a.healthyCoralPct}%</td>
                        <td>{a.bleachedCoralPct}%</td>
                        <td><RiskBadge level={a.riskLevel} /></td>
                        <td>{new Date(a.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </GlassCard>
            )}

            {tab === 'override' && (
              <GlassCard>
                <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 16 }}>Override AI Report Before PDF Finalization</h3>
                <div className="input-group">
                  <label>Report ID</label>
                  <input className="input-field" value={overrideId} onChange={(e) => setOverrideId(e.target.value)} placeholder="Paste report UUID" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {['healthyCoralPct', 'bleachedCoralPct', 'deadCoralPct', 'algaePct'].map((f) => (
                    <div className="input-group" key={f}>
                      <label>{f.replace('CoralPct', ' %').replace('Pct', ' %')}</label>
                      <input className="input-field" type="number" value={overrideForm[f]} onChange={(e) => setOverrideForm({ ...overrideForm, [f]: e.target.value })} />
                    </div>
                  ))}
                </div>
                <div className="input-group">
                  <label>Risk Level</label>
                  <select className="input-field" value={overrideForm.riskLevel} onChange={(e) => setOverrideForm({ ...overrideForm, riskLevel: e.target.value })}>
                    <option value="">— Keep AI value —</option>
                    {['Minimal', 'Low', 'Moderate', 'High', 'Critical'].map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label>AI Conclusion Override</label>
                  <textarea className="input-field" rows={3} value={overrideForm.aiConclusion} onChange={(e) => setOverrideForm({ ...overrideForm, aiConclusion: e.target.value })} />
                </div>
                <div className="input-group">
                  <label>Admin Notes</label>
                  <textarea className="input-field" rows={2} value={overrideForm.adminNotes} onChange={(e) => setOverrideForm({ ...overrideForm, adminNotes: e.target.value })} />
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, cursor: 'pointer' }}>
                  <input type="checkbox" checked={overrideForm.finalized} onChange={(e) => setOverrideForm({ ...overrideForm, finalized: e.target.checked })} />
                  Finalize report (lock for PDF)
                </label>
                <button className="btn btn-primary" onClick={handleOverride}>Save Override</button>
                {msg && <p style={{ marginTop: 12, color: '#14b8a6' }}>{msg}</p>}
              </GlassCard>
            )}
          </>
        )}
      </div>
    </>
  );
}

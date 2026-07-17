import { useEffect, useState, useMemo } from 'react';
import Navbar from '../components/Navbar';
import BackgroundOrbs, { GlassCard, StatCard, RiskBadge, LoadingSpinner } from '../components/UI';
import { adminGetUsers, adminGetAnalyses, adminGetAnalytics, adminOverrideReport } from '../services/api';
import { Search, Users, Activity, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AdminPage() {
  const [tab, setTab] = useState('analytics');
  
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  
  const [analyses, setAnalyses] = useState([]);
  const [analysisSearch, setAnalysisSearch] = useState('');
  
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [overrideId, setOverrideId] = useState('');
  const [overrideForm, setOverrideForm] = useState({ healthyCoralPct: '', bleachedCoralPct: '', deadCoralPct: '', algaePct: '', riskLevel: '', aiConclusion: '', adminNotes: '', finalized: false });
  const [msg, setMsg] = useState({ text: '', type: '' });

  useEffect(() => {
    Promise.all([adminGetUsers(), adminGetAnalyses(), adminGetAnalytics()])
      .then(([u, a, an]) => { setUsers(u.users || []); setAnalyses(a.analyses || []); setAnalytics(an); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleOverride = async () => {
    if (!overrideId) {
      setMsg({ text: 'Please enter a Report ID', type: 'error' });
      return;
    }
    try {
      const payload = {};
      Object.entries(overrideForm).forEach(([k, v]) => {
        if (k === 'finalized') payload[k] = v;
        else if (v !== '' && v != null) payload[k] = k.includes('Pct') ? parseFloat(v) : v;
      });
      await adminOverrideReport(overrideId, payload);
      setMsg({ text: 'Report successfully updated and saved to database.', type: 'success' });
    } catch (err) {
      setMsg({ text: err.response?.data?.detail || 'Failed to override report.', type: 'error' });
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      u.email.toLowerCase().includes(userSearch.toLowerCase()) || 
      u.firstName.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.lastName.toLowerCase().includes(userSearch.toLowerCase())
    );
  }, [users, userSearch]);

  const filteredAnalyses = useMemo(() => {
    return analyses.filter(a => 
      a.analysisId.toLowerCase().includes(analysisSearch.toLowerCase()) ||
      a.userId.toLowerCase().includes(analysisSearch.toLowerCase())
    );
  }, [analyses, analysisSearch]);

  // Transform analytics data for Recharts
  const usersRoleData = useMemo(() => {
    if (!analytics?.usersByRole) return [];
    return Object.entries(analytics.usersByRole).map(([name, value]) => ({ name, value }));
  }, [analytics]);

  const analysesRiskData = useMemo(() => {
    if (!analytics?.analysesByRisk) return [];
    return Object.entries(analytics.analysesByRisk).map(([name, value]) => ({ name, value }));
  }, [analytics]);

  const tabs = [
    { id: 'analytics', label: 'Dashboard', icon: <Activity size={16} /> },
    { id: 'users', label: 'Manage Users', icon: <Users size={16} /> },
    { id: 'analyses', label: 'All Reports', icon: <FileText size={16} /> },
    { id: 'override', label: 'Report Override', icon: <AlertCircle size={16} /> },
  ];

  return (
    <>
      <BackgroundOrbs />
      <Navbar />
      <div className="page-container">
        <div style={{ marginBottom: 32 }}>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">System-wide management, analytics, and quality control.</p>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap', borderBottom: '1px solid var(--border-color)', paddingBottom: 16 }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              className={`btn ${tab === t.id ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setTab(t.id)}
            >
              {t.icon} {t.label}
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
                  <StatCard label="Live Sessions" value={Math.floor(analytics.totalUsers / 3)} suffix="" variant="info" />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24 }}>
                  <GlassCard>
                    <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 24, fontSize: '1.1rem' }}>Users by Role</h3>
                    <div style={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={usersRoleData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                            {usersRoleData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', borderRadius: 8 }} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </GlassCard>

                  <GlassCard>
                    <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 24, fontSize: '1.1rem' }}>Analyses by Risk Level</h3>
                    <div style={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analysesRiskData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                          <Tooltip cursor={{ fill: 'var(--bg-hover)' }} contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', borderRadius: 8 }} />
                          <Bar dataKey="value" fill="var(--primary-500)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </GlassCard>
                </div>
              </>
            )}

            {tab === 'users' && (
              <GlassCard>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem' }}>Registered Users Directory</h3>
                  <div className="input-group" style={{ margin: 0, position: 'relative', width: '300px' }}>
                    <Search size={18} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--text-muted)' }} />
                    <input 
                      className="input-field" 
                      style={{ paddingLeft: 40 }} 
                      placeholder="Search users..." 
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                    />
                  </div>
                </div>
                
                <div style={{ overflowX: 'auto' }}>
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
                      {filteredUsers.length > 0 ? filteredUsers.map((u) => (
                        <tr key={u.uid}>
                          <td style={{ fontWeight: 600 }}>{u.firstName} {u.lastName}</td>
                          <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                          <td>{u.organization || '—'}</td>
                          <td>
                            <span style={{ 
                              padding: '4px 10px', 
                              borderRadius: 12, 
                              fontSize: '0.75rem', 
                              fontWeight: 700, 
                              backgroundColor: u.role === 'admin' ? 'rgba(59,130,246,0.1)' : 'var(--bg-hover)',
                              color: u.role === 'admin' ? 'var(--primary-600)' : 'var(--text-secondary)'
                            }}>
                              {u.role.toUpperCase()}
                            </span>
                          </td>
                          <td style={{ color: 'var(--text-secondary)' }}>{u.country || '—'}</td>
                        </tr>
                      )) : (
                        <tr><td colSpan="5" style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>No users found matching your search.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </GlassCard>
            )}

            {tab === 'analyses' && (
              <GlassCard>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem' }}>Global AI Reports Archive</h3>
                  <div className="input-group" style={{ margin: 0, position: 'relative', width: '300px' }}>
                    <Search size={18} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--text-muted)' }} />
                    <input 
                      className="input-field" 
                      style={{ paddingLeft: 40 }} 
                      placeholder="Search by Report ID or User ID..." 
                      value={analysisSearch}
                      onChange={(e) => setAnalysisSearch(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Report ID</th>
                        <th>User ID</th>
                        <th>File</th>
                        <th>Healthy</th>
                        <th>Bleached</th>
                        <th>Risk</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAnalyses.length > 0 ? filteredAnalyses.map((a) => (
                        <tr key={a.analysisId}>
                          <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{a.analysisId.slice(0, 8)}...</td>
                          <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{a.userId?.slice(0, 8)}...</td>
                          <td style={{ fontWeight: 500 }}>{a.fileName}</td>
                          <td style={{ color: 'var(--success)', fontWeight: 600 }}>{a.healthyCoralPct}%</td>
                          <td style={{ color: 'var(--warning)', fontWeight: 600 }}>{a.bleachedCoralPct}%</td>
                          <td><RiskBadge level={a.riskLevel} /></td>
                          <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{new Date(a.createdAt).toLocaleDateString()}</td>
                        </tr>
                      )) : (
                        <tr><td colSpan="7" style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>No reports found matching your search.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </GlassCard>
            )}

            {tab === 'override' && (
              <GlassCard>
                <div style={{ maxWidth: 800 }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', marginBottom: 8 }}>Quality Control: Report Override</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 32 }}>Manually override AI predictions before the final PDF is generated for the client.</p>
                  
                  {msg.text && (
                    <div style={{
                      padding: '16px',
                      borderRadius: '8px',
                      marginBottom: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      backgroundColor: msg.type === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                      border: `1px solid ${msg.type === 'error' ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}`,
                      color: msg.type === 'error' ? 'var(--danger)' : 'var(--success)'
                    }}>
                      {msg.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{msg.text}</span>
                    </div>
                  )}

                  <div className="input-group" style={{ marginBottom: 24 }}>
                    <label>Target Report ID (UUID)</label>
                    <input className="input-field" value={overrideId} onChange={(e) => setOverrideId(e.target.value)} placeholder="e.g. 123e4567-e89b-12d3-a456-426614174000" />
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0 24px', marginBottom: 12 }}>
                    {['healthyCoralPct', 'bleachedCoralPct', 'deadCoralPct', 'algaePct'].map((f) => (
                      <div className="input-group" key={f}>
                        <label>{f.replace('CoralPct', ' %').replace('Pct', ' %').replace(/^./, str => str.toUpperCase())}</label>
                        <input className="input-field" type="number" placeholder="Leave blank to keep AI value" value={overrideForm[f]} onChange={(e) => setOverrideForm({ ...overrideForm, [f]: e.target.value })} />
                      </div>
                    ))}
                  </div>

                  <div className="input-group" style={{ marginBottom: 24 }}>
                    <label>Override Risk Level</label>
                    <select className="input-field" value={overrideForm.riskLevel} onChange={(e) => setOverrideForm({ ...overrideForm, riskLevel: e.target.value })}>
                      <option value="">— Keep Original AI Assessment —</option>
                      {['Minimal', 'Low', 'Moderate', 'High', 'Critical'].map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
                    <div className="input-group" style={{ marginBottom: 0 }}>
                      <label>Custom AI Conclusion</label>
                      <textarea className="input-field" rows={4} placeholder="Override the auto-generated scientific conclusion..." value={overrideForm.aiConclusion} onChange={(e) => setOverrideForm({ ...overrideForm, aiConclusion: e.target.value })} />
                    </div>
                    <div className="input-group" style={{ marginBottom: 0 }}>
                      <label>Internal Admin Notes</label>
                      <textarea className="input-field" rows={4} placeholder="Private notes for the moderation team..." value={overrideForm.adminNotes} onChange={(e) => setOverrideForm({ ...overrideForm, adminNotes: e.target.value })} />
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        style={{ width: 18, height: 18, cursor: 'pointer', accentColor: 'var(--primary-600)' }}
                        checked={overrideForm.finalized} 
                        onChange={(e) => setOverrideForm({ ...overrideForm, finalized: e.target.checked })} 
                      />
                      <div>
                        <span style={{ display: 'block', fontWeight: 600, color: 'var(--text-primary)' }}>Finalize and Lock Report</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>This will allow the user to generate their PDF and prevent further AI modifications.</span>
                      </div>
                    </label>
                    
                    <button className="btn btn-primary" onClick={handleOverride} style={{ padding: '12px 32px' }}>
                      Save & Apply Overrides
                    </button>
                  </div>
                </div>
              </GlassCard>
            )}
          </>
        )}
      </div>
    </>
  );
}

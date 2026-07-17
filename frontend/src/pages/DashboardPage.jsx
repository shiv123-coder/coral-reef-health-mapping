import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { UploadCloud, Radio, Activity, AlertTriangle, Droplet, Wind, FileText } from 'lucide-react';
import Navbar from '../components/Navbar';
import BackgroundOrbs, { StatCard, GlassCard, RiskBadge, LoadingSpinner } from '../components/UI';
import { getDashboardStats } from '../services/api';

const COLORS = ['#10b981', '#f59e0b', '#64748b', '#0ea5e9'];

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const chartData = stats ? [
    { name: 'Healthy', value: stats.healthyCoralPct || 0 },
    { name: 'Bleached', value: stats.bleachedCoralPct || 0 },
    { name: 'Dead', value: stats.deadCoralPct || 0 },
    { name: 'Algae', value: stats.algaePct || 0 },
  ] : [];

  // Generate synthetic sparkline data based on history for the "Command Center" look
  const sparklineData = useMemo(() => {
    if (!stats?.history || stats.history.length === 0) return [];
    return [...stats.history].reverse().map((h, i) => ({
      name: `T-${stats.history.length - i}`,
      healthy: h.healthyCoralPct,
      bleached: h.bleachedCoralPct,
      riskScore: h.riskLevel === 'Critical' ? 100 : h.riskLevel === 'High' ? 80 : h.riskLevel === 'Moderate' ? 50 : 20
    }));
  }, [stats]);

  return (
    <>
      <BackgroundOrbs />
      <Navbar />
      <div className="page-container" style={{ maxWidth: 1400 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24, borderBottom: '1px solid var(--border-color)', paddingBottom: 16 }}>
          <div>
            <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Activity size={28} color="var(--primary-500)" />
              Reef Observatory Command Center
            </h1>
            <p className="page-subtitle" style={{ margin: 0 }}>Real-time telemetry and AI-driven longitudinal analysis</p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Link to="/upload" className="btn btn-primary" style={{ textDecoration: 'none', padding: '8px 16px', fontSize: '0.85rem' }}>
              <UploadCloud size={16} /> Batch Upload Data
            </Link>
            <Link to="/live" className="btn btn-ghost" style={{ textDecoration: 'none', padding: '8px 16px', fontSize: '0.85rem', border: '1px solid var(--border-color)' }}>
              <Radio size={16} color="var(--danger)" /> Connect Drone Feed
            </Link>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner text="Initializing Observatory Datasets..." />
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
              <StatCard label="Global Healthy Index" value={stats?.healthyCoralPct ?? 0} variant="healthy" icon={<Droplet size={24} opacity={0.5} />} />
              <StatCard label="Bleaching Severity" value={stats?.bleachedCoralPct ?? 0} variant="bleached" icon={<AlertTriangle size={24} opacity={0.5} />} />
              <StatCard label="Algal Bloom Coverage" value={stats?.algaePct ?? 0} variant="info" icon={<Wind size={24} opacity={0.5} />} />
              <StatCard label="Total Surveys Processed" value={stats?.totalAnalyses ?? 0} suffix="" variant="default" icon={<FileText size={24} opacity={0.5} />} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 24, marginBottom: 24 }}>
              {/* Complex Area Chart for Time-Series */}
              <GlassCard style={{ padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', margin: 0 }}>Longitudinal Health Trending</h3>
                  <span className="badge badge-low">Live Model Data</span>
                </div>
                {sparklineData.length > 1 ? (
                  <div style={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={sparklineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorHealthy" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--success)" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="var(--success)" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorBleached" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--warning)" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="var(--warning)" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                        <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', borderRadius: 8, color: 'var(--text-primary)' }} />
                        <Area type="monotone" dataKey="healthy" name="Healthy Coral %" stroke="var(--success)" strokeWidth={2} fillOpacity={1} fill="url(#colorHealthy)" />
                        <Area type="monotone" dataKey="bleached" name="Bleached Coral %" stroke="var(--warning)" strokeWidth={2} fillOpacity={1} fill="url(#colorBleached)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <p style={{ color: 'var(--text-muted)' }}>Insufficient data for longitudinal analysis. Upload more surveys.</p>
                  </div>
                )}
              </GlassCard>

              {/* High Density Composition Pie */}
              <GlassCard style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: 24 }}>Benthic Composition</h3>
                {stats?.totalAnalyses > 0 ? (
                  <div style={{ flex: 1, position: 'relative' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={chartData} cx="50%" cy="50%" innerRadius={80} outerRadius={120} dataKey="value" stroke="var(--bg-card)" strokeWidth={2} paddingAngle={2}>
                          {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', borderRadius: 8, color: 'var(--text-primary)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>{stats.healthyCoralPct}%</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Avg Health</div>
                    </div>
                  </div>
                ) : (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <p style={{ color: 'var(--text-muted)' }}>No composition data.</p>
                  </div>
                )}
              </GlassCard>
            </div>

            {/* Dense Data Log */}
            <GlassCard>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', margin: 0 }}>Recent Survey Logs (Global Network)</h3>
                <Link to="/history" style={{ fontSize: '0.85rem', color: 'var(--primary-500)', textDecoration: 'none', fontWeight: 600 }}>View Complete Archive →</Link>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table" style={{ fontSize: '0.85rem' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '8px 12px' }}>Survey ID</th>
                      <th style={{ padding: '8px 12px' }}>Source Node</th>
                      <th style={{ padding: '8px 12px' }}>Healthy</th>
                      <th style={{ padding: '8px 12px' }}>Bleached</th>
                      <th style={{ padding: '8px 12px' }}>Algae</th>
                      <th style={{ padding: '8px 12px' }}>Risk Assessment</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats?.history?.slice(0, 6).map((h) => (
                      <tr key={h.analysisId}>
                        <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>#{h.analysisId.slice(0, 6).toUpperCase()}</td>
                        <td style={{ padding: '10px 12px', fontWeight: 600 }}>{h.fileName}</td>
                        <td style={{ padding: '10px 12px', color: 'var(--success)', fontWeight: 600 }}>{h.healthyCoralPct}%</td>
                        <td style={{ padding: '10px 12px', color: 'var(--warning)', fontWeight: 600 }}>{h.bleachedCoralPct}%</td>
                        <td style={{ padding: '10px 12px', color: 'var(--info)' }}>{h.algaePct}%</td>
                        <td style={{ padding: '10px 12px' }}><RiskBadge level={h.riskLevel} /></td>
                        <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', textAlign: 'right' }}>{new Date(h.createdAt).toLocaleString()}</td>
                      </tr>
                    )) || <tr><td colSpan="7" style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>No telemetry received.</td></tr>}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          </>
        )}
      </div>
    </>
  );
}

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import Navbar from '../components/Navbar';
import BackgroundOrbs, { StatCard, GlassCard, RiskBadge, LoadingSpinner } from '../components/UI';
import { getDashboardStats } from '../services/api';

const COLORS = ['#22c55e', '#fbbf24', '#94a3b8', '#4ade80'];

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

  return (
    <>
      <BackgroundOrbs />
      <Navbar />
      <div className="page-container">
        <h1 className="page-title">Reef Health Dashboard</h1>
        <p className="page-subtitle">Your personal coral reef analysis overview</p>

        {loading ? (
          <LoadingSpinner text="Loading dashboard..." />
        ) : (
          <>
            <div className="stats-grid">
              <StatCard label="Healthy Coral" value={stats?.healthyCoralPct ?? 0} variant="healthy" />
              <StatCard label="Bleached Coral" value={stats?.bleachedCoralPct ?? 0} variant="bleached" />
              <StatCard label="Dead Coral" value={stats?.deadCoralPct ?? 0} variant="dead" />
              <StatCard label="Algae Coverage" value={stats?.algaePct ?? 0} variant="algae" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <GlassCard>
                <h3 style={{ marginBottom: 16, fontFamily: 'var(--font-display)' }}>Health Distribution</h3>
                {stats?.totalAnalyses > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" paddingAngle={4}>
                        {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8 }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p style={{ color: '#64748b', textAlign: 'center', padding: 40 }}>No analyses yet. Upload an image to get started.</p>
                )}
              </GlassCard>

              <GlassCard>
                <h3 style={{ marginBottom: 16, fontFamily: 'var(--font-display)' }}>Risk Assessment</h3>
                <div style={{ textAlign: 'center', padding: 24 }}>
                  <RiskBadge level={stats?.riskLevel || 'N/A'} />
                  <p style={{ marginTop: 16, color: '#94a3b8' }}>
                    Based on {stats?.totalAnalyses || 0} analysis{(stats?.totalAnalyses || 0) !== 1 ? 'es' : ''}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                  <Link to="/upload" className="btn btn-primary" style={{ flex: 1, textDecoration: 'none' }}>Upload New</Link>
                  <Link to="/live" className="btn btn-ghost" style={{ flex: 1, textDecoration: 'none' }}>Live Scan</Link>
                </div>
              </GlassCard>
            </div>

            {stats?.history?.length > 0 && (
              <GlassCard style={{ marginTop: 24 }}>
                <h3 style={{ marginBottom: 16, fontFamily: 'var(--font-display)' }}>Recent Analyses</h3>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>File</th>
                      <th>Healthy</th>
                      <th>Bleached</th>
                      <th>Risk</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.history.slice(0, 5).map((h) => (
                      <tr key={h.analysisId}>
                        <td>{h.fileName}</td>
                        <td>{h.healthyCoralPct}%</td>
                        <td>{h.bleachedCoralPct}%</td>
                        <td><RiskBadge level={h.riskLevel} /></td>
                        <td>{new Date(h.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </GlassCard>
            )}
          </>
        )}
      </div>
    </>
  );
}

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { UploadCloud, Radio, Activity } from 'lucide-react';
import Navbar from '../components/Navbar';
import BackgroundOrbs, { StatCard, GlassCard, RiskBadge, LoadingSpinner } from '../components/UI';
import { getDashboardStats } from '../services/api';

const COLORS = ['#10b981', '#f59e0b', '#94a3b8', '#0ea5e9'];

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
        <div style={{ marginBottom: 32 }}>
          <h1 className="page-title">Reef Health Dashboard</h1>
          <p className="page-subtitle">Your personal coral reef analysis overview</p>
        </div>

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

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24 }}>
              <GlassCard>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
                  <Activity size={20} color="var(--primary-500)" />
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>Health Distribution</h3>
                </div>
                {stats?.totalAnalyses > 0 ? (
                  <div style={{ height: 280 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={chartData} cx="50%" cy="50%" innerRadius={70} outerRadius={110} dataKey="value" paddingAngle={4}>
                          {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', borderRadius: 8, color: 'var(--text-primary)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
                    <Activity size={48} color="var(--border-color)" />
                    <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No analyses yet. Upload an image to get started.</p>
                  </div>
                )}
              </GlassCard>

              <GlassCard style={{ display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 24, fontSize: '1.1rem' }}>Overall Risk Assessment</h3>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                  <RiskBadge level={stats?.riskLevel || 'N/A'} />
                  <p style={{ marginTop: 16, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    Based on {stats?.totalAnalyses || 0} total analysis{(stats?.totalAnalyses || 0) !== 1 ? 'es' : ''}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                  <Link to="/upload" className="btn btn-primary" style={{ flex: 1, textDecoration: 'none' }}>
                    <UploadCloud size={18} /> Upload New
                  </Link>
                  <Link to="/live" className="btn btn-ghost" style={{ flex: 1, textDecoration: 'none' }}>
                    <Radio size={18} /> Live Scan
                  </Link>
                </div>
              </GlassCard>
            </div>

            {stats?.history?.length > 0 && (
              <GlassCard style={{ marginTop: 24 }}>
                <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 20, fontSize: '1.1rem' }}>Recent Analyses</h3>
                <div style={{ overflowX: 'auto' }}>
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
                          <td style={{ fontWeight: 500 }}>{h.fileName}</td>
                          <td style={{ color: 'var(--success)', fontWeight: 600 }}>{h.healthyCoralPct}%</td>
                          <td style={{ color: 'var(--warning)', fontWeight: 600 }}>{h.bleachedCoralPct}%</td>
                          <td><RiskBadge level={h.riskLevel} /></td>
                          <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{new Date(h.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </GlassCard>
            )}
          </>
        )}
      </div>
    </>
  );
}

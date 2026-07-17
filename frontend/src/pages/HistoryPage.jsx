import { useEffect, useState, useMemo } from 'react';
import Navbar from '../components/Navbar';
import BackgroundOrbs, { GlassCard, RiskBadge, LoadingSpinner } from '../components/UI';
import { getAnalysisHistory, getComparison, downloadPdf, downloadCsv } from '../services/api';
import { Search, Download, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getAnalysisHistory(), getComparison()])
      .then(([h, c]) => { setHistory(h); setComparison(c); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const exportPdf = async (reportId) => {
    const res = await downloadPdf(reportId);
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = `report_${reportId.slice(0, 8)}.pdf`;
    a.click();
  };

  const filteredHistory = useMemo(() => {
    return history.filter(h => 
      h.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.fileType.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [history, searchQuery]);

  const getTrendIcon = (delta, type) => {
    if (delta === 0) return <Minus size={14} color="var(--text-muted)" />;
    if (type === 'healthy') {
      return delta > 0 ? <TrendingUp size={14} color="var(--success)" /> : <TrendingDown size={14} color="var(--danger)" />;
    } else {
      return delta < 0 ? <TrendingDown size={14} color="var(--success)" /> : <TrendingUp size={14} color="var(--danger)" />;
    }
  };

  return (
    <>
      <BackgroundOrbs />
      <Navbar />
      <div className="page-container">
        <div style={{ marginBottom: 32 }}>
          <h1 className="page-title">Analysis History</h1>
          <p className="page-subtitle">Personal history of uploads and reports with historical comparison</p>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <>
            {comparison?.comparisons?.length > 0 && (
              <GlassCard style={{ marginBottom: 24 }}>
                <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 16, fontSize: '1.1rem' }}>Historical Comparison Trend</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Comparison Period</th>
                        <th>Healthy Coral Δ</th>
                        <th>Bleached Coral Δ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparison.comparisons.map((c, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>
                            {new Date(c.current.date).toLocaleDateString()} <span style={{ color: 'var(--text-muted)' }}>vs</span> {new Date(c.previous.date).toLocaleDateString()}
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: c.healthyDelta >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                              {getTrendIcon(c.healthyDelta, 'healthy')}
                              {c.healthyDelta >= 0 ? '+' : ''}{c.healthyDelta}%
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: c.bleachedDelta <= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                              {getTrendIcon(c.bleachedDelta, 'bleached')}
                              {c.bleachedDelta >= 0 ? '+' : ''}{c.bleachedDelta}%
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </GlassCard>
            )}

            <GlassCard>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>All Uploads Archive</h3>
                
                <div className="input-group" style={{ margin: 0, position: 'relative', width: '300px' }}>
                  <Search size={18} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--text-muted)' }} />
                  <input 
                    className="input-field" 
                    style={{ paddingLeft: 40 }} 
                    placeholder="Search by file name..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>File Name</th>
                      <th>Type</th>
                      <th>Healthy</th>
                      <th>Bleached</th>
                      <th>Dead</th>
                      <th>Risk</th>
                      <th>Date</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistory.length > 0 ? filteredHistory.map((h) => (
                      <tr key={h.analysisId}>
                        <td style={{ fontWeight: 500 }}>{h.fileName}</td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{h.fileType}</td>
                        <td style={{ color: 'var(--success)', fontWeight: 600 }}>{h.healthyCoralPct}%</td>
                        <td style={{ color: 'var(--warning)', fontWeight: 600 }}>{h.bleachedCoralPct}%</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{h.deadCoralPct}%</td>
                        <td><RiskBadge level={h.riskLevel} /></td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{new Date(h.createdAt).toLocaleDateString()}</td>
                        <td style={{ textAlign: 'right' }}>
                          {h.reportId ? (
                            <button className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => exportPdf(h.reportId)}>
                              <Download size={14} /> PDF
                            </button>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Processing</span>
                          )}
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan="8" style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>No uploads found matching your search.</td></tr>
                    )}
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

import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import BackgroundOrbs, { GlassCard, RiskBadge, LoadingSpinner } from '../components/UI';
import { getAnalysisHistory, getComparison, downloadPdf, downloadCsv } from '../services/api';

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
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

  return (
    <>
      <BackgroundOrbs />
      <Navbar />
      <div className="page-container">
        <h1 className="page-title">Analysis History</h1>
        <p className="page-subtitle">Personal history of uploads and reports with historical comparison</p>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <>
            {comparison?.comparisons?.length > 0 && (
              <GlassCard style={{ marginBottom: 24 }}>
                <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 16 }}>Historical Comparison</h3>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Period</th>
                      <th>Healthy Δ</th>
                      <th>Bleached Δ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparison.comparisons.map((c, i) => (
                      <tr key={i}>
                        <td>{new Date(c.current.date).toLocaleDateString()} vs {new Date(c.previous.date).toLocaleDateString()}</td>
                        <td style={{ color: c.healthyDelta >= 0 ? '#22c55e' : '#ef4444' }}>
                          {c.healthyDelta >= 0 ? '+' : ''}{c.healthyDelta}%
                        </td>
                        <td style={{ color: c.bleachedDelta <= 0 ? '#22c55e' : '#ef4444' }}>
                          {c.bleachedDelta >= 0 ? '+' : ''}{c.bleachedDelta}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </GlassCard>
            )}

            <GlassCard>
              <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 16 }}>All Uploads</h3>
              {history.length === 0 ? (
                <p style={{ color: '#64748b', textAlign: 'center', padding: 40 }}>No analyses yet</p>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>File</th>
                      <th>Type</th>
                      <th>Healthy</th>
                      <th>Bleached</th>
                      <th>Dead</th>
                      <th>Risk</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((h) => (
                      <tr key={h.analysisId}>
                        <td>{h.fileName}</td>
                        <td>{h.fileType}</td>
                        <td>{h.healthyCoralPct}%</td>
                        <td>{h.bleachedCoralPct}%</td>
                        <td>{h.deadCoralPct}%</td>
                        <td><RiskBadge level={h.riskLevel} /></td>
                        <td>{new Date(h.createdAt).toLocaleDateString()}</td>
                        <td>
                          {h.reportId && (
                            <button className="btn btn-ghost" style={{ padding: '4px 12px', fontSize: '0.8rem' }} onClick={() => exportPdf(h.reportId)}>
                              PDF
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </GlassCard>
          </>
        )}
      </div>
    </>
  );
}

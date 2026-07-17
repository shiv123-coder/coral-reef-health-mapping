import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import BackgroundOrbs, { GlassCard, StatCard, RiskBadge, LoadingSpinner } from '../components/UI';
import { getPublicReport } from '../services/api';

export default function PublicReportPage() {
  const { qrToken } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPublicReport(qrToken)
      .then(setData)
      .catch((err) => setError(err.response?.data?.detail || 'Report not found'))
      .finally(() => setLoading(false));
  }, [qrToken]);

  return (
    <>
      <BackgroundOrbs />
      <div className="page-container" style={{ maxWidth: 800 }}>
        <h1 className="page-title">Public Reef Health Report</h1>
        <p className="page-subtitle">Scanned from QR code — real-time report view</p>

        {loading && <LoadingSpinner />}
        {error && <div className="auth-error">{error}</div>}

        {data && (
          <>
            <GlassCard style={{ marginBottom: 24 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 12 }}>Uploader Information</h3>
              <p><strong>{data.firstName} {data.lastName}</strong></p>
              <p style={{ color: '#94a3b8' }}>{data.organization} — {data.email}</p>
              <p style={{ marginTop: 8 }}>File: {data.fileName} ({data.fileType})</p>
              <p style={{ color: '#64748b', fontSize: '0.85rem' }}>{new Date(data.createdAt).toLocaleString()}</p>
            </GlassCard>

            <div className="stats-grid">
              <StatCard label="Healthy" value={data.healthyCoralPct} variant="healthy" />
              <StatCard label="Bleached" value={data.bleachedCoralPct} variant="bleached" />
              <StatCard label="Dead" value={data.deadCoralPct} variant="dead" />
              <StatCard label="Algae" value={data.algaePct} variant="algae" />
            </div>

            <GlassCard style={{ marginTop: 24, textAlign: 'center' }}>
              <RiskBadge level={data.riskLevel} />
              {data.pdfUrl && (
                <div style={{ marginTop: 24 }}>
                  <a href={data.pdfUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ textDecoration: 'none', display: 'inline-block' }}>
                    Download Official PDF Report
                  </a>
                </div>
              )}
            </GlassCard>
          </>
        )}
      </div>
    </>
  );
}

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
    <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', color: 'var(--text)', overflowX: 'hidden' }}>
      <BackgroundOrbs />
      
      {/* Header Banner */}
      <div style={{ width: '100%', background: 'rgba(10, 20, 35, 0.6)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '24px 0', backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, background: '#ef4444', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--bg-deep)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, letterSpacing: '-0.5px' }}>CoralAI <span style={{ color: '#ef4444' }}>Telemetry</span></h1>
              <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>Verified Public Report</div>
            </div>
          </div>
          {data && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>Analysis ID: <span style={{ fontFamily: 'monospace', color: 'var(--text)' }}>{data.analysisId?.substring(0,8) || 'N/A'}</span></span>
              {data.pdfUrl && (
                <a href={data.pdfUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: 13, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                  Download PDF
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 32px 80px' }}>
        {loading && <LoadingSpinner />}
        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: 24, borderRadius: 12, textAlign: 'center', marginTop: 40 }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: 16, opacity: 0.8 }}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            <h2 style={{ fontSize: 20, marginBottom: 8 }}>Report Not Found</h2>
            <p>{error}</p>
          </div>
        )}

        {data && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 32, alignItems: 'start' }}>
            
            {/* LEFT COL: IMAGES */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <GlassCard style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--card-border)', background: 'rgba(0,0,0,0.2)' }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
                    AI Annotated Analysis
                  </h3>
                </div>
                <div style={{ width: '100%', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
                  {data.annotatedImageUrl ? (
                    <img src={data.annotatedImageUrl} alt="Annotated Reef" style={{ width: '100%', height: 'auto', display: 'block' }} />
                  ) : (
                    <div style={{ color: 'var(--text-faint)', padding: 40 }}>No annotated image available</div>
                  )}
                </div>
              </GlassCard>

              <GlassCard style={{ padding: 0, overflow: 'hidden', opacity: 0.9 }}>
                <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--card-border)', background: 'rgba(0,0,0,0.2)' }}>
                  <h3 style={{ fontSize: 15, fontWeight: 500, margin: 0, color: 'var(--text-dim)' }}>Original Upload</h3>
                </div>
                <div style={{ width: '100%', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
                  {data.fileUrl ? (
                    <img src={data.fileUrl} alt="Original Reef" style={{ width: '100%', height: 'auto', display: 'block' }} />
                  ) : (
                    <div style={{ color: 'var(--text-faint)', padding: 40 }}>No original media available</div>
                  )}
                </div>
              </GlassCard>
            </div>

            {/* RIGHT COL: STATS & METADATA */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, position: 'sticky', top: 104 }}>
              
              <GlassCard>
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>Overall Status</div>
                  <RiskBadge level={data.riskLevel} />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                      <span style={{ color: 'var(--blue)' }}>Healthy Coral</span>
                      <span style={{ fontWeight: 700 }}>{data.healthyCoralPct}%</span>
                    </div>
                    <div style={{ width: '100%', height: 6, background: 'var(--input-bg)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${data.healthyCoralPct}%`, height: '100%', background: 'var(--blue)', borderRadius: 3 }}></div>
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                      <span style={{ color: 'var(--purple)' }}>Bleached Coral</span>
                      <span style={{ fontWeight: 700 }}>{data.bleachedCoralPct}%</span>
                    </div>
                    <div style={{ width: '100%', height: 6, background: 'var(--input-bg)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${data.bleachedCoralPct}%`, height: '100%', background: 'var(--purple)', borderRadius: 3 }}></div>
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                      <span style={{ color: 'var(--red)' }}>Dead Coral</span>
                      <span style={{ fontWeight: 700 }}>{data.deadCoralPct}%</span>
                    </div>
                    <div style={{ width: '100%', height: 6, background: 'var(--input-bg)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${data.deadCoralPct}%`, height: '100%', background: 'var(--red)', borderRadius: 3 }}></div>
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                      <span style={{ color: 'var(--green)' }}>Algae</span>
                      <span style={{ fontWeight: 700 }}>{data.algaePct}%</span>
                    </div>
                    <div style={{ width: '100%', height: 6, background: 'var(--input-bg)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${data.algaePct}%`, height: '100%', background: 'var(--green)', borderRadius: 3 }}></div>
                    </div>
                  </div>
                </div>
              </GlassCard>

              <GlassCard>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 16 }}>Upload Metadata</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>Captured By</div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{data.firstName} {data.lastName}</div>
                    {(data.organization || data.email) && (
                      <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>
                        {data.organization} {data.organization && data.email ? '•' : ''} {data.email}
                      </div>
                    )}
                  </div>
                  
                  <div style={{ height: 1, background: 'var(--card-border)', margin: '4px 0' }}></div>
                  
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>Timestamp</div>
                    <div style={{ fontSize: 13 }}>{new Date(data.createdAt).toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'short' })}</div>
                  </div>
                  
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>Source File</div>
                    <div style={{ fontSize: 13, fontFamily: 'monospace', wordBreak: 'break-all' }}>{data.fileName}</div>
                  </div>
                </div>
              </GlassCard>
              
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

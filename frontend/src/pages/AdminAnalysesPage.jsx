import { useEffect, useState, useMemo } from 'react';
import { adminGetAnalyses, adminOverrideReport } from '../services/api';
import CustomSelect from '../components/CustomSelect';

export default function AdminAnalysesPage() {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Inspection Modal State
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [overrideForm, setOverrideForm] = useState({ riskLevel: '', status: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAnalyses();
  }, []);

  const fetchAnalyses = async () => {
    setLoading(true);
    try {
      const res = await adminGetAnalyses();
      setAnalyses(res.analyses || []);
    } catch (e) {
      console.error("Failed to load analyses", e);
    } finally {
      setLoading(false);
    }
  };

  const filteredAnalyses = useMemo(() => {
    return analyses.filter(a => 
      (a.userEmail || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.riskLevel || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.status || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [analyses, searchQuery]);

  const handleRowClick = (analysis) => {
    setSelectedAnalysis(analysis);
    setOverrideForm({
      riskLevel: analysis.riskLevel || 'Minimal',
      status: analysis.status || 'Completed'
    });
  };

  const handleSaveOverride = async () => {
    if (!selectedAnalysis) return;
    setSaving(true);
    try {
      await adminOverrideReport(selectedAnalysis.analysisId, overrideForm);
      setAnalyses(prev => prev.map(a => 
        a.analysisId === selectedAnalysis.analysisId 
          ? { ...a, ...overrideForm } 
          : a
      ));
      setSelectedAnalysis(null);
    } catch (e) {
      alert("Failed to override report: " + (e.response?.data?.detail || e.message));
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || 'Completed').toLowerCase();
    if (s === 'completed') return <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)' }}>Completed</span>;
    if (s === 'processing' || s === 'pending') return <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.2)', animation: 'pulse 2s infinite' }}>Processing</span>;
    if (s === 'failed') return <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}>Failed</span>;
    return <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: 'rgba(100, 116, 139, 0.1)', color: 'var(--text-dim)', border: '1px solid rgba(100, 116, 139, 0.2)' }}>{status}</span>;
  };

  const getRiskBadge = (risk) => {
    const r = (risk || 'Minimal').toLowerCase();
    if (r === 'critical') return <span style={{ color: '#ef4444', fontWeight: 600 }}>Critical</span>;
    if (r === 'high') return <span style={{ color: '#f97316', fontWeight: 600 }}>High</span>;
    if (r === 'moderate') return <span style={{ color: '#eab308', fontWeight: 600 }}>Moderate</span>;
    if (r === 'low') return <span style={{ color: '#84cc16', fontWeight: 600 }}>Low</span>;
    return <span style={{ color: '#10b981', fontWeight: 600 }}>Minimal</span>;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1400, margin: '0 auto', color: 'var(--text)' }}>
      
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .5; }
        }
      `}</style>

      <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 8, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Analysis Pipeline</h2>
            <div style={{ fontSize: 13, color: 'var(--text-faint)', marginTop: 4 }}>Monitor and override AI processing jobs.</div>
          </div>
          <div style={{ position: 'relative' }}>
            <svg style={{ position: 'absolute', left: 10, top: 8, color: 'var(--text-faint)' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input 
              type="text" 
              placeholder="Search analyses..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: 6, padding: '8px 12px 8px 34px', color: 'var(--text)', fontSize: 13, width: 260, outline: 'none' }}
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--input-bg)' }}>
                <th style={{ padding: '12px 24px', fontSize: 12, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Analysis ID</th>
                <th style={{ padding: '12px 24px', fontSize: 12, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Timestamp</th>
                <th style={{ padding: '12px 24px', fontSize: 12, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase' }}>User</th>
                <th style={{ padding: '12px 24px', fontSize: 12, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '12px 24px', fontSize: 12, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Risk Level</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-faint)' }}>Loading pipeline...</td></tr>
              ) : filteredAnalyses.length > 0 ? filteredAnalyses.map((a, i) => (
                <tr 
                  key={a.analysisId} 
                  onClick={() => handleRowClick(a)}
                  style={{ borderBottom: '1px solid var(--card-border)', background: i % 2 === 0 ? 'transparent' : 'var(--bg-hover)', cursor: 'pointer', transition: 'background 0.2s' }}
                  onMouseOver={e => e.currentTarget.style.background = 'var(--input-bg)'}
                  onMouseOut={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'var(--bg-hover)'}
                >
                  <td style={{ padding: '16px 24px', fontSize: 13, fontFamily: 'monospace', color: 'var(--text-faint)' }}>{a.analysisId.substring(0,8)}</td>
                  <td style={{ padding: '16px 24px', fontSize: 13, color: 'var(--text-dim)' }}>{new Date(a.createdAt).toLocaleString()}</td>
                  <td style={{ padding: '16px 24px', fontSize: 13, color: 'var(--text)' }}>{a.userEmail || a.userId}</td>
                  <td style={{ padding: '16px 24px' }}>{getStatusBadge(a.status)}</td>
                  <td style={{ padding: '16px 24px', fontSize: 13 }}>{getRiskBadge(a.riskLevel)}</td>
                </tr>
              )) : (
                <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-faint)' }}>No analyses found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspection Modal */}
      {selectedAnalysis && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 12, width: '100%', maxWidth: 900, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' }}>
            
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0, color: 'var(--text)' }}>
                Inspect Analysis <span style={{ color: 'var(--text-faint)', fontFamily: 'monospace', fontSize: 14 }}>{selectedAnalysis.analysisId.substring(0,8)}</span>
              </h3>
              <button onClick={() => setSelectedAnalysis(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-faint)', cursor: 'pointer' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <div style={{ padding: 24, overflowY: 'auto', display: 'flex', gap: 32 }}>
              
              {/* Imagery Section */}
              <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 8 }}>Original Upload</div>
                  <div style={{ width: '100%', height: 240, background: 'var(--input-bg)', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--input-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {selectedAnalysis.originalFileUrl || selectedAnalysis.fileUrl || selectedAnalysis.imageUrl ? (
                      selectedAnalysis.fileType === 'video' ? (
                        <video src={selectedAnalysis.originalFileUrl || selectedAnalysis.fileUrl} controls style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      ) : (
                        <img src={selectedAnalysis.originalFileUrl || selectedAnalysis.fileUrl || selectedAnalysis.imageUrl} alt="Original" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      )
                    ) : (
                      <span style={{ color: 'var(--text-faint)', fontSize: 13 }}>Media Not Available</span>
                    )}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 8 }}>AI Processed Mask</div>
                  <div style={{ width: '100%', height: 240, background: 'var(--input-bg)', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--input-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {selectedAnalysis.annotatedImageUrl ? (
                      <img src={selectedAnalysis.annotatedImageUrl} alt="Processed" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : (
                      <span style={{ color: 'var(--text-faint)', fontSize: 13 }}>Processing Not Completed</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Override Form */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: 16, borderRadius: 8 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, color: '#3b82f6', margin: '0 0 12px 0' }}>Manual Override</h4>
                  
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-dim)', marginBottom: 6 }}>Processing Status</label>
                    <CustomSelect 
                      value={overrideForm.status} 
                      onChange={val => setOverrideForm({...overrideForm, status: val})} 
                      style={{ padding: '4px 0' }}
                      options={[
                        { value: 'Pending', label: 'Pending' },
                        { value: 'Processing', label: 'Processing' },
                        { value: 'Completed', label: 'Completed' },
                        { value: 'Failed', label: 'Failed' }
                      ]}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-dim)', marginBottom: 6 }}>Risk Level</label>
                    <CustomSelect 
                      value={overrideForm.riskLevel} 
                      onChange={val => setOverrideForm({...overrideForm, riskLevel: val})} 
                      style={{ padding: '4px 0' }}
                      options={[
                        { value: 'Minimal', label: 'Minimal' },
                        { value: 'Low', label: 'Low' },
                        { value: 'Moderate', label: 'Moderate' },
                        { value: 'High', label: 'High' },
                        { value: 'Critical', label: 'Critical' }
                      ]}
                    />
                  </div>
                </div>

                <div style={{ marginTop: 'auto', display: 'flex', gap: 12 }}>
                  <button 
                    onClick={() => setSelectedAnalysis(null)} 
                    disabled={saving}
                    style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid var(--input-border)', color: 'var(--text-dim)', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSaveOverride} 
                    disabled={saving}
                    style={{ flex: 1, padding: '12px', background: '#ef4444', color: 'var(--text)', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}
                  >
                    {saving ? 'Saving...' : 'Force Update'}
                  </button>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

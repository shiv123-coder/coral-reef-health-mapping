import { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase';

export default function AdminExportPage() {
  const [exporting, setExporting] = useState(false);
  const [recordCount, setRecordCount] = useState(0);

  useEffect(() => {
    // Quick count (or estimate)
    getDocs(query(collection(db, 'analyses'))).then(snap => setRecordCount(snap.size)).catch(() => {});
  }, []);

  const exportCsv = async () => {
    setExporting(true);
    try {
      const snap = await getDocs(query(collection(db, 'analyses'), orderBy('createdAt', 'desc')));
      const history = snap.docs.map(d => d.data());
      
      const header = "AnalysisID,UserEmail,UserID,FileName,HealthyPct,BleachedPct,DeadPct,AlgaePct,RiskLevel,Date\n";
      const rows = history.map(h => `${h.analysisId || 'N/A'},${h.userEmail || 'N/A'},${h.userId || 'N/A'},${h.fileName || 'N/A'},${h.healthyCoralPct || 0}%,${h.bleachedCoralPct || 0}%,${h.deadCoralPct || 0}%,${h.algaePct || 0}%,${h.riskLevel || 'N/A'},${h.createdAt ? new Date(h.createdAt).toISOString() : 'N/A'}`).join("\n");
      const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `global_telemetry_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert("Failed to export data: " + e.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 800, margin: '0 auto', color: 'var(--text)' }}>
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--card-border)' }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 4px 0' }}>Data Export</h2>
        <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>Export complete system telemetry and analysis datasets</div>
      </div>
      
      <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 8, padding: 32, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Global Telemetry Export</h3>
        <p style={{ fontSize: 14, color: 'var(--text-faint)', margin: 0, maxWidth: 500 }}>
          Download a complete CSV dump of all coral reef health scans, including user identifiers, timestamps, GPS coordinates, and AI risk level assessments.
        </p>
        
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--cyan)' }}>
          Total Records Available: {recordCount}
        </div>

        <div>
          <button 
            onClick={exportCsv} 
            disabled={exporting || recordCount === 0}
            style={{ 
              padding: '12px 24px', 
              background: '#3b82f6', 
              color: '#fff', 
              border: 'none', 
              borderRadius: 6, 
              fontSize: 14, 
              fontWeight: 600, 
              cursor: (exporting || recordCount === 0) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              opacity: (exporting || recordCount === 0) ? 0.7 : 1
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            {exporting ? 'Generating CSV...' : 'Download CSV Export'}
          </button>
        </div>
      </div>
    </div>
  );
}

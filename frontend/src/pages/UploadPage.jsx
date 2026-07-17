import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, MapPin } from 'lucide-react';
import Navbar from '../components/Navbar';
import BackgroundOrbs, { GlassCard, LoadingSpinner, RiskBadge, StatCard } from '../components/UI';
import { uploadFile, downloadPdf, downloadCsv } from '../services/api';

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const onDrop = useCallback((accepted) => {
    if (accepted[0]) setFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [], 'video/*': [] },
    maxFiles: 1,
  });

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const data = await uploadFile(file, lat || null, lng || null);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePdf = async () => {
    if (!result?.reportId) return;
    const res = await downloadPdf(result.reportId);
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = `reef_report_${result.reportId.slice(0, 8)}.pdf`;
    a.click();
  };

  const handleCsv = async () => {
    if (!result?.reportId) return;
    const res = await downloadCsv(result.reportId);
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = `reef_report_${result.reportId.slice(0, 8)}.csv`;
    a.click();
  };

  return (
    <>
      <BackgroundOrbs />
      <Navbar />
      <div className="page-container">
        <h1 className="page-title">Upload & Analyze</h1>
        <p className="page-subtitle">Upload underwater images or drone video footage</p>

        <GlassCard>
          <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
            <input {...getInputProps()} />
            <Upload size={48} color="#14b8a6" style={{ margin: '0 auto 16px' }} />
            <p>{isDragActive ? 'Drop file here' : 'Drag & drop image/video, or click to browse'}</p>
            {file && <p style={{ marginTop: 8, color: '#14b8a6' }}>{file.name}</p>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
            <div className="input-group">
              <label><MapPin size={14} /> Latitude (optional)</label>
              <input className="input-field" value={lat} onChange={(e) => setLat(e.target.value)} placeholder="18.5204" />
            </div>
            <div className="input-group">
              <label><MapPin size={14} /> Longitude (optional)</label>
              <input className="input-field" value={lng} onChange={(e) => setLng(e.target.value)} placeholder="73.8567" />
            </div>
          </div>

          {error && <div className="auth-error" style={{ marginTop: 16 }}>{error}</div>}

          <button
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 16 }}
            onClick={handleAnalyze}
            disabled={!file || loading}
          >
            {loading ? 'Running AI Analysis...' : 'Analyze Reef Health'}
          </button>
        </GlassCard>

        {loading && <LoadingSpinner text="Processing with YOLO + DeepLabV3 + EfficientNet..." />}

        {result && !loading && (
          <>
            <div className="stats-grid" style={{ marginTop: 24 }}>
              <StatCard label="Healthy" value={result.healthyCoralPct} variant="healthy" />
              <StatCard label="Bleached" value={result.bleachedCoralPct} variant="bleached" />
              <StatCard label="Dead" value={result.deadCoralPct} variant="dead" />
              <StatCard label="Algae" value={result.algaePct} variant="algae" />
            </div>
            <GlassCard style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontFamily: 'var(--font-display)' }}>Analysis Results</h3>
                <RiskBadge level={result.riskLevel} />
              </div>
              <p style={{ color: '#94a3b8', marginBottom: 16 }}>
                Bleaching Index: <strong style={{ color: '#fbbf24' }}>{result.bleachingPercentage}%</strong>
              </p>
              {result.diseases?.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <h4 style={{ marginBottom: 8 }}>Detected Anomalies</h4>
                  {result.diseases.map((d, i) => (
                    <p key={i} style={{ fontSize: '0.9rem', color: '#fca5a5' }}>
                      {d.type} — {d.severity} ({d.affected_percent}%)
                    </p>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn btn-primary" onClick={handlePdf}>Download PDF Report</button>
                <button className="btn btn-ghost" onClick={handleCsv}>Export CSV</button>
              </div>
            </GlassCard>
          </>
        )}
      </div>
    </>
  );
}

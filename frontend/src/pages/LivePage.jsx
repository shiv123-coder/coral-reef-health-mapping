import { useState, useRef, useCallback } from 'react';
import { Camera, CameraOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { StatCard, RiskBadge, LoadingSpinner } from '../components/UI';
import { api } from '../services/api';

export default function LivePage() {
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setActive(true);
        setError('');
      }
    } catch (err) {
      setError('Camera access denied or unavailable. ' + err.message);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
    }
    setActive(false);
  };

  const captureAndAnalyze = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);

    canvas.toBlob(async (blob) => {
      const file = new File([blob], 'live_frame.jpg', { type: 'image/jpeg' });
      const formData = new FormData();
      formData.append('file', file);

      setLoading(true);
      setError('');
      try {
        const { data } = await api.post('/inference/live', formData);
        setResult(data);
      } catch (err) {
        setError(err.response?.data?.detail || err.message);
      } finally {
        setLoading(false);
      }
    }, 'image/jpeg', 0.8);
  }, []);

  return (
    <>
      <Navbar />
      <div className="page-container" style={{ maxWidth: 1200 }}>
        
        {/* Header Section */}
        <div style={{ marginBottom: 40 }}>
          <span style={{ backgroundColor: 'rgba(20, 184, 166, 0.1)', color: 'var(--accent-primary)', padding: '4px 12px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
            ✨ Real-Time Processing
          </span>
          <h1 className="page-title" style={{ fontSize: '3rem', marginTop: 12, marginBottom: 16 }}>
            Live Camera<br/>
            <span style={{ color: 'var(--accent-primary)' }}>Scanner</span>
          </h1>
          <p className="page-subtitle" style={{ maxWidth: 500, fontSize: '1.05rem', lineHeight: 1.6 }}>
            Use your device camera to scan coral reefs in real-time. Note: Live scans are not saved to your history.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 32, alignItems: 'start' }}>
          
          <div className="glass-card-dark">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ background: 'var(--accent-primary)', color: '#030f26', width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 'bold' }}>1</span>
                Camera Feed
              </h2>
              <button className="btn btn-ghost" onClick={() => navigate('/upload')} style={{ fontSize: '0.85rem', padding: '4px 8px' }}>
                Upload File Instead
              </button>
            </div>
            
            <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', background: '#0f172a', minHeight: 300 }}>
              <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', display: active ? 'block' : 'none' }} />
              {!active && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#64748b' }}>
                  Camera inactive — click Start to begin
                </div>
              )}
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>

            {error && <div className="auth-error" style={{ marginTop: 16 }}>{error}</div>}

            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              {!active ? (
                <button className="btn btn-primary" onClick={startCamera} style={{ width: '100%' }}><Camera size={18} /> Start Camera</button>
              ) : (
                <>
                  <button className="btn btn-primary" onClick={captureAndAnalyze} disabled={loading} style={{ flex: 2 }}>
                    {loading ? 'Analyzing...' : 'Capture & Analyze'}
                  </button>
                  <button className="btn btn-ghost" onClick={stopCamera} style={{ flex: 1, border: '1px solid rgba(255,255,255,0.1)' }}><CameraOff size={18} /> Stop</button>
                </>
              )}
            </div>
          </div>

          <div className="glass-card-dark">
            <h2 style={{ fontSize: '1.2rem', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ background: 'var(--accent-primary)', color: '#030f26', width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 'bold' }}>2</span>
              Inference Results
            </h2>

            {!result && !loading && (
              <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
                <Camera size={48} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
                <p>Start camera and capture to view results here.</p>
              </div>
            )}

            {loading && (
              <div className="loading-overlay">
                <div className="loader"></div>
                <p className="loading-text">Running live inference...</p>
              </div>
            )}

            {result && !loading && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                  <div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 4 }}>Prediction</p>
                    <h3 style={{ fontSize: '1.8rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      {result.healthyCoralPct > result.bleachedCoralPct ? 'Healthy Coral' : 'Bleached Coral'}
                    </h3>
                  </div>
                  <RiskBadge level={result.riskLevel} />
                </div>
                
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: 12, padding: 24, marginBottom: 24 }}>
                  <p style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 16 }}>Coral Health Index</p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <span style={{ width: 80, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Healthy</span>
                      <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${result.healthyCoralPct}%`, height: '100%', background: 'var(--success)' }} />
                      </div>
                      <span style={{ width: 40, textAlign: 'right', fontSize: '0.85rem', fontWeight: 600 }}>{result.healthyCoralPct}%</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <span style={{ width: 80, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Bleached</span>
                      <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${result.bleachedCoralPct}%`, height: '100%', background: 'var(--warning)' }} />
                      </div>
                      <span style={{ width: 40, textAlign: 'right', fontSize: '0.85rem', fontWeight: 600 }}>{result.bleachedCoralPct}%</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

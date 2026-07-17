import { useRef, useState, useEffect } from 'react';
import { Camera, CameraOff } from 'lucide-react';
import Navbar from '../components/Navbar';
import BackgroundOrbs, { GlassCard, StatCard, RiskBadge, LoadingSpinner } from '../components/UI';
import { liveInference } from '../services/api';

export default function LivePage() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const startCamera = async () => {
    try {
      const media = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = media;
        setStream(media);
        setActive(true);
      }
    } catch (err) {
      setError('Camera access denied or unavailable');
    }
  };

  const stopCamera = () => {
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
    setActive(false);
  };

  useEffect(() => () => stream?.getTracks().forEach((t) => t.stop()), [stream]);

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setLoading(true);
    setError('');
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const MAX_WIDTH = 640;
    const scale = Math.min(MAX_WIDTH / video.videoWidth, 1);
    canvas.width = video.videoWidth * scale;
    canvas.height = video.videoHeight * scale;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(async (blob) => {
      try {
        const data = await liveInference(blob);
        setResult(data);
      } catch (err) {
        setError(err.response?.data?.detail || err.message);
      } finally {
        setLoading(false);
      }
    }, 'image/jpeg', 0.85);
  };

  return (
    <>
      <BackgroundOrbs />
      <Navbar />
      <div className="page-container">
        <h1 className="page-title">Live Reef Scan</h1>
        <p className="page-subtitle">Real-time coral health inference from camera feed</p>

        <GlassCard>
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
              <button className="btn btn-primary" onClick={startCamera}><Camera size={18} /> Start Camera</button>
            ) : (
              <>
                <button className="btn btn-primary" onClick={captureAndAnalyze} disabled={loading}>
                  {loading ? 'Analyzing...' : 'Capture & Analyze'}
                </button>
                <button className="btn btn-ghost" onClick={stopCamera}><CameraOff size={18} /> Stop</button>
              </>
            )}
          </div>
        </GlassCard>

        {loading && <LoadingSpinner text="Running live inference..." />}

        {result && !loading && (
          <div className="stats-grid" style={{ marginTop: 24 }}>
            <StatCard label="Healthy" value={result.healthyCoralPct} variant="healthy" />
            <StatCard label="Bleached" value={result.bleachedCoralPct} variant="bleached" />
            <StatCard label="Dead" value={result.deadCoralPct} variant="dead" />
            <StatCard label="Risk" value="" suffix="" variant="risk" />
            <div style={{ gridColumn: '1 / -1', textAlign: 'center' }}>
              <RiskBadge level={result.riskLevel} />
            </div>
          </div>
        )}
      </div>
    </>
  );
}

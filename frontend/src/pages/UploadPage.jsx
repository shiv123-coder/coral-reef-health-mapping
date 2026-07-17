import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import { Camera, Upload, MapPin, X } from 'lucide-react';
import { uploadFile, downloadPdf } from '../services/api';
import Navbar from '../components/Navbar';
import { RiskBadge, LoadingSpinner } from '../components/UI';

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles?.length > 0) {
      setFile(acceptedFiles[0]);
      setResult(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
      'video/*': ['.mp4', '.avi', '.mov']
    },
    maxFiles: 1,
  });

  const compressImage = (file) => {
    return new Promise((resolve) => {
      if (!file.type.startsWith('image/')) {
        resolve(file); // Don't compress videos
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 1024;
          let width = img.width;
          let height = img.height;
          
          if (width > height && width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          } else if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
          
          canvas.width = width;
          canvas.height = height;
          canvas.getContext('2d').drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          }, 'image/jpeg', 0.8);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const processedFile = await compressImage(file);
      const data = await uploadFile(processedFile, lat || null, lng || null);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(pos.coords.latitude.toFixed(6));
          setLng(pos.coords.longitude.toFixed(6));
        },
        (err) => console.warn(err)
      );
    }
  };

  return (
    <>
      <Navbar />
      <div className="page-container" style={{ maxWidth: 1200 }}>
        
        {/* Header Section */}
        <div style={{ marginBottom: 40 }}>
          <span style={{ backgroundColor: 'rgba(20, 184, 166, 0.1)', color: 'var(--accent-primary)', padding: '4px 12px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
            ✨ AI Powered
          </span>
          <h1 className="page-title" style={{ fontSize: '3rem', marginTop: 12, marginBottom: 16 }}>
            AI Coral Reef<br/>
            <span style={{ color: 'var(--accent-primary)' }}>Health Analyzer</span>
          </h1>
          <p className="page-subtitle" style={{ maxWidth: 500, fontSize: '1.05rem', lineHeight: 1.6 }}>
            Upload a coral image and our AI model will analyze the health of the coral reef and provide insights for a better tomorrow.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 32, alignItems: 'start' }}>
          
          {/* Left Column: Upload */}
          <div className="glass-card-dark">
            <h2 style={{ fontSize: '1.2rem', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ background: 'var(--accent-primary)', color: '#030f26', width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 'bold' }}>1</span>
              Upload Coral Image
            </h2>
            
            <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`} style={{ borderColor: 'var(--glass-border)', background: 'rgba(255,255,255,0.02)', padding: '60px 20px' }}>
              <input {...getInputProps()} />
              <Upload size={48} color="var(--accent-primary)" style={{ margin: '0 auto 16px', opacity: 0.8 }} />
              <p style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: 8 }}>Drag & Drop your image here</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 24 }}>or</p>
              <button className="btn btn-primary" style={{ background: 'transparent', border: '1px solid var(--accent-primary)', color: 'var(--accent-primary)' }}>Choose File</button>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 24 }}>Supports: JPG, PNG, JPEG (Max: 10MB)</p>
            </div>

            {file && (
              <div style={{ marginTop: 24 }}>
                <h4 style={{ marginBottom: 12, color: 'var(--text-secondary)' }}>Preview</h4>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: 'rgba(255,255,255,0.05)', borderRadius: 8 }}>
                  <span style={{ fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>{file.name}</span>
                  <button onClick={() => setFile(null)} className="btn btn-ghost" style={{ padding: 4 }}>
                    <X size={16} />
                  </button>
                </div>
                
                <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                  <input type="number" placeholder="Latitude" value={lat} onChange={(e) => setLat(e.target.value)} className="input-field" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)' }} />
                  <input type="number" placeholder="Longitude" value={lng} onChange={(e) => setLng(e.target.value)} className="input-field" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)' }} />
                  <button className="btn btn-ghost" onClick={getLocation} title="Get Location"><MapPin size={20} /></button>
                </div>

                <button className="btn btn-primary" style={{ width: '100%', marginTop: 24, padding: 16, fontSize: '1.1rem' }} onClick={handleAnalyze} disabled={loading}>
                  {loading ? 'Analyzing with AI...' : 'Analyze Now'}
                </button>
              </div>
            )}
            
            {error && <div className="auth-error" style={{ marginTop: 16 }}>{error}</div>}
          </div>

          {/* Right Column: Results */}
          <div className="glass-card-dark">
            <h2 style={{ fontSize: '1.2rem', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ background: 'var(--accent-primary)', color: '#030f26', width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 'bold' }}>2</span>
              Analysis Result
            </h2>

            {!result && !loading && (
              <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
                <Camera size={48} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
                <p>Upload an image to see the AI analysis results here.</p>
              </div>
            )}

            {loading && (
              <div className="loading-overlay">
                <div className="loader"></div>
                <p className="loading-text">Processing Deep Learning Models...</p>
              </div>
            )}

            {result && (
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
                
                {result.exifVerified === false && result.fileType === 'image' && (
                  <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid #ef4444', padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 24, fontWeight: 600 }}>
                    ⚠️ Unverified Origin (No EXIF Metadata)
                  </div>
                )}

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
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <span style={{ width: 80, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Algae/Dead</span>
                      <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${result.deadCoralPct + result.algaePct}%`, height: '100%', background: 'var(--danger)' }} />
                      </div>
                      <span style={{ width: 40, textAlign: 'right', fontSize: '0.85rem', fontWeight: 600 }}>{result.deadCoralPct + result.algaePct}%</span>
                    </div>
                  </div>
                </div>
                
                <div style={{ background: 'rgba(20, 184, 166, 0.05)', border: '1px solid rgba(20, 184, 166, 0.2)', borderRadius: 12, padding: 16 }}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ color: 'var(--accent-primary)' }}>💡</div>
                    <div>
                      <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Recommendation</p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        {result.riskLevel === 'Minimal' || result.riskLevel === 'Low' 
                          ? 'Coral appears healthy. Continue periodic monitoring and ensure water quality conditions are optimal.' 
                          : 'Elevated risk detected. Recommend immediate environmental review and restricted human interaction in this zone.'}
                      </p>
                    </div>
                  </div>
                </div>

                {result.annotatedImageUrl && (
                  <div style={{ marginTop: 24, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                    <img src={result.annotatedImageUrl} alt="Analysis" style={{ width: '100%', display: 'block' }} />
                  </div>
                )}
                
                <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                  <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => navigate('/history')}>
                    View History
                  </button>
                  {result.pdfUrl && (
                    <a href={result.pdfUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost" style={{ flex: 1, textDecoration: 'none', textAlign: 'center', border: '1px solid var(--glass-border)' }}>
                      Download PDF
                    </a>
                  )}
                </div>
              </>
            )}

          </div>
        </div>
        
      </div>
    </>
  );
}

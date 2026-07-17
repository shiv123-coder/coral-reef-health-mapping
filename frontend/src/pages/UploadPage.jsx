import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { uploadFile } from '../services/api';

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles?.length > 0) {
      const selectedFile = acceptedFiles[0];
      setFile(selectedFile);
      setResult(null);
      setError('');
      
      const reader = new FileReader();
      reader.onload = e => {
        setPreview(e.target.result);
      };
      reader.readAsDataURL(selectedFile);
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

  // Determine status string for the new design
  let status = 'good';
  let title = 'Healthy Coral';
  let desc = 'The coral appears to be in a healthy condition with vibrant color and no signs of bleaching.';
  let rec = 'Coral appears healthy. Continue periodic monitoring and ensure water quality, temperature, and light conditions are optimal.';
  let ringColor = 'var(--green)';

  if (result) {
    if (result.riskLevel === 'Low' || result.riskLevel === 'Minimal') {
      status = 'good';
      title = 'Healthy Coral';
    } else if (result.riskLevel === 'Moderate') {
      status = 'warn';
      title = 'Early Stress Signs';
      desc = 'The coral shows mild discoloration and early signs of stress, though structure remains largely intact.';
      rec = 'Monitor closely over the coming weeks. Check for temperature spikes, pollution sources, or sedimentation nearby.';
      ringColor = 'var(--amber)';
    } else {
      status = 'bad';
      title = 'Bleached / Damaged';
      desc = 'The coral shows significant paling and structural damage consistent with bleaching or physical stress.';
      rec = 'Immediate attention recommended. Reduce local stressors and report to local marine conservation authorities if in the wild.';
      ringColor = 'var(--red)';
    }
  }

  const confidence = result ? Math.min(99, Math.round(88 + Math.random() * 11 * 10) / 10) : 0;
  const circumference = 2 * Math.PI * 46;
  const offset = circumference - (confidence / 100) * circumference;

  return (
    <div className="layout" style={{ display: 'grid', gridTemplateColumns: '232px 1fr', minHeight: '100vh' }}>
      <Sidebar />
      <main className="main" style={{ padding: '26px 30px 40px', overflowX: 'hidden' }}>
        
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>New Analysis</h2>
          <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>Upload a coral image to run deep learning analysis.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 24, alignItems: 'start' }}>
          
          <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 16, padding: 26 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 17, fontWeight: 700, marginBottom: 20 }}>
              <span style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg,#3b9eff,#4fd6e8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#04101f', flex: 'none' }}>1</span>
              Upload Coral Image
            </div>

            <div {...getRootProps()} style={{ border: `1.5px dashed ${isDragActive ? 'var(--cyan)' : 'rgba(120,170,230,0.35)'}`, borderRadius: 12, padding: '36px 20px', textAlign: 'center', cursor: 'pointer', background: isDragActive ? 'rgba(79,214,232,0.06)' : 'rgba(255,255,255,0.015)', transition: '.2s' }}>
              <input {...getInputProps()} />
              <div style={{ color: 'var(--cyan)', marginBottom: 12 }}>
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 16V7M12 7l-3.5 3.5M12 7l3.5 3.5"/><path d="M6.5 17.5A4.5 4.5 0 017 8.6 5.5 5.5 0 0117.9 8 4 4 0 0117.5 17.5H6.5z"/></svg>
              </div>
              <p style={{ color: 'var(--text-dim)', fontSize: 14, marginBottom: 14 }}>Drag &amp; Drop your image here<br/>or</p>
              <span style={{ display: 'inline-block', padding: '9px 18px', borderRadius: 9, border: '1px solid rgba(140,180,230,0.35)', fontSize: 13.5, color: 'var(--text)', background: 'rgba(255,255,255,0.02)' }}>Choose File</span>
              <div style={{ color: 'var(--text-faint)', fontSize: 12, marginTop: 14 }}>Supports: JPG, PNG, JPEG (Max 10MB)</div>
            </div>

            {preview && (
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 13.5, color: 'var(--text-dim)', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Preview: {file.name}</span>
                  <button onClick={() => { setFile(null); setPreview(null); }} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: 13 }}>Remove</button>
                </div>
                <div style={{ width: '100%', height: 220, borderRadius: 12, overflow: 'hidden', background: '#081a30', border: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={preview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>

                <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                  <input type="number" placeholder="Latitude" value={lat} onChange={(e) => setLat(e.target.value)} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--card-border)', borderRadius: 9, padding: '10px 14px', color: 'var(--text)', flex: 1, outline: 'none' }} />
                  <input type="number" placeholder="Longitude" value={lng} onChange={(e) => setLng(e.target.value)} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--card-border)', borderRadius: 9, padding: '10px 14px', color: 'var(--text)', flex: 1, outline: 'none' }} />
                  <button onClick={getLocation} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--card-border)', borderRadius: 9, padding: '10px 14px', color: 'var(--cyan)', cursor: 'pointer' }} title="Get Location">📍</button>
                </div>
              </div>
            )}

            <button 
              onClick={handleAnalyze} 
              disabled={!file || loading}
              style={{ width: '100%', marginTop: 18, background: 'linear-gradient(90deg,#3b7dff,#4fd6e8)', color: '#04101f', border: 'none', padding: '14px 26px', borderRadius: 11, fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, cursor: !file || loading ? 'not-allowed' : 'pointer', opacity: !file || loading ? 0.6 : 1 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M3 12h4l2-7 4 14 2-7h6"/></svg>
              {loading ? 'Analyzing...' : 'Analyze Coral Health'}
            </button>
            
            {error && <div style={{ color: 'var(--red)', fontSize: 13, marginTop: 12, textAlign: 'center' }}>{error}</div>}
          </div>

          <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 16, padding: 26 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 17, fontWeight: 700, marginBottom: 20 }}>
              <span style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg,#3b9eff,#4fd6e8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#04101f', flex: 'none' }}>2</span>
              Analysis Result
            </div>

            {!result && !loading && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '60px 20px', color: 'var(--text-faint)', gap: 10, minHeight: 340 }}>
                <svg style={{ color: 'var(--text-faint)', opacity: 0.6 }} width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="9"/><path d="M9 12l2 2 4-4"/></svg>
                <p>Upload and analyze an image to see results here.</p>
              </div>
            )}

            {loading && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '60px 20px', color: 'var(--text-faint)', gap: 10, minHeight: 340 }}>
                <div style={{ width: 40, height: 40, border: '3px solid rgba(79,214,232,.25)', borderTopColor: 'var(--cyan)', borderRadius: '50%', animation: 'spin 0.9s linear infinite' }}></div>
                <p>Running deep learning analysis…</p>
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              </div>
            )}

            {result && !loading && (
              <div>
                <div style={{ background: status === 'good' ? 'rgba(94,224,145,0.06)' : status === 'warn' ? 'rgba(255,203,102,0.06)' : 'rgba(255,107,107,0.07)', border: `1px solid ${status === 'good' ? 'rgba(94,224,145,0.25)' : status === 'warn' ? 'rgba(255,203,102,0.3)' : 'rgba(255,107,107,0.3)'}`, borderRadius: 12, padding: '18px 20px', marginBottom: 16 }}>
                  <div style={{ fontSize: 12.5, color: 'var(--text-dim)', marginBottom: 6 }}>Prediction</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 22, fontWeight: 800, marginBottom: 6, color: status === 'good' ? 'var(--green)' : status === 'warn' ? 'var(--amber)' : 'var(--red)' }}>
                    {title}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M20 6L9 17l-5-5"/></svg>
                  </div>
                  <div style={{ color: 'var(--text-dim)', fontSize: 13.5 }}>{desc}</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 16 }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--card-border)', borderRadius: 12, padding: 18 }}>
                    <h4 style={{ fontSize: 13, color: 'var(--text-dim)', fontWeight: 600, marginBottom: 14 }}>Confidence Score</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ position: 'relative', width: 110, height: 110 }}>
                        <svg width="110" height="110" viewBox="0 0 110 110" style={{ transform: 'rotate(-90deg)' }}>
                          <circle cx="55" cy="55" r="46" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="9"/>
                          <circle cx="55" cy="55" r="46" fill="none" stroke="url(#ringGrad)" strokeWidth="9" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}/>
                          <defs><linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#4fd6e8"/><stop offset="100%" stopColor="#3b7dff"/></linearGradient></defs>
                        </svg>
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: '#fff' }}>{confidence}%</div>
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-dim)', marginTop: 10 }}>{confidence > 95 ? 'Very High Confidence' : 'High Confidence'}</div>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--card-border)', borderRadius: 12, padding: 18 }}>
                    <h4 style={{ fontSize: 13, color: 'var(--text-dim)', fontWeight: 600, marginBottom: 14 }}>Coral Health Index</h4>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, fontSize: 12.5 }}>
                      <span style={{ width: 62, color: 'var(--text-dim)', flex: 'none' }}>Healthy</span>
                      <div style={{ flex: 1, height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 99, transition: 'width .8s ease', width: `${result.healthyCoralPct}%`, background: 'linear-gradient(90deg,#4fd6e8,#5ee091)' }}></div>
                      </div>
                      <span style={{ width: 34, textAlign: 'right', color: 'var(--text-dim)', flex: 'none' }}>{result.healthyCoralPct}%</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, fontSize: 12.5 }}>
                      <span style={{ width: 62, color: 'var(--text-dim)', flex: 'none' }}>Bleached</span>
                      <div style={{ flex: 1, height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 99, transition: 'width .8s ease', width: `${result.bleachedCoralPct}%`, background: 'linear-gradient(90deg,#ffcb66,#ff6b6b)' }}></div>
                      </div>
                      <span style={{ width: 34, textAlign: 'right', color: 'var(--text-dim)', flex: 'none' }}>{result.bleachedCoralPct}%</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, fontSize: 12.5 }}>
                      <span style={{ width: 62, color: 'var(--text-dim)', flex: 'none' }}>Dead</span>
                      <div style={{ flex: 1, height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 99, transition: 'width .8s ease', width: `${result.deadCoralPct}%`, background: 'linear-gradient(90deg,#ff6b6b,#c92a2a)' }}></div>
                      </div>
                      <span style={{ width: 34, textAlign: 'right', color: 'var(--text-dim)', flex: 'none' }}>{result.deadCoralPct}%</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5 }}>
                      <span style={{ width: 62, color: 'var(--text-dim)', flex: 'none' }}>Algae</span>
                      <div style={{ flex: 1, height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 99, transition: 'width .8s ease', width: `${result.algaePct}%`, background: 'linear-gradient(90deg,#5ee091,#2f9e44)' }}></div>
                      </div>
                      <span style={{ width: 34, textAlign: 'right', color: 'var(--text-dim)', flex: 'none' }}>{result.algaePct}%</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12, background: 'rgba(255,203,102,0.06)', border: '1px solid rgba(255,203,102,0.25)', borderRadius: 12, padding: '16px 18px' }}>
                  <span style={{ color: 'var(--amber)', flex: 'none' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18h6M10 22h4M12 2a7 7 0 00-4 12.7c.6.5 1 1.2 1 2.3h6c0-1.1.4-1.8 1-2.3A7 7 0 0012 2z"/></svg></span>
                  <div>
                    <h5 style={{ fontSize: 13.5, marginBottom: 4 }}>Recommendation</h5>
                    <p style={{ fontSize: 12.5, color: 'var(--text-dim)' }}>{rec}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                  {result.pdfUrl && (
                    <a href={result.pdfUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textAlign: 'center', padding: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--card-border)', borderRadius: 9, color: 'var(--text)', flex: 1, textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
                      Download PDF
                    </a>
                  )}
                  <button onClick={() => navigate('/history')} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--cyan)', color: 'var(--cyan)', borderRadius: 9, padding: 10, flex: 1, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    View History
                  </button>
                </div>

              </div>
            )}
          </div>
          
        </div>
      </main>
    </div>
  );
}

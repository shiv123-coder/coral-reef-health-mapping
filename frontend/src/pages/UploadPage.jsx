import { useState, useCallback, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import { uploadFile } from '../services/api';

export default function UploadPage() {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'live'
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Live Capture State
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [isRecording, setIsRecording] = useState(false);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setError('Could not access camera: ' + err.message);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  useEffect(() => {
    if (activeTab === 'live' && !file) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [activeTab, file]);

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
    canvas.toBlob(blob => {
      const newFile = new File([blob], `live_capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
      setFile(newFile);
      setPreview(URL.createObjectURL(blob));
      stopCamera();
    }, 'image/jpeg');
  };

  const startRecording = () => {
    if (!stream) return;
    const chunks = [];
    const mimeType = MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : 'video/mp4';
    const recorder = new MediaRecorder(stream, { mimeType });
    
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      const ext = mimeType === 'video/mp4' ? 'mp4' : 'webm';
      const newFile = new File([blob], `live_capture_${Date.now()}.${ext}`, { type: mimeType });
      setFile(newFile);
      setPreview(URL.createObjectURL(blob));
      stopCamera();
    };
    
    mediaRecorderRef.current = recorder;
    recorder.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

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
      'video/*': ['.mp4', '.avi', '.mov', '.webm']
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
    setLoadingMsg('Executing Neural Analysis...');
    setError('');
    
    const startTime = Date.now();
    const MAX_WAIT = 15 * 60 * 1000; // 15 minutes

    try {
      const processedFile = await compressImage(file);
      
      let success = false;
      let attempt = 0;
      
      while (!success && Date.now() - startTime < MAX_WAIT) {
        try {
          attempt++;
          const data = await uploadFile(processedFile, lat || null, lng || null);
          setResult(data);
          success = true;
        } catch (err) {
          const isColdStart = err.response && (err.response.status === 502 || err.response.status === 503 || err.response.status === 504);
          const isTimeout = err.message && err.message.toLowerCase().includes('timeout');
          
          if ((isColdStart || isTimeout) && Date.now() - startTime < MAX_WAIT) {
            if (attempt === 1) setLoadingMsg('Waking up AI servers. This may take up to 6 minutes...');
            else setLoadingMsg(`Still waking up servers (Attempt ${attempt}). Please hold on...`);
            await new Promise(resolve => setTimeout(resolve, 15000));
          } else {
            throw err;
          }
        }
      }
      
      if (!success) {
        throw new Error('Server did not wake up in time. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
      setLoadingMsg('');
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

  let status = 'good';
  let title = 'Healthy Coral';
  let desc = 'The coral appears to be in a healthy condition with vibrant color and no signs of bleaching.';
  let rec = 'Coral appears healthy. Continue periodic monitoring and ensure water quality, temperature, and light conditions are optimal.';

  if (result) {
    if (result.riskLevel === 'Low' || result.riskLevel === 'Minimal') {
      status = 'good';
      title = 'Healthy Coral';
    } else if (result.riskLevel === 'Moderate') {
      status = 'warn';
      title = 'Early Stress Signs';
      desc = 'The coral shows mild discoloration and early signs of stress, though structure remains largely intact.';
      rec = 'Monitor closely over the coming weeks. Check for temperature spikes, pollution sources, or sedimentation nearby.';
    } else {
      status = 'bad';
      title = 'Bleached / Damaged';
      desc = 'The coral shows significant paling and structural damage consistent with bleaching or physical stress.';
      rec = 'Immediate attention recommended. Reduce local stressors and report to local marine conservation authorities if in the wild.';
    }
  }

  const confidence = result?.classification?.confidence ? Math.round(result.classification.confidence * 100) : 0;
  const circumference = 2 * Math.PI * 50;
  const offset = circumference - (confidence / 100) * circumference;
  
  const isVideo = file?.type.startsWith('video/');

  return (
    <div className="layout" style={{ display: 'grid', gridTemplateColumns: '232px 1fr', minHeight: '100vh' }}>
      <Sidebar />
      <main className="main" style={{ padding: '26px 30px 40px', overflowX: 'hidden' }}>
        
        {/* PREMIUM HERO HEADER */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ position: 'relative', marginBottom: 36, padding: '32px', borderRadius: 16, background: 'linear-gradient(135deg, var(--card) 0%, rgba(14,33,62,0.3) 100%)', border: '1px solid var(--card-border)', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-50%', right: '-10%', width: '50%', height: '200%', background: 'radial-gradient(ellipse at center, rgba(79,214,232,0.15) 0%, transparent 70%)', transform: 'rotate(-15deg)', pointerEvents: 'none' }}></div>
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
            <div>
              <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                AI Core Analysis
                <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 8px', borderRadius: 6, background: 'rgba(94,224,145,0.15)', color: 'var(--green)', letterSpacing: 0.5, border: '1px solid rgba(94,224,145,0.3)' }}>ONLINE</span>
              </h2>
              <p style={{ color: 'var(--text-dim)', fontSize: 15, maxWidth: 500, lineHeight: 1.5 }}>Upload high-resolution coral imagery to initialize our deep learning pipeline. The system will automatically detect bleaching, disease, and exact geographical coordinates.</p>
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ background: 'var(--input-bg)', border: '1px solid var(--card-border)', padding: '12px 16px', borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>Model Version</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--cyan)' }}>CoralNet-v2.4</span>
              </div>
              <div style={{ background: 'var(--input-bg)', border: '1px solid var(--card-border)', padding: '12px 16px', borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>Model Confidence</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: result ? 'var(--cyan)' : 'var(--text-dim)' }}>
                  {result ? `${confidence}%` : '--'}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 24, alignItems: 'start' }}>
          
          {/* UPLOAD / CAPTURE PANEL */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 16, padding: 26, boxShadow: '0 10px 30px -15px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 17, fontWeight: 700, marginBottom: 20 }}>
              <span style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg,#3b9eff,#4fd6e8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#04101f', flex: 'none' }}>1</span>
              Source Imagery
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 20, background: 'var(--input-bg)', padding: 6, borderRadius: 12 }}>
              <button 
                onClick={() => { setActiveTab('upload'); setFile(null); setPreview(null); }}
                style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: activeTab === 'upload' ? 'var(--card)' : 'transparent', color: activeTab === 'upload' ? 'var(--text)' : 'var(--text-dim)', fontWeight: 600, cursor: 'pointer', boxShadow: activeTab === 'upload' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none', transition: '0.2s' }}
              >
                File Upload
              </button>
              <button 
                onClick={() => { setActiveTab('live'); setFile(null); setPreview(null); }}
                style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: activeTab === 'live' ? 'var(--card)' : 'transparent', color: activeTab === 'live' ? 'var(--text)' : 'var(--text-dim)', fontWeight: 600, cursor: 'pointer', boxShadow: activeTab === 'live' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none', transition: '0.2s' }}
              >
                Live Capture
              </button>
            </div>

            {activeTab === 'upload' && !file && (
              <motion.div 
                {...getRootProps()} 
                animate={{ borderColor: isDragActive ? '#4fd6e8' : 'rgba(120,170,230,0.35)', backgroundColor: isDragActive ? 'rgba(79,214,232,0.06)' : 'var(--input-bg)' }}
                style={{ border: `2px dashed`, borderRadius: 16, padding: '44px 20px', textAlign: 'center', cursor: 'pointer', transition: 'border-color .2s, background-color .2s', position: 'relative', overflow: 'hidden' }}
              >
                <input {...getInputProps()} />
                
                <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <motion.div animate={{ scale: isDragActive ? 1.1 : 1 }} style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(59,158,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, color: 'var(--cyan)' }}>
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                  </motion.div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: 'var(--text)' }}>Drag & Drop Media Here</h3>
                  <p style={{ color: 'var(--text-faint)', fontSize: 13, marginBottom: 18, maxWidth: 220 }}>Supports JPG, PNG, and WebP, MP4, WebM up to 25MB.</p>
                  <span style={{ display: 'inline-block', padding: '10px 24px', borderRadius: 9, background: 'var(--cyan)', color: '#04101f', fontSize: 13.5, fontWeight: 600, boxShadow: '0 4px 14px rgba(79,214,232,0.3)' }}>Browse Files</span>
                </div>
              </motion.div>
            )}

            {activeTab === 'live' && !file && (
              <div style={{ position: 'relative', width: '100%', height: 320, background: '#000', borderRadius: 14, overflow: 'hidden', marginBottom: 20 }}>
                <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                
                <div style={{ position: 'absolute', bottom: 20, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 16 }}>
                  {!isRecording ? (
                    <>
                      <button onClick={capturePhoto} style={{ width: 54, height: 54, borderRadius: '50%', background: '#fff', border: '4px solid rgba(255,255,255,0.4)', cursor: 'pointer', transition: '0.2s', boxShadow: '0 4px 10px rgba(0,0,0,0.5)' }} title="Take Photo"></button>
                      <button onClick={startRecording} style={{ width: 54, height: 54, borderRadius: '50%', background: 'var(--red)', border: '4px solid rgba(255,107,107,0.4)', cursor: 'pointer', transition: '0.2s', boxShadow: '0 4px 10px rgba(0,0,0,0.5)' }} title="Start Recording Video"></button>
                    </>
                  ) : (
                    <button onClick={stopRecording} style={{ width: 54, height: 54, borderRadius: '12%', background: 'var(--red)', border: '4px solid rgba(255,107,107,0.4)', cursor: 'pointer', transition: '0.2s', animation: 'pulse 1.5s infinite', boxShadow: '0 4px 10px rgba(0,0,0,0.5)' }} title="Stop Recording"></button>
                  )}
                </div>
                {isRecording && (
                  <div style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,0,0,0.8)', color: '#fff', padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, background: '#fff', borderRadius: '50%', animation: 'pulse 1s infinite' }}></div>
                    REC
                  </div>
                )}
                <style>{`@keyframes pulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.05); opacity: 0.8; } 100% { transform: scale(1); opacity: 1; } }`}</style>
              </div>
            )}

            <AnimatePresence>
              {file && (
                <motion.div initial={{ opacity: 0, height: 0, marginTop: 0 }} animate={{ opacity: 1, height: 'auto', marginTop: 10 }} exit={{ opacity: 0, height: 0, marginTop: 0 }} style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: 13.5, color: 'var(--text-dim)', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flex: 'none' }}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> 
                      {file.name}
                    </span>
                    <button onClick={() => { setFile(null); setPreview(null); }} style={{ background: 'rgba(255,107,107,0.1)', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 6, flex: 'none' }}>Discard</button>
                  </div>
                  
                  <div style={{ width: '100%', height: 240, borderRadius: 14, overflow: 'hidden', background: '#081a30', border: '1px solid var(--card-border)', position: 'relative' }}>
                    {isVideo ? (
                      <video src={preview} controls style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: loading ? 0.6 : 1 }} />
                    ) : (
                      <img src={preview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: loading ? 0.6 : 1, transition: 'opacity 0.3s' }} />
                    )}
                    
                    {/* Scanning Animation */}
                    {loading && (
                      <>
                        <motion.div 
                          initial={{ top: '-10%' }}
                          animate={{ top: '110%' }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          style={{ position: 'absolute', left: 0, right: 0, height: 100, background: 'linear-gradient(180deg, transparent, rgba(79,214,232,0.4) 95%, #4fd6e8 100%)', borderBottom: '2px solid #4fd6e8', zIndex: 10, pointerEvents: 'none' }}
                        />
                        <div style={{ position: 'absolute', inset: 0, background: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M 20 0 L 0 0 0 20\' fill=\'none\' stroke=\'rgba(79,214,232,0.2)\' stroke-width=\'1\'/%3E%3C/svg%3E")', zIndex: 5, pointerEvents: 'none' }}></div>
                      </>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 12, top: 11, fontSize: 12, color: 'var(--text-faint)', fontWeight: 600 }}>LAT</span>
                      <input type="number" value={lat} onChange={(e) => setLat(e.target.value)} style={{ width: '100%', background: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: 9, padding: '10px 14px 10px 42px', color: 'var(--text)', outline: 'none', fontSize: 14 }} />
                    </div>
                    <div style={{ flex: 1, position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 12, top: 11, fontSize: 12, color: 'var(--text-faint)', fontWeight: 600 }}>LNG</span>
                      <input type="number" value={lng} onChange={(e) => setLng(e.target.value)} style={{ width: '100%', background: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: 9, padding: '10px 14px 10px 42px', color: 'var(--text)', outline: 'none', fontSize: 14 }} />
                    </div>
                    <button onClick={getLocation} style={{ background: 'rgba(59,158,255,0.1)', border: '1px solid rgba(59,158,255,0.2)', borderRadius: 9, padding: '0 16px', color: 'var(--blue)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: 13, transition: '0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(59,158,255,0.2)'} onMouseOut={e => e.currentTarget.style.background = 'rgba(59,158,255,0.1)'} title="Auto-detect Location">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg> GPS
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button 
              onClick={handleAnalyze} 
              disabled={!file || loading}
              style={{ width: '100%', marginTop: 24, background: 'linear-gradient(90deg,#3b7dff,#4fd6e8)', color: '#04101f', border: 'none', padding: '14px 26px', borderRadius: 11, fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, cursor: !file || loading ? 'not-allowed' : 'pointer', opacity: !file || loading ? 0.6 : 1, boxShadow: !file || loading ? 'none' : '0 8px 24px -8px rgba(59, 158, 255, 0.6)', transition: '0.2s' }}
            >
              {loading ? (
                <div style={{ width: 18, height: 18, border: '2px solid rgba(4,16,31,0.3)', borderTopColor: '#04101f', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 12h4l2-7 4 14 2-7h6"/></svg>
              )}
              {loading ? (loadingMsg.includes('Waking') ? 'Waking up servers...' : 'Executing Neural Analysis...') : 'Execute Analysis'}
            </button>
            
            {error && (
              <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} style={{ color: 'var(--red)', fontSize: 13, marginTop: 14, textAlign: 'center', background: 'rgba(255,107,107,0.1)', padding: '8px', borderRadius: 8, border: '1px solid rgba(255,107,107,0.2)' }}>
                {error}
              </motion.div>
            )}
          </div>

          {/* RESULTS PANEL */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 16, padding: 26, boxShadow: '0 10px 30px -15px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 17, fontWeight: 700, marginBottom: 20 }}>
              <span style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg,#3b9eff,#4fd6e8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#04101f', flex: 'none' }}>2</span>
              Analysis Pipeline Output
            </div>

            {/* SKELETON EMPTY STATE */}
            {!result && !loading && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minHeight: 400 }}>
                <div style={{ position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(var(--bg-deep-rgb), 0.5)', backdropFilter: 'blur(5px)', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 12 }}>
                    <svg style={{ color: 'var(--cyan)', opacity: 0.8, marginBottom: 16 }} width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/></svg>
                    <p style={{ color: 'var(--text)', fontSize: 16, fontWeight: 600 }}>Awaiting Media</p>
                    <p style={{ color: 'var(--text-dim)', fontSize: 13, marginTop: 4 }}>Provide media to unlock the AI dashboard</p>
                  </div>

                  <div style={{ background: 'var(--input-bg)', border: '1px solid var(--card-border)', borderRadius: 12, padding: 18, opacity: 0.4 }}>
                    <div style={{ height: 14, width: 80, background: 'var(--card-border)', borderRadius: 4, marginBottom: 12 }}></div>
                    <div style={{ height: 28, width: 200, background: 'var(--card-border)', borderRadius: 6, marginBottom: 8 }}></div>
                    <div style={{ height: 12, width: '100%', background: 'var(--card-border)', borderRadius: 4, marginBottom: 6 }}></div>
                    <div style={{ height: 12, width: '80%', background: 'var(--card-border)', borderRadius: 4 }}></div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 16, opacity: 0.4 }}>
                    <div style={{ background: 'var(--input-bg)', border: '1px solid var(--card-border)', borderRadius: 12, padding: 18, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ height: 14, width: 100, background: 'var(--card-border)', borderRadius: 4, marginBottom: 16 }}></div>
                      <div style={{ width: 90, height: 90, borderRadius: '50%', border: '8px solid var(--card-border)' }}></div>
                    </div>
                    <div style={{ background: 'var(--input-bg)', border: '1px solid var(--card-border)', borderRadius: 12, padding: 18 }}>
                      <div style={{ height: 14, width: 120, background: 'var(--card-border)', borderRadius: 4, marginBottom: 16 }}></div>
                      {[1,2,3,4].map(i => (
                        <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                          <div style={{ width: 40, height: 12, background: 'var(--card-border)', borderRadius: 4 }}></div>
                          <div style={{ flex: 1, height: 12, background: 'var(--card-border)', borderRadius: 4 }}></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* LOADING STATE */}
            {loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'var(--text-faint)', gap: 24, minHeight: 400 }}>
                <div style={{ position: 'relative', width: 90, height: 90 }}>
                  <svg width="90" height="90" viewBox="0 0 100 100" style={{ animation: 'spin 6s linear infinite' }}>
                    <circle cx="50" cy="50" r="45" fill="none" stroke="var(--cyan)" strokeWidth="1" strokeDasharray="5 15" opacity="0.5" />
                  </svg>
                  <svg width="90" height="90" viewBox="0 0 100 100" style={{ animation: 'spin 4s linear infinite reverse', position: 'absolute', top: 0, left: 0 }}>
                    <circle cx="50" cy="50" r="35" fill="none" stroke="var(--blue)" strokeWidth="1.5" strokeDasharray="10 10" opacity="0.7" />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 44, height: 44, border: '3px solid rgba(79,214,232,.15)', borderTopColor: 'var(--cyan)', borderRadius: '50%', animation: 'spin 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite' }}></div>
                  </div>
                </div>
                <div>
                  <h3 style={{ color: 'var(--text)', fontSize: 17, fontWeight: 700, marginBottom: 6 }}>Deep Learning Pipeline Active</h3>
                  <p style={{ fontSize: 13.5, maxWidth: 280, margin: '0 auto', color: 'var(--text-dim)', lineHeight: 1.5 }}>
                    {loadingMsg || 'Extracting spatial features via 34-layer convolutional neural network...'}
                  </p>
                </div>
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              </motion.div>
            )}

            {/* RESULT STATE */}
            {result && !loading && (
              <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
                <div style={{ background: status === 'good' ? 'rgba(94,224,145,0.08)' : status === 'warn' ? 'rgba(255,203,102,0.08)' : 'rgba(255,107,107,0.08)', border: `1px solid ${status === 'good' ? 'rgba(94,224,145,0.3)' : status === 'warn' ? 'rgba(255,203,102,0.35)' : 'rgba(255,107,107,0.35)'}`, borderRadius: 12, padding: '20px', marginBottom: 16 }}>
                  <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600, color: 'var(--text-faint)', marginBottom: 6 }}>Classification Match</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 24, fontWeight: 800, marginBottom: 8, color: status === 'good' ? 'var(--green)' : status === 'warn' ? 'var(--amber)' : 'var(--red)' }}>
                    {title}
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                  </div>
                  <div style={{ color: 'var(--text-dim)', fontSize: 13.5, lineHeight: 1.5 }}>{desc}</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 16 }}>
                  <div style={{ background: 'var(--input-bg)', border: '1px solid var(--card-border)', borderRadius: 12, padding: 20 }}>
                    <h4 style={{ fontSize: 13, color: 'var(--text-dim)', fontWeight: 600, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5 }}>Network Confidence</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ position: 'relative', width: 120, height: 120 }}>
                        <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
                          <circle cx="60" cy="60" r="50" fill="none" stroke="var(--card-border)" strokeWidth="10"/>
                          <circle cx="60" cy="60" r="50" fill="none" stroke="url(#ringGrad)" strokeWidth="10" strokeLinecap="round" strokeDasharray={2 * Math.PI * 50} strokeDashoffset={(2 * Math.PI * 50) - (confidence / 100) * (2 * Math.PI * 50)} style={{ transition: 'stroke-dashoffset 1s ease-out' }}/>
                          <defs><linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#4fd6e8"/><stop offset="100%" stopColor="#3b7dff"/></linearGradient></defs>
                        </svg>
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>{confidence}%</div>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 12, fontWeight: 500 }}>{confidence > 95 ? 'Highly Accurate Match' : 'Accurate Match'}</div>
                    </div>
                  </div>

                  <div style={{ background: 'var(--input-bg)', border: '1px solid var(--card-border)', borderRadius: 12, padding: 20 }}>
                    <h4 style={{ fontSize: 13, color: 'var(--text-dim)', fontWeight: 600, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5 }}>Pixel Distribution</h4>
                    
                    {[
                      { label: 'Healthy', val: result.healthyCoralPct, color: 'linear-gradient(90deg,#4fd6e8,#5ee091)' },
                      { label: 'Bleached', val: result.bleachedCoralPct, color: 'linear-gradient(90deg,#ffcb66,#ff6b6b)' },
                      { label: 'Dead', val: result.deadCoralPct, color: 'linear-gradient(90deg,#ff6b6b,#c92a2a)' },
                      { label: 'Algae', val: result.algaePct, color: 'linear-gradient(90deg,#5ee091,#2f9e44)' }
                    ].map(item => (
                      <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, fontSize: 12.5 }}>
                        <span style={{ width: 62, color: 'var(--text-dim)', flex: 'none', fontWeight: 500 }}>{item.label}</span>
                        <div style={{ flex: 1, height: 6, borderRadius: 99, background: 'var(--card-border)', overflow: 'hidden' }}>
                          <motion.div initial={{ width: 0 }} animate={{ width: `${item.val}%` }} transition={{ duration: 1, delay: 0.2 }} style={{ height: '100%', borderRadius: 99, background: item.color }}></motion.div>
                        </div>
                        <span style={{ width: 34, textAlign: 'right', color: 'var(--text)', flex: 'none', fontWeight: 600 }}>{item.val}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 14, background: 'rgba(255,203,102,0.06)', border: '1px solid rgba(255,203,102,0.25)', borderRadius: 12, padding: '18px 20px' }}>
                  <span style={{ color: 'var(--amber)', flex: 'none', marginTop: 2 }}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18h6M10 22h4M12 2a7 7 0 00-4 12.7c.6.5 1 1.2 1 2.3h6c0-1.1.4-1.8 1-2.3A7 7 0 0012 2z"/></svg></span>
                  <div>
                    <h5 style={{ fontSize: 14, fontWeight: 700, marginBottom: 6, color: 'var(--text)' }}>Actionable Recommendation</h5>
                    <p style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.5 }}>{rec}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                  {result.pdfUrl && (
                    <a href={result.pdfUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', background: 'var(--input-bg)', border: '1px solid var(--card-border)', borderRadius: 9, color: 'var(--text)', flex: 1, textDecoration: 'none', fontSize: 13.5, fontWeight: 600, transition: '0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseOut={e => e.currentTarget.style.background = 'var(--input-bg)'}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                      Download Report
                    </a>
                  )}
                  <button onClick={() => navigate('/history')} style={{ background: 'rgba(79,214,232,0.1)', border: '1px solid rgba(79,214,232,0.3)', color: 'var(--cyan)', borderRadius: 9, padding: '12px', flex: 1, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: '0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(79,214,232,0.15)'} onMouseOut={e => e.currentTarget.style.background = 'rgba(79,214,232,0.1)'}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    View History
                  </button>
                </div>

              </motion.div>
            )}
          </div>
          
        </div>

        {/* BOTTOM INFO CARDS */}
        <div style={{ marginTop: 40, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 14, padding: 24, display: 'flex', gap: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(59,158,255,0.1)', color: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
            </div>
            <div>
              <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Advanced Segmentation</h4>
              <p style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.5 }}>Our models isolate coral colonies from backgrounds, distinguishing between sand, rock, and active reef formations.</p>
            </div>
          </div>
          <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 14, padding: 24, display: 'flex', gap: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(255,107,107,0.1)', color: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            </div>
            <div>
              <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Early Bleach Detection</h4>
              <p style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.5 }}>Detects subtle shifts in zooxanthellae pigmentation weeks before visible bleaching occurs to the naked eye.</p>
            </div>
          </div>
          <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 14, padding: 24, display: 'flex', gap: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(94,224,145,0.1)', color: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            </div>
            <div>
              <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Global Mapping</h4>
              <p style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.5 }}>Uploaded imagery with EXIF coordinates is automatically plotted on our global real-time health dashboard.</p>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}

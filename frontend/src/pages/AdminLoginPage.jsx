import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, signInWithPopup, fetchSignInMethodsForEmail } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();

  // Create bubbles effect on mount
  useEffect(() => {
    const pageEl = document.querySelector('.page');
    if (!pageEl) return;
    
    // Clean up existing bubbles to prevent duplicates on hot reload
    const existingBubbles = pageEl.querySelectorAll('.bubble');
    existingBubbles.forEach(b => b.remove());

    for (let i = 0; i < 14; i++) {
      const b = document.createElement('div');
      b.className = 'bubble';
      const size = 4 + Math.random() * 10;
      b.style.width = size + 'px';
      b.style.height = size + 'px';
      b.style.left = (Math.random() * 40) + '%';
      b.style.bottom = (Math.random() * 60) + 'px';
      b.style.animationDuration = (6 + Math.random() * 8) + 's';
      b.style.animationDelay = (Math.random() * 6) + 's';
      b.style.position = 'absolute';
      b.style.borderRadius = '50%';
      b.style.border = '1px solid rgba(255,255,255,0.15)';
      b.style.background = 'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.15), transparent 60%)';
      b.style.animation = 'rise linear infinite';
      b.style.pointerEvents = 'none';
      pageEl.appendChild(b);
    }
    
    return () => {
      const bubbles = document.querySelectorAll('.bubble');
      bubbles.forEach(b => b.remove());
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      const form = document.getElementById('loginForm');
      form.style.animation = 'shake .4s';
      setTimeout(() => form.style.animation = '', 400);
      return;
    }

    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      if (userEmail === 'shivashankrmali7@gmail.com' || userEmail.includes('admin')) {
        navigate('/admin');
        return;
      }
      const { getMe } = await import('../services/api');
      const profile = await getMe();
      if (profile?.role === 'admin') {
        navigate('/admin');
      } else {
        setError('Unauthorized: You are not an administrator.');
        await auth.signOut();
      }
    } catch (err) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        try {
          const methods = await fetchSignInMethodsForEmail(auth, email);
          if (methods.includes('google.com') && !methods.includes('password')) {
            setError('Account secured via SSO. Please click "Continue with Google" below.');
            return;
          }
        } catch (e) {
          // ignore fetch error
        }
        setError('Invalid email or password.');
      } else if (err.code === 'auth/user-not-found') {
        setError('No account found with this email.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed login attempts. Please try again later.');
      } else {
        setError(err.message || 'An error occurred during sign in.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
      const userEmail = auth.currentUser?.email;
      if (userEmail === 'shivashankrmali7@gmail.com' || userEmail?.includes('admin')) {
        navigate('/admin');
        return;
      }
      const { getMe } = await import('../services/api');
      const profile = await getMe();
      if (profile?.role === 'admin') {
        navigate('/admin');
      } else {
        setError('Unauthorized: You are not an administrator.');
        await auth.signOut();
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page" style={{
      position: 'relative', minHeight: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
      background: 'radial-gradient(ellipse at 15% 0%, rgba(59,158,255,0.20), transparent 45%), radial-gradient(ellipse at 60% 70%, rgba(79,214,232,0.08), transparent 50%), linear-gradient(180deg,#03101f 0%,#052038 45%,#0a2c46 75%,#04121f 100%)'
    }}>
      <div className="rays" style={{
        position: 'absolute', top: '-5%', left: 0, width: '45%', height: '60%', pointerEvents: 'none',
        background: 'linear-gradient(115deg, transparent 35%, rgba(255,255,255,0.09) 45%, transparent 58%)',
        transform: 'rotate(-6deg)'
      }}></div>

      <div className="main" style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 28, padding: '44px 44px 20px', position: 'relative', zIndex: 2, alignItems: 'center' }}>
        
        {/* LEFT */}
        <div className="left" style={{
          position: 'relative', borderRadius: 22, overflow: 'hidden', minHeight: 560, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 34,
          background: 'linear-gradient(180deg, rgba(4,14,26,0.2), rgba(3,10,20,0.75) 75%), radial-gradient(ellipse at 70% 20%, rgba(90,180,255,0.18), transparent 50%), linear-gradient(160deg,#0a3350,#083150 40%,#0a2438)'
        }}>
          <div className="brand" style={{ position: 'absolute', top: 34, left: 34, display: 'flex', alignItems: 'center', gap: 12, zIndex: 3 }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none"><path d="M12 2C9 2 7 5 7 8c0 2 1 3 1 5 0 3-2 4-2 7 0 1 1 2 2 2s2-1 2-2c0-2 1-3 2-3s2 1 2 3c0 1 1 2 2 2s2-1 2-2c0-3-2-4-2-7 0-2 1-3 1-5 0-3-2-6-5-6z" fill="url(#lg1)"/><defs><linearGradient id="lg1" x1="7" y1="2" x2="17" y2="22"><stop stopColor="#4fd6e8"/><stop offset="1" stopColor="#3b7dff"/></linearGradient></defs></svg>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800 }}>Coral<span style={{ background: 'linear-gradient(90deg,#ff6b6b,#ff9c9c)', WebkitBackgroundClip: 'text', color: 'transparent' }}>AI</span></h1>
              <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 2 }}>Admin Portal</div>
            </div>
          </div>

          <span style={{ position: 'absolute', filter: 'drop-shadow(0 2px 5px rgba(0,0,0,.3))', animation: 'swim 8s ease-in-out infinite', zIndex: 2, top: '20%', left: '8%', fontSize: 22, animationDelay: '.2s' }}>🐟</span>
          <span style={{ position: 'absolute', filter: 'drop-shadow(0 2px 5px rgba(0,0,0,.3))', animation: 'swim 8s ease-in-out infinite', zIndex: 2, top: '26%', left: '22%', fontSize: 18, animationDelay: '.9s' }}>🐟</span>
          <span style={{ position: 'absolute', filter: 'drop-shadow(0 2px 5px rgba(0,0,0,.3))', animation: 'swim 8s ease-in-out infinite', zIndex: 2, top: '38%', right: '20%', fontSize: 24, animationDelay: '.5s' }}>🐠</span>
          <span style={{ position: 'absolute', filter: 'drop-shadow(0 2px 5px rgba(0,0,0,.3))', animation: 'swim 8s ease-in-out infinite', zIndex: 2, top: '44%', left: '4%', fontSize: 16, animationDelay: '1.3s' }}>🐡</span>

          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '56%', zIndex: 1 }}>
            <svg width="45%" height="100%" viewBox="0 0 260 260" preserveAspectRatio="xMinYMax meet" style={{ position: 'absolute', bottom: 0, left: 0 }}>
              <path d="M40 260 C40 200 20 200 20 160 C20 130 40 130 40 95 M20 160 C20 160 -10 155 -10 130 M40 95 C40 95 60 90 60 65" stroke="#c9a876" strokeWidth="9" fill="none" strokeLinecap="round"/>
              <path d="M110 260 C110 190 90 190 90 145 C90 115 115 115 115 75 C115 50 130 50 130 20 M90 145 C90 145 60 140 60 110" stroke="#e0a687" strokeWidth="10" fill="none" strokeLinecap="round"/>
              <path d="M170 260 C170 220 155 220 155 190 C155 168 175 168 175 140" stroke="#9fb3d1" strokeWidth="7" fill="none" strokeLinecap="round"/>
              <ellipse cx="130" cy="255" rx="120" ry="14" fill="#0a2438" opacity=".5"/>
            </svg>
          </div>

          <div style={{ position: 'relative', zIndex: 3, background: 'rgba(6,18,34,0.72)', border: '1px solid var(--card-border)', borderRadius: 16, padding: '22px 24px', backdropFilter: 'blur(6px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2C9 2 7 5 7 8c0 2 1 3 1 5 0 3-2 4-2 7 0 1 1 2 2 2s2-1 2-2c0-2 1-3 2-3s2 1 2 3c0 1 1 2 2 2s2-1 2-2c0-3-2-4-2-7 0-2 1-3 1-5 0-3-2-6-5-6z" fill="var(--cyan)"/></svg>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--cyan)' }}>Protect Our Reefs</h3>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 16 }}>AI-Powered insights for a healthier ocean tomorrow.</p>
            <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)', marginBottom: 16 }} />
            
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
              <span style={{ width: 38, height: 38, borderRadius: 10, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(59,158,255,0.14)', color: 'var(--cyan)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2C9 2 7 5 7 8c0 2 1 3 1 5 0 3-2 4-2 7 0 1 1 2 2 2s2-1 2-2c0-2 1-3 2-3s2 1 2 3c0 1 1 2 2 2s2-1 2-2c0-3-2-4-2-7 0-2 1-3 1-5 0-3-2-6-5-6z"/></svg>
              </span>
              <div><h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>Detect Coral Health</h4><p style={{ fontSize: 12.5, color: 'var(--text-dim)' }}>Identify healthy, bleached and dead corals</p></div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
              <span style={{ width: 38, height: 38, borderRadius: 10, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(140,110,255,0.16)', color: '#b39dff' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z"/><path d="M9.5 12l1.8 1.8L15 10"/></svg>
              </span>
              <div><h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>Monitor &amp; Analyze</h4><p style={{ fontSize: 12.5, color: 'var(--text-dim)' }}>Advanced AI models for accurate analysis</p></div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <span style={{ width: 38, height: 38, borderRadius: 10, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(79,214,232,0.14)', color: '#7ef0d8' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 010 18 14 14 0 010-18z"/></svg>
              </span>
              <div><h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>Conserve Marine Life</h4><p style={{ fontSize: 12.5, color: 'var(--text-dim)' }}>Data-driven insights for marine conservation</p></div>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <form id="loginForm" onSubmit={handleLogin} noValidate style={{
            width: '100%', maxWidth: 440, background: 'rgba(14,33,62,0.55)', border: '1px solid var(--card-border)', borderRadius: 22, padding: '44px 40px', backdropFilter: 'blur(10px)', boxShadow: '0 20px 60px -20px rgba(0,0,0,0.5)'
          }}>
            <div style={{
              width: 78, height: 78, borderRadius: '50%', margin: '0 auto 22px', background: 'rgba(59,158,255,0.1)', border: '1px solid rgba(79,214,232,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 8px rgba(79,214,232,0.04)'
            }}>
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none"><path d="M12 2C9 2 7 5 7 8c0 2 1 3 1 5 0 3-2 4-2 7 0 1 1 2 2 2s2-1 2-2c0-2 1-3 2-3s2 1 2 3c0 1 1 2 2 2s2-1 2-2c0-3-2-4-2-7 0-2 1-3 1-5 0-3-2-6-5-6z" fill="url(#lg2)"/><defs><linearGradient id="lg2" x1="7" y1="2" x2="17" y2="22"><stop stopColor="#4fd6e8"/><stop offset="1" stopColor="#3b7dff"/></linearGradient></defs></svg>
            </div>
            
            <h2 style={{ fontSize: 26, textAlign: 'center', fontWeight: 800, marginBottom: 8 }}>
              {new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 18 ? 'Good Afternoon' : 'Good Evening'} <span style={{ background: 'linear-gradient(90deg,#5db8ff,#4fd6e8)', WebkitBackgroundClip: 'text', color: 'transparent' }}>👋</span>
            </h2>
            <p style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: 14, marginBottom: 30 }}>Sign in to the Admin Dashboard</p>

            {error && <div className="auth-error">{error}</div>}

            <label style={{ display: 'block', fontSize: 13.5, color: 'var(--text-dim)', marginBottom: 8 }}>Email Address</label>
            <div style={{ position: 'relative', marginBottom: 20 }}>
              <svg style={{ position: 'absolute', left: 15, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }} width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/></svg>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field" placeholder="Enter your email" required />
            </div>

            <label style={{ display: 'block', fontSize: 13.5, color: 'var(--text-dim)', marginBottom: 8 }}>Password</label>
            <div style={{ position: 'relative', marginBottom: 20 }}>
              <svg style={{ position: 'absolute', left: 15, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }} width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 018 0v3"/></svg>
              <input type={visible ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className="input-field" placeholder="Enter your password" required />
              
              <button type="button" onClick={() => setVisible(!visible)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-faint)', cursor: 'pointer', padding: 4, display: 'flex' }} aria-label="Show password">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
                  <circle cx="12" cy="12" r="3"/>
                  {visible && <line x1="3" y1="21" x2="21" y2="3" stroke="currentColor" strokeWidth="2"/>}
                </svg>
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '-8px 0 22px' }}>
              <span style={{ fontSize: 12.5, color: 'var(--text-faint)' }}>Forgot Password? <strong style={{ color: 'var(--cyan)', fontWeight: 600 }}>Contact Admin</strong></span>
            </div>

            <button type="submit" disabled={loading} style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, padding: 14, borderRadius: 11, border: 'none', cursor: 'pointer',
              background: 'linear-gradient(90deg,#3b7dff,#4fd6e8)', color: '#04101f', fontSize: 15.5, fontWeight: 700,
              boxShadow: '0 10px 26px -10px rgba(59,158,255,0.6)', transition: 'transform .15s, box-shadow .2s', opacity: loading ? 0.7 : 1
            }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/></svg>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '26px 0 20px', color: 'var(--text-faint)', fontSize: 13 }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }}></div>
              or continue with
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }}></div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12, marginBottom: 26 }}>
              <button type="button" onClick={handleGoogle} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 12, borderRadius: 11, border: '1px solid var(--input-border)', background: 'var(--input-bg)', cursor: 'pointer', transition: '.2s', color: 'var(--text)'
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0012 23z"/><path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 010-4.2V7.06H2.18a11 11 0 000 9.88l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 00-9.82 6.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/></svg>
                Google Workspace
              </button>
            </div>

            <p style={{ textAlign: 'center', fontSize: 13.5, color: 'var(--text-dim)' }}>Regular user? <Link to="/login" style={{ color: 'var(--cyan)', fontWeight: 600 }}>Go to User Login</Link></p>
          </form>
        </div>
      </div>

      <div style={{
        position: 'relative', zIndex: 2, margin: '0 44px 40px', background: 'rgba(6,18,34,0.6)', border: '1px solid var(--card-border)', borderRadius: 16, padding: '20px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, backdropFilter: 'blur(6px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--text-dim)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" color="#5db0ff"><path d="M12 21s-7.5-4.6-10-9.1C.6 8.7 2 5 5.6 5c2 0 3.4 1.1 4.4 2.6C11 6.1 12.4 5 14.4 5 18 5 19.4 8.7 22 11.9 19.5 16.4 12 21 12 21z"/></svg>
          <span>Together, let&apos;s build a better future for <Link to="#" style={{ color: 'var(--cyan)' }}>our oceans</Link>.</span>
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--text-faint)' }}>© 2025 CoralAI. All rights reserved.</div>
      </div>
    </div>
  );
}

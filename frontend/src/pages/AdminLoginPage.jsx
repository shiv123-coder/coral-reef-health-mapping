import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Email and Password are required.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      const { getMe } = await import('../services/api');
      const profile = await getMe();
      const userEmail = auth.currentUser?.email || email;
      
      if (profile?.role === 'admin' || userEmail === 'shivashankrmali7@gmail.com' || userEmail.includes('admin')) {
        navigate('/admin');
      } else {
        setError('Unauthorized: You do not have administrative privileges.');
        await auth.signOut();
      }
    } catch (err) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setError('Invalid admin credentials.');
      } else {
        setError(err.message || 'An error occurred during authentication.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%', fontFamily: '"Inter", "Segoe UI", sans-serif', background: '#0f172a', color: '#f8fafc' }}>
      
      {/* Left Side - Brand Branding */}
      <div style={{ flex: 1, display: 'none', '@media (min-width: 768px)': { display: 'flex' }, flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'linear-gradient(135deg, #020617 0%, #0f172a 100%)', borderRight: '1px solid #1e293b', padding: 40 }}>
        <div style={{ maxWidth: 400 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{ width: 40, height: 40, background: '#ef4444', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>CoralAI <span style={{ color: '#ef4444' }}>Admin</span></h1>
          </div>
          <p style={{ color: '#94a3b8', fontSize: 16, lineHeight: 1.6 }}>
            Enterprise dashboard for system administration, access management, and global analytics. Authorized personnel only.
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: 40, background: '#0f172a' }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          
          <div style={{ marginBottom: 40, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, color: '#ef4444' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>Secure Portal</span>
            </div>
            <h2 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Sign in to Admin</h2>
            <p style={{ color: '#94a3b8', margin: 0, fontSize: 14 }}>Enter your administrator credentials to proceed.</p>
          </div>

          {error && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '12px 16px', borderRadius: 6, fontSize: 13, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#cbd5e1', marginBottom: 6 }}>Admin Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@coral.ai"
                style={{ width: '100%', padding: '12px 14px', background: '#1e293b', border: '1px solid #334155', borderRadius: 6, color: '#f8fafc', fontSize: 14, outline: 'none', transition: 'border-color 0.2s' }}
                onFocus={(e) => e.target.style.borderColor = '#ef4444'}
                onBlur={(e) => e.target.style.borderColor = '#334155'}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#cbd5e1', marginBottom: 6 }}>Master Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ width: '100%', padding: '12px 14px', background: '#1e293b', border: '1px solid #334155', borderRadius: 6, color: '#f8fafc', fontSize: 14, outline: 'none', transition: 'border-color 0.2s' }}
                onFocus={(e) => e.target.style.borderColor = '#ef4444'}
                onBlur={(e) => e.target.style.borderColor = '#334155'}
              />
            </div>

            <button type="submit" disabled={loading} style={{ 
              width: '100%', padding: '12px', background: '#ef4444', color: '#ffffff', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 10, transition: 'background 0.2s', opacity: loading ? 0.7 : 1
            }}
            onMouseOver={(e) => !loading && (e.target.style.background = '#dc2626')}
            onMouseOut={(e) => !loading && (e.target.style.background = '#ef4444')}
            >
              {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
            </button>
          </form>

          <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Link to="/login" style={{ color: '#94a3b8', fontSize: 13, textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={(e) => e.target.style.color = '#f8fafc'} onMouseOut={(e) => e.target.style.color = '#94a3b8'}>
              &larr; Return to User Portal
            </Link>
          </div>

        </div>
      </div>

    </div>
  );
}

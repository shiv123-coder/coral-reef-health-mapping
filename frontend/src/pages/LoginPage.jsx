import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, signInWithPopup, fetchSignInMethodsForEmail } from 'firebase/auth';
import { motion } from 'framer-motion';
import { auth, googleProvider } from '../firebase';
import BackgroundOrbs from '../components/UI';
import PasswordField from '../components/PasswordField';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (err) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        try {
          const methods = await fetchSignInMethodsForEmail(auth, email);
          if (methods.includes('google.com') && !methods.includes('password')) {
            setError('Account secured via SSO. Please click "Continue with Google Workspace" below.');
            return;
          }
        } catch (e) {
          // ignore fetch error
        }
      }
      setError(err.message.replace('Firebase: ', '').replace(/\(auth\/.*\)/, '').trim());
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <BackgroundOrbs />
      <div className="auth-container">
        <motion.div
          className="auth-card glass"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Sign in to Coral Reef Health Mapping</p>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleLogin}>
            <div className="input-group">
              <label>Professional Email</label>
              <input
                type="email"
                className="input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@organization.org"
                required
              />
            </div>
            <PasswordField value={password} onChange={setPassword} />
            <button className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          <div className="auth-divider">or authenticate via SSO</div>

          <button className="btn btn-google" onClick={handleGoogle} type="button">
            Continue with Google Workspace
          </button>

          <p className="auth-footer">
            Don&apos;t have an account? <Link to="/signup">Create one</Link>
          </p>
        </motion.div>
      </div>
    </>
  );
}

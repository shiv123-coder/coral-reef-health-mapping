import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, googleProvider } from '../firebase';
import { registerProfile } from '../services/api';
import BackgroundOrbs from '../components/UI';
import PasswordField from '../components/PasswordField';

const STEPS = ['Account', 'Profile', 'Organization'];

export default function SignupPage() {
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    organization: '',
    role: 'student',
    phone: '',
    department: '',
    country: '',
  });

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const validateStep = () => {
    if (step === 0) {
      if (!form.email || !form.password) return 'Email and password required';
      if (form.password !== form.confirmPassword) return 'Passwords do not match';
      if (form.password.length < 8) return 'Password must be at least 8 characters';
    }
    if (step === 1) {
      if (!form.firstName || !form.lastName) return 'First and last name required';
    }
    if (step === 2) {
      if (!form.organization) return 'University/Organization required';
    }
    return null;
  };

  const nextStep = () => {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError('');
    setStep((s) => Math.min(s + 1, 2));
  };

  const handleGoogleSignup = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const token = await result.user.getIdToken();
      const names = (result.user.displayName || '').split(' ');
      await registerProfile({
        idToken: token,
        email: result.user.email,
        firstName: names[0] || 'User',
        lastName: names.slice(1).join(' ') || '',
        organization: form.organization || 'Not specified',
        role: form.role,
        phone: form.phone,
        department: form.department,
        country: form.country,
      });
      navigate('/dashboard');
    } catch (err) {
      if (err.response?.status === 409) {
        navigate('/dashboard');
      } else {
        setError(err.response?.data?.detail || err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    const err = validateStep();
    if (err) { setError(err); return; }

    setLoading(true);
    setError('');
    try {
      const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
      const token = await cred.user.getIdToken();
      await registerProfile({
        idToken: token,
        email: form.email,
        firstName: form.firstName,
        lastName: form.lastName,
        organization: form.organization,
        role: form.role,
        phone: form.phone,
        department: form.department,
        country: form.country,
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || err.message.replace('Firebase: ', ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <BackgroundOrbs />
      <div className="auth-container">
        <motion.div
          className="auth-card wide glass"
          initial={{ opacity: 0, scale: 0.95, rotateX: 10 }}
          animate={{ opacity: 1, scale: 1, rotateX: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{ perspective: 1000 }}
        >
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Join the Coral Reef Health Mapping platform</p>

          <div className="steps">
            {STEPS.map((s, i) => (
              <div key={s} className={`step-dot ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`} title={s} />
            ))}
          </div>

          {error && <div className="auth-error">{error}</div>}

          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="input-group">
                  <label>Professional Email</label>
                  <input type="email" className="input-field" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="name@organization.org" />
                </div>
                <PasswordField value={form.password} onChange={(v) => update('password', v)} label="Password" />
                <PasswordField value={form.confirmPassword} onChange={(v) => update('confirmPassword', v)} label="Confirm Password" placeholder="Re-enter password" />
                
                <div className="auth-divider" style={{ marginTop: 24 }}>or authenticate via SSO</div>
                <button className="btn btn-google" onClick={handleGoogleSignup} type="button" disabled={loading}>
                  Continue with Google Workspace
                </button>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="input-group">
                    <label>First Name</label>
                    <input className="input-field" value={form.firstName} onChange={(e) => update('firstName', e.target.value)} placeholder="Shiva" />
                  </div>
                  <div className="input-group">
                    <label>Last Name</label>
                    <input className="input-field" value={form.lastName} onChange={(e) => update('lastName', e.target.value)} placeholder="Mali" />
                  </div>
                </div>
                <div className="input-group">
                  <label>Phone Number (optional)</label>
                  <input className="input-field" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+91 9876543210" />
                </div>
                <div className="input-group">
                  <label>Country</label>
                  <input className="input-field" value={form.country} onChange={(e) => update('country', e.target.value)} placeholder="India" />
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="input-group">
                  <label>University / Organization</label>
                  <input className="input-field" value={form.organization} onChange={(e) => update('organization', e.target.value)} placeholder="Savitribai Phule Pune University" />
                </div>
                <div className="input-group">
                  <label>Department (optional)</label>
                  <input className="input-field" value={form.department} onChange={(e) => update('department', e.target.value)} placeholder="Computer Engineering" />
                </div>
                <div className="input-group">
                  <label>Role</label>
                  <select className="input-field" value={form.role} onChange={(e) => update('role', e.target.value)}>
                    <option value="marine_biologist">Marine Biologist (Field Agent)</option>
                    <option value="ngo_partner">NGO Partner</option>
                    <option value="auditor">Government Auditor</option>
                    <option value="student">Student / Academic</option>
                  </select>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            {step > 0 && (
              <button className="btn btn-ghost" onClick={() => setStep((s) => s - 1)} type="button">Back</button>
            )}
            {step < 2 ? (
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={nextStep} type="button">Continue</button>
            ) : (
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSubmit} disabled={loading} type="button">
                {loading ? 'Creating account...' : 'Complete Registration'}
              </button>
            )}
          </div>

          <p className="auth-footer">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </>
  );
}

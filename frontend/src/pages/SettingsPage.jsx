import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { auth, db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { EmailAuthProvider, reauthenticateWithCredential, updateEmail, updatePassword } from 'firebase/auth';
import Sidebar from '../components/Sidebar';
import { GlassCard } from '../components/UI';
import { User, Lock, Mail, Phone, Briefcase, MapPin, Save, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function SettingsPage() {
  const { user, profile } = useAuth();
  
  // Profile Form State
  const [firstName, setFirstName] = useState(profile?.firstName || '');
  const [lastName, setLastName] = useState(profile?.lastName || '');
  const [organization, setOrganization] = useState(profile?.organization || '');
  const [department, setDepartment] = useState(profile?.department || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [country, setCountry] = useState(profile?.country || '');
  
  // Security Form State
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Status States
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ text: '', type: '' });
  
  const [securityLoading, setSecurityLoading] = useState(false);
  const [securityMsg, setSecurityMsg] = useState({ text: '', type: '' });

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg({ text: '', type: '' });
    
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        firstName,
        lastName,
        organization,
        department,
        phone,
        country
      });
      setProfileMsg({ text: 'Profile updated successfully!', type: 'success' });
    } catch (err) {
      setProfileMsg({ text: err.message || 'Failed to update profile.', type: 'error' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSecurityUpdate = async (e) => {
    e.preventDefault();
    setSecurityLoading(true);
    setSecurityMsg({ text: '', type: '' });

    if (!currentPassword) {
      setSecurityMsg({ text: 'Current password is required to make security changes.', type: 'error' });
      setSecurityLoading(false);
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setSecurityMsg({ text: 'New passwords do not match.', type: 'error' });
      setSecurityLoading(false);
      return;
    }

    try {
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Change Email
      if (email !== user.email) {
        await updateEmail(user, email);
        // Also update email in Firestore
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, { email });
      }

      // Change Password
      if (newPassword) {
        await updatePassword(user, newPassword);
        setNewPassword('');
        setConfirmPassword('');
      }
      
      setCurrentPassword('');
      setSecurityMsg({ text: 'Security settings updated successfully!', type: 'success' });
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setSecurityMsg({ text: 'Incorrect current password.', type: 'error' });
      } else if (err.code === 'auth/email-already-in-use') {
        setSecurityMsg({ text: 'This email is already in use by another account.', type: 'error' });
      } else {
        setSecurityMsg({ text: err.message || 'Failed to update security settings.', type: 'error' });
      }
    } finally {
      setSecurityLoading(false);
    }
  };

  return (
    <div className="layout" style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Sidebar />
      <div className="main" style={{ padding: '40px', flex: 1, maxWidth: 1200, margin: '0 auto' }}>
        
        <div style={{ marginBottom: 40 }}>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <User size={32} color="var(--cyan)" />
            Account Settings
          </h1>
          <p className="page-subtitle" style={{ margin: 0 }}>Manage your profile information and account security.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: 32 }}>
          
          {/* Profile Information */}
          <GlassCard style={{ padding: 30 }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text)' }}>
              <Briefcase size={20} color="var(--cyan)" /> Profile Information
            </h2>
            
            {profileMsg.text && (
              <div style={{ padding: 12, borderRadius: 8, marginBottom: 20, fontSize: 14, background: profileMsg.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)', color: profileMsg.type === 'error' ? 'var(--red)' : 'var(--green)', border: `1px solid ${profileMsg.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)'}` }}>
                {profileMsg.text}
              </div>
            )}

            <form onSubmit={handleProfileUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div className="input-group" style={{ margin: 0 }}>
                  <label className="input-label">First Name</label>
                  <input className="input-field" value={firstName} onChange={e => setFirstName(e.target.value)} required />
                </div>
                <div className="input-group" style={{ margin: 0 }}>
                  <label className="input-label">Last Name</label>
                  <input className="input-field" value={lastName} onChange={e => setLastName(e.target.value)} required />
                </div>
              </div>

              <div className="input-group" style={{ margin: 0 }}>
                <label className="input-label">Organization / Institution</label>
                <input className="input-field" value={organization} onChange={e => setOrganization(e.target.value)} />
              </div>

              <div className="input-group" style={{ margin: 0 }}>
                <label className="input-label">Department</label>
                <input className="input-field" value={department} onChange={e => setDepartment(e.target.value)} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div className="input-group" style={{ margin: 0 }}>
                  <label className="input-label">Phone Number</label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={16} style={{ position: 'absolute', left: 14, top: 13, color: 'var(--text-muted)' }} />
                    <input className="input-field" style={{ paddingLeft: 42 }} value={phone} onChange={e => setPhone(e.target.value)} />
                  </div>
                </div>
                <div className="input-group" style={{ margin: 0 }}>
                  <label className="input-label">Country</label>
                  <div style={{ position: 'relative' }}>
                    <MapPin size={16} style={{ position: 'absolute', left: 14, top: 13, color: 'var(--text-muted)' }} />
                    <input className="input-field" style={{ paddingLeft: 42 }} value={country} onChange={e => setCountry(e.target.value)} />
                  </div>
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: 10 }} disabled={profileLoading}>
                {profileLoading ? 'Saving...' : <><Save size={18} /> Save Profile Changes</>}
              </button>
            </form>
          </GlassCard>

          {/* Security Settings */}
          <GlassCard style={{ padding: 30, background: 'rgba(20, 24, 39, 0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text)' }}>
              <ShieldCheck size={20} color="var(--amber)" /> Security Settings
            </h2>

            {securityMsg.text && (
              <div style={{ padding: 12, borderRadius: 8, marginBottom: 20, fontSize: 14, background: securityMsg.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)', color: securityMsg.type === 'error' ? 'var(--red)' : 'var(--green)', border: `1px solid ${securityMsg.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)'}` }}>
                {securityMsg.text}
              </div>
            )}

            <form onSubmit={handleSecurityUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              
              <div className="input-group" style={{ margin: 0 }}>
                <label className="input-label">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: 14, top: 13, color: 'var(--text-muted)' }} />
                  <input type="email" className="input-field" style={{ paddingLeft: 42 }} value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
              </div>

              <div style={{ height: 1, background: 'var(--border-color)', margin: '10px 0' }}></div>

              <div className="input-group" style={{ margin: 0 }}>
                <label className="input-label">New Password <span style={{ color: 'var(--text-faint)', fontWeight: 400 }}>(Leave blank to keep current)</span></label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: 14, top: 13, color: 'var(--text-muted)' }} />
                  <input type="password" placeholder="••••••••" className="input-field" style={{ paddingLeft: 42 }} value={newPassword} onChange={e => setNewPassword(e.target.value)} minLength={6} />
                </div>
              </div>

              {newPassword && (
                <div className="input-group" style={{ margin: 0 }}>
                  <label className="input-label">Confirm New Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: 14, top: 13, color: 'var(--text-muted)' }} />
                    <input type="password" placeholder="••••••••" className="input-field" style={{ paddingLeft: 42 }} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} minLength={6} required={!!newPassword} />
                  </div>
                </div>
              )}

              <div style={{ height: 1, background: 'var(--border-color)', margin: '10px 0' }}></div>
              
              <div style={{ background: 'rgba(239, 68, 68, 0.05)', padding: 16, borderRadius: 12, border: '1px solid rgba(239, 68, 68, 0.15)' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
                  <AlertTriangle size={18} color="var(--red)" />
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--red)' }}>Authentication Required</span>
                </div>
                <div className="input-group" style={{ margin: 0 }}>
                  <label className="input-label" style={{ color: 'var(--text)' }}>Current Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: 14, top: 13, color: 'var(--text-muted)' }} />
                    <input type="password" placeholder="Verify current password" className="input-field" style={{ paddingLeft: 42, background: 'rgba(0,0,0,0.2)' }} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 8 }}>
                    Required to securely modify your email or password.
                  </div>
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: 10, background: 'var(--amber)', color: '#000' }} disabled={securityLoading}>
                {securityLoading ? 'Authenticating & Saving...' : <><ShieldCheck size={18} /> Update Security</>}
              </button>
            </form>
          </GlassCard>

        </div>
      </div>
    </div>
  );
}

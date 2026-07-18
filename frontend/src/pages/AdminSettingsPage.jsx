import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminUpdateUser } from '../services/api';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { auth } from '../firebase';

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const [profileForm, setProfileForm] = useState({ firstName: '', lastName: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  const [pwdForm, setPwdForm] = useState({ current: '', newPwd: '', confirm: '' });
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdMsg, setPwdMsg] = useState('');

  useEffect(() => {
    if (user) {
      // Assuming user context has some of this, or we just rely on the API. 
      // For simplicity, we initialize with what's available.
      setProfileForm({
        firstName: user.firstName || '',
        lastName: user.lastName || ''
      });
    }
  }, [user]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    setProfileMsg('');
    try {
      await adminUpdateUser(user.uid, profileForm);
      setProfileMsg('Profile updated successfully.');
    } catch (err) {
      setProfileMsg('Error: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    if (pwdForm.newPwd !== pwdForm.confirm) {
      setPwdMsg('Error: New passwords do not match.');
      return;
    }
    
    setSavingPwd(true);
    setPwdMsg('');
    try {
      const cred = EmailAuthProvider.credential(auth.currentUser.email, pwdForm.current);
      await reauthenticateWithCredential(auth.currentUser, cred);
      await updatePassword(auth.currentUser, pwdForm.newPwd);
      setPwdMsg('Master password updated successfully.');
      setPwdForm({ current: '', newPwd: '', confirm: '' });
    } catch (err) {
      setPwdMsg('Error: ' + err.message);
    } finally {
      setSavingPwd(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 800, margin: '0 auto', color: 'var(--text)' }}>
      
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--card-border)' }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Admin Settings</h2>
        <div style={{ fontSize: 13, color: 'var(--text-faint)', marginTop: 4 }}>Manage your administrator profile and security credentials.</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* Profile Settings */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 8, padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px 0', borderBottom: '1px solid var(--card-border)', paddingBottom: 12 }}>Profile Information</h3>
          
          <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-dim)', marginBottom: 6 }}>Account Email (Read-Only)</label>
              <input type="text" disabled value={user?.email || ''} style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-hover)', border: '1px solid var(--input-border)', borderRadius: 6, color: 'var(--text-faint)', fontSize: 14 }} />
            </div>

            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-dim)', marginBottom: 6 }}>First Name</label>
                <input required type="text" value={profileForm.firstName} onChange={e => setProfileForm({...profileForm, firstName: e.target.value})} style={{ width: '100%', padding: '10px 12px', background: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: 6, color: 'var(--text)', fontSize: 14, outline: 'none' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-dim)', marginBottom: 6 }}>Last Name</label>
                <input required type="text" value={profileForm.lastName} onChange={e => setProfileForm({...profileForm, lastName: e.target.value})} style={{ width: '100%', padding: '10px 12px', background: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: 6, color: 'var(--text)', fontSize: 14, outline: 'none' }} />
              </div>
            </div>

            {profileMsg && (
              <div style={{ fontSize: 13, fontWeight: 500, color: profileMsg.startsWith('Error') ? '#ef4444' : '#10b981' }}>{profileMsg}</div>
            )}

            <div>
              <button disabled={savingProfile} type="submit" style={{ padding: '10px 24px', background: '#3b82f6', color: 'var(--text)', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: savingProfile ? 'not-allowed' : 'pointer' }}>
                {savingProfile ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>

        {/* Security Settings */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 8, padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px 0', borderBottom: '1px solid var(--card-border)', paddingBottom: 12 }}>Security</h3>
          
          <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-dim)', marginBottom: 6 }}>Current Master Password</label>
              <input required type="password" value={pwdForm.current} onChange={e => setPwdForm({...pwdForm, current: e.target.value})} style={{ width: '100%', padding: '10px 12px', background: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: 6, color: 'var(--text)', fontSize: 14, outline: 'none' }} />
            </div>

            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-dim)', marginBottom: 6 }}>New Password</label>
                <input required minLength={6} type="password" value={pwdForm.newPwd} onChange={e => setPwdForm({...pwdForm, newPwd: e.target.value})} style={{ width: '100%', padding: '10px 12px', background: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: 6, color: 'var(--text)', fontSize: 14, outline: 'none' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-dim)', marginBottom: 6 }}>Confirm New Password</label>
                <input required minLength={6} type="password" value={pwdForm.confirm} onChange={e => setPwdForm({...pwdForm, confirm: e.target.value})} style={{ width: '100%', padding: '10px 12px', background: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: 6, color: 'var(--text)', fontSize: 14, outline: 'none' }} />
              </div>
            </div>

            {pwdMsg && (
              <div style={{ fontSize: 13, fontWeight: 500, color: pwdMsg.startsWith('Error') ? '#ef4444' : '#10b981' }}>{pwdMsg}</div>
            )}

            <div>
              <button disabled={savingPwd} type="submit" style={{ padding: '10px 24px', background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: savingPwd ? 'not-allowed' : 'pointer' }}>
                {savingPwd ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}

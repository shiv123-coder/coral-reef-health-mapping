import { useEffect, useState, useMemo } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { adminUpdateUser, adminDeleteUser } from '../services/api';
import CustomSelect from '../components/CustomSelect';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Edit User State
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', role: '', newPassword: '' });
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setLoading(true);
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersData = snapshot.docs.map(doc => doc.data());
      setUsers(usersData);
      setLoading(false);
    }, console.error);

    return () => unsubUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      (u.firstName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.lastName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);
  
  const handleDeleteUser = async (uid) => {
    if (!window.confirm("CRITICAL: Are you sure you want to permanently delete this user?")) return;
    try {
      await adminDeleteUser(uid);
      setUsers(u => u.filter(x => x.uid !== uid));
    } catch (e) {
      alert("Failed to delete user: " + (e.response?.data?.detail || e.message));
    }
  };

  const handleEditClick = (u) => {
    setEditingUser(u);
    setEditForm({ firstName: u.firstName || '', lastName: u.lastName || '', role: u.role || 'student', newPassword: '' });
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    try {
      await adminUpdateUser(editingUser.uid, editForm);
      setUsers(u => u.map(x => x.uid === editingUser.uid ? { ...x, ...editForm } : x));
      setEditingUser(null);
    } catch (e) {
      alert("Failed to update user: " + (e.response?.data?.detail || e.message));
    }
  };

  const handleToggleStatus = async (u) => {
    const newStatus = u.isActive === false ? true : false;
    const action = newStatus ? "activate" : "deactivate";
    if (!window.confirm(`Are you sure you want to ${action} this account?`)) return;
    
    try {
      await adminUpdateUser(u.uid, { isActive: newStatus });
      setUsers(users => users.map(x => x.uid === u.uid ? { ...x, isActive: newStatus } : x));
    } catch (e) {
      alert(`Failed to ${action} user: ` + (e.response?.data?.detail || e.message));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1400, margin: '0 auto', color: 'var(--text)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 4px 0' }}>User Management</h2>
          <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>Manage registered accounts, permissions, and security overrides</div>
        </div>
        <div style={{ position: 'relative' }}>
          <svg style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-faint)' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input 
            type="text" 
            placeholder="Search users..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 8, padding: '10px 12px 10px 34px', color: 'var(--text)', fontSize: 14, width: 300, outline: 'none' }}
          />
        </div>
      </div>

      <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 8, display: 'flex', flexDirection: 'column' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--input-bg)' }}>
                <th style={{ padding: '16px 24px', fontSize: 12, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase' }}>User ID</th>
                <th style={{ padding: '16px 24px', fontSize: 12, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Email Address</th>
                <th style={{ padding: '16px 24px', fontSize: 12, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Role</th>
                <th style={{ padding: '16px 24px', fontSize: 12, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '16px 24px', fontSize: 12, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-faint)' }}>Loading accounts...</td></tr>
              ) : filteredUsers.length > 0 ? filteredUsers.map((u, i) => (
                <tr key={u.uid} style={{ borderBottom: '1px solid var(--card-border)', background: i % 2 === 0 ? 'transparent' : 'var(--bg-hover)' }}>
                  <td style={{ padding: '16px 24px', fontSize: 13, fontFamily: 'monospace', color: 'var(--text-faint)' }}>{u.uid.substring(0,8)}...</td>
                  <td style={{ padding: '16px 24px', fontSize: 14, fontWeight: 500 }}>
                    {u.email}
                    <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 4 }}>{u.firstName} {u.lastName}</div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{ padding: '4px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', background: u.role === 'admin' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(100, 116, 139, 0.1)', color: u.role === 'admin' ? '#3b82f6' : 'var(--text-dim)' }}>
                      {u.role || 'USER'}
                    </span>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-dim)' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: u.isActive === false ? '#ef4444' : '#10b981' }}></div> {u.isActive === false ? 'Inactive' : 'Active'}
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                    <button onClick={() => handleToggleStatus(u)} style={{ background: 'transparent', border: '1px solid var(--input-border)', color: 'var(--text-dim)', padding: '6px 12px', borderRadius: 4, fontSize: 12, fontWeight: 500, cursor: 'pointer', marginRight: 8, transition: 'all 0.2s' }} onMouseOver={e => e.target.style.background = 'var(--input-bg)'} onMouseOut={e => e.target.style.background = 'transparent'}>
                      {u.isActive === false ? 'Activate' : 'Deactivate'}
                    </button>
                    <button onClick={() => handleEditClick(u)} style={{ background: 'transparent', border: '1px solid var(--input-border)', color: 'var(--text-dim)', padding: '6px 12px', borderRadius: 4, fontSize: 12, fontWeight: 500, cursor: 'pointer', marginRight: 8, transition: 'all 0.2s' }} onMouseOver={e => e.target.style.background = 'var(--input-bg)'} onMouseOut={e => e.target.style.background = 'transparent'}>
                      Edit
                    </button>
                    <button onClick={() => handleDeleteUser(u.uid)} style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '6px 12px', borderRadius: 4, fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={e => e.target.style.background = 'rgba(239, 68, 68, 0.2)'} onMouseOut={e => e.target.style.background = 'rgba(239, 68, 68, 0.1)'}>
                      Delete
                    </button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-faint)' }}>No records found matching query.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 12, padding: 32, width: '100%', maxWidth: 440, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' }}>
            <h3 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 24px 0', color: 'var(--text)' }}>Modify User Record</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-dim)', marginBottom: 6 }}>Account Email (Read-Only)</label>
                <input type="text" disabled value={editingUser.email} style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-hover)', border: '1px solid var(--input-border)', borderRadius: 6, color: 'var(--text-faint)', fontSize: 14 }} />
              </div>
              
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-dim)', marginBottom: 6 }}>First Name</label>
                  <input type="text" value={editForm.firstName} onChange={e => setEditForm({...editForm, firstName: e.target.value})} style={{ width: '100%', padding: '10px 12px', background: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: 6, color: 'var(--text)', fontSize: 14, outline: 'none' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-dim)', marginBottom: 6 }}>Last Name</label>
                  <input type="text" value={editForm.lastName} onChange={e => setEditForm({...editForm, lastName: e.target.value})} style={{ width: '100%', padding: '10px 12px', background: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: 6, color: 'var(--text)', fontSize: 14, outline: 'none' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-dim)', marginBottom: 6 }}>System Role</label>
                <CustomSelect 
                  value={editForm.role} 
                  onChange={val => setEditForm({...editForm, role: val})}
                  style={{ padding: '4px 0' }}
                  options={[
                    { value: 'student', label: 'Student / Standard User' },
                    { value: 'admin', label: 'Administrator' }
                  ]}
                />
              </div>

              <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 8, marginTop: 8 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#ef4444', marginBottom: 6 }}>Manual Password Override</label>
                <input type="password" placeholder="Leave blank to keep current password" value={editForm.newPassword} onChange={e => setEditForm({...editForm, newPassword: e.target.value})} style={{ width: '100%', padding: '10px 12px', background: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: 6, color: 'var(--text)', fontSize: 14, outline: 'none' }} />
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 6 }}>Warning: Bypasses standard email reset workflows.</div>
              </div>

            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
              <button onClick={() => setEditingUser(null)} style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid var(--input-border)', color: 'var(--text-dim)', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' }} onMouseOver={e => e.target.style.background = 'var(--input-bg)'} onMouseOut={e => e.target.style.background = 'transparent'}>Cancel</button>
              <button onClick={handleSaveEdit} style={{ flex: 1, padding: '10px', background: '#ef4444', color: 'var(--text)', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' }} onMouseOver={e => e.target.style.background = '#dc2626'} onMouseOut={e => e.target.style.background = '#ef4444'}>Apply Changes</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

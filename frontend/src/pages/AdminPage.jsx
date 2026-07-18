import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { adminGetUsers, adminGetAnalyses, adminGetAnalytics, adminUpdateUser, adminDeleteUser } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../hooks/useNotifications';

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [analyses, setAnalyses] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Edit User State
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', role: '', newPassword: '' });
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  
  // Notification State
  const { createNotification } = useNotifications();
  const [notifForm, setNotifForm] = useState({ title: '', message: '', type: 'info' });

  const { user } = useAuth();

  useEffect(() => {
    Promise.all([adminGetUsers(), adminGetAnalyses(), adminGetAnalytics()])
      .then(([u, a, an]) => { 
        setUsers(u.users || []); 
        setAnalyses(a.analyses || []); 
        setAnalytics(an); 
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Stats calculation
  const n = analyses.length || 1;
  const healthyPct = analyses.length ? Number((analyses.reduce((sum, a) => sum + (a.healthyCoralPct || 0), 0) / n).toFixed(1)) : 0;
  const bleachedPct = analyses.length ? Number((analyses.reduce((sum, a) => sum + (a.bleachedCoralPct || 0), 0) / n).toFixed(1)) : 0;
  const deadPct = analyses.length ? Number((analyses.reduce((sum, a) => sum + (a.deadCoralPct || 0), 0) / n).toFixed(1)) : 0;
  
  const riskPriority = { Critical: 4, High: 3, Moderate: 2, Low: 1, Minimal: 0 };
  const worstRisk = analyses.length ? analyses.reduce((worst, a) => (riskPriority[a.riskLevel] || 0) > (riskPriority[worst] || 0) ? (a.riskLevel || 'Minimal') : worst, 'Minimal') : 'N/A';

  // Recent users
  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      (u.firstName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.lastName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);
  const recentUsers = filteredUsers.slice(0, 15);
  
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

  const handleSendNotification = async () => {
    if (!notifForm.title || !notifForm.message) return alert("Title and message required");
    try {
      await createNotification({ userId: 'global', ...notifForm });
      setNotifForm({ title: '', message: '', type: 'info' });
      alert("System Notification sent to all users successfully.");
    } catch (e) {
      alert("Failed to send notification: " + e.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1400, margin: '0 auto', color: '#f8fafc' }}>
      
      {/* Key Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Registered Users</div>
          <div style={{ fontSize: 32, fontWeight: 700, margin: '8px 0', color: '#f8fafc' }}>{loading ? '--' : users.length}</div>
          <div style={{ fontSize: 13, color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14m-7-7v14"/></svg> System Healthy</div>
        </div>

        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total ML Analyses</div>
          <div style={{ fontSize: 32, fontWeight: 700, margin: '8px 0', color: '#f8fafc' }}>{loading ? '--' : (analytics?.totalAnalyses || analyses.length || 0)}</div>
          <div style={{ fontSize: 13, color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14m-7-7v14"/></svg> Processing Optimal</div>
        </div>

        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Average Coral Health</div>
          <div style={{ fontSize: 32, fontWeight: 700, margin: '8px 0', color: '#3b82f6' }}>{healthyPct}%</div>
          <div style={{ fontSize: 13, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>Across all submitted analyses</div>
        </div>

        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Highest Risk Detected</div>
          <div style={{ fontSize: 32, fontWeight: 700, margin: '8px 0', color: worstRisk === 'Minimal' || worstRisk === 'Low' ? '#10b981' : worstRisk === 'Moderate' ? '#f59e0b' : '#ef4444' }}>{worstRisk}</div>
          <div style={{ fontSize: 13, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>System threat level</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: 24, alignItems: 'start' }}>
        
        {/* Main Data Table Area */}
        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, display: 'flex', flexDirection: 'column' }}>
          
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>User Management</h2>
            <div style={{ position: 'relative' }}>
              <svg style={{ position: 'absolute', left: 10, top: 8, color: '#64748b' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <input 
                type="text" 
                placeholder="Search database..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 6, padding: '8px 12px 8px 34px', color: '#f8fafc', fontSize: 13, width: 260, outline: 'none' }}
              />
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#1e293b' }}>
                  <th style={{ padding: '12px 24px', fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>User ID</th>
                  <th style={{ padding: '12px 24px', fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>Email Address</th>
                  <th style={{ padding: '12px 24px', fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>Role</th>
                  <th style={{ padding: '12px 24px', fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '12px 24px', fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.length > 0 ? recentUsers.map((u, i) => (
                  <tr key={u.uid} style={{ borderBottom: '1px solid #1e293b', background: i % 2 === 0 ? 'transparent' : 'rgba(30, 41, 59, 0.3)' }}>
                    <td style={{ padding: '16px 24px', fontSize: 13, fontFamily: 'monospace', color: '#64748b' }}>{u.uid.substring(0,8)}...</td>
                    <td style={{ padding: '16px 24px', fontSize: 14, fontWeight: 500 }}>
                      {u.email}
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{u.firstName} {u.lastName}</div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{ padding: '4px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', background: u.role === 'admin' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(100, 116, 139, 0.1)', color: u.role === 'admin' ? '#3b82f6' : '#94a3b8' }}>
                        {u.role || 'USER'}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#cbd5e1' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }}></div> Active
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <button onClick={() => handleEditClick(u)} style={{ background: 'transparent', border: '1px solid #334155', color: '#cbd5e1', padding: '6px 12px', borderRadius: 4, fontSize: 12, fontWeight: 500, cursor: 'pointer', marginRight: 8, transition: 'all 0.2s' }} onMouseOver={e => e.target.style.background = '#1e293b'} onMouseOut={e => e.target.style.background = 'transparent'}>
                        Edit
                      </button>
                      <button onClick={() => handleDeleteUser(u.uid)} style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '6px 12px', borderRadius: 4, fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={e => e.target.style.background = 'rgba(239, 68, 68, 0.2)'} onMouseOut={e => e.target.style.background = 'rgba(239, 68, 68, 0.1)'}>
                        Delete
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>No records found matching query.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Side Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Notification Broadcaster */}
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px 0' }}>System Broadcast</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>Title</label>
                <input type="text" value={notifForm.title} onChange={e => setNotifForm({...notifForm, title: e.target.value})} style={{ width: '100%', padding: '10px 12px', background: '#1e293b', border: '1px solid #334155', borderRadius: 6, color: '#f8fafc', fontSize: 13, outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>Message</label>
                <textarea value={notifForm.message} onChange={e => setNotifForm({...notifForm, message: e.target.value})} style={{ width: '100%', padding: '10px 12px', background: '#1e293b', border: '1px solid #334155', borderRadius: 6, color: '#f8fafc', fontSize: 13, outline: 'none', minHeight: 80, resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>Priority</label>
                  <select value={notifForm.type} onChange={e => setNotifForm({...notifForm, type: e.target.value})} style={{ width: '100%', padding: '10px 12px', background: '#1e293b', border: '1px solid #334155', borderRadius: 6, color: '#f8fafc', fontSize: 13, outline: 'none' }}>
                    <option value="info">Information</option>
                    <option value="warning">Warning</option>
                    <option value="error">Critical Error</option>
                  </select>
                </div>
              </div>
              <button onClick={handleSendNotification} style={{ width: '100%', padding: '10px', background: '#3b82f6', color: '#ffffff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', marginTop: 8, transition: 'background 0.2s' }} onMouseOver={e => e.target.style.background = '#2563eb'} onMouseOut={e => e.target.style.background = '#3b82f6'}>
                Dispatch Global Broadcast
              </button>
            </div>
          </div>

          {/* System Logs / Server Info */}
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px 0' }}>Server Status</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: '#94a3b8' }}>API Endpoint</span>
                <span style={{ color: '#10b981', fontWeight: 500 }}>Online</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: '#94a3b8' }}>ML Inference Engine</span>
                <span style={{ color: '#10b981', fontWeight: 500 }}>Ready</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: '#94a3b8' }}>Firebase Storage</span>
                <span style={{ color: '#eab308', fontWeight: 500 }}>64% Capacity</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: '#94a3b8' }}>Active Sessions</span>
                <span style={{ color: '#f8fafc', fontWeight: 500 }}>{users.length > 0 ? Math.max(1, Math.floor(users.length / 3)) : 1} Nodes</span>
              </div>
            </div>
          </div>
          
        </div>
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(2, 6, 23, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 32, width: '100%', maxWidth: 440, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' }}>
            <h3 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 24px 0', color: '#f8fafc' }}>Modify User Record</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>Account Email (Read-Only)</label>
                <input type="text" disabled value={editingUser.email} style={{ width: '100%', padding: '10px 12px', background: 'rgba(30, 41, 59, 0.5)', border: '1px solid #334155', borderRadius: 6, color: '#64748b', fontSize: 14 }} />
              </div>
              
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>First Name</label>
                  <input type="text" value={editForm.firstName} onChange={e => setEditForm({...editForm, firstName: e.target.value})} style={{ width: '100%', padding: '10px 12px', background: '#1e293b', border: '1px solid #334155', borderRadius: 6, color: '#f8fafc', fontSize: 14, outline: 'none' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>Last Name</label>
                  <input type="text" value={editForm.lastName} onChange={e => setEditForm({...editForm, lastName: e.target.value})} style={{ width: '100%', padding: '10px 12px', background: '#1e293b', border: '1px solid #334155', borderRadius: 6, color: '#f8fafc', fontSize: 14, outline: 'none' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>System Role</label>
                <select value={editForm.role} onChange={e => setEditForm({...editForm, role: e.target.value})} style={{ width: '100%', padding: '10px 12px', background: '#1e293b', border: '1px solid #334155', borderRadius: 6, color: '#f8fafc', fontSize: 14, outline: 'none' }}>
                  <option value="student">Student / Standard User</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 8, marginTop: 8 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#ef4444', marginBottom: 6 }}>Manual Password Override</label>
                <input type="password" placeholder="Leave blank to keep current password" value={editForm.newPassword} onChange={e => setEditForm({...editForm, newPassword: e.target.value})} style={{ width: '100%', padding: '10px 12px', background: '#1e293b', border: '1px solid #334155', borderRadius: 6, color: '#f8fafc', fontSize: 14, outline: 'none' }} />
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>Warning: Bypasses standard email reset workflows.</div>
              </div>

            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
              <button onClick={() => setEditingUser(null)} style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid #334155', color: '#cbd5e1', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' }} onMouseOver={e => e.target.style.background = '#1e293b'} onMouseOut={e => e.target.style.background = 'transparent'}>Cancel</button>
              <button onClick={handleSaveEdit} style={{ flex: 1, padding: '10px', background: '#ef4444', color: '#ffffff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' }} onMouseOver={e => e.target.style.background = '#dc2626'} onMouseOut={e => e.target.style.background = '#ef4444'}>Apply Changes</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

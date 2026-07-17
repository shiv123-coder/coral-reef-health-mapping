import { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { useAuth } from '../context/AuthContext';

export default function NotificationDropdown() {
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead, deleteNotification } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIconForType = (type) => {
    switch (type) {
      case 'success':
        return <span style={{ color: 'var(--green)' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg></span>;
      case 'warning':
        return <span style={{ color: 'var(--amber)' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"/></svg></span>;
      case 'error':
        return <span style={{ color: 'var(--red)' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg></span>;
      default: // info
        return <span style={{ color: 'var(--cyan)' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg></span>;
    }
  };

  const timeAgo = (dateStr) => {
    if (!dateStr) return 'Just now';
    const date = dateStr.toDate ? dateStr.toDate() : new Date(dateStr);
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{ position: 'relative', width: 40, height: 40, borderRadius: 11, background: 'var(--card)', border: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', cursor: 'pointer', transition: 'all 0.2s ease' }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 01-3.4 0"/></svg>
        {unreadCount > 0 && (
          <span style={{ position: 'absolute', top: -4, right: -4, background: 'var(--red)', color: '#fff', fontSize: 10, fontWeight: 700, width: 17, height: 17, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--bg-deep)' }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </div>

      {isOpen && (
        <div style={{ position: 'absolute', top: 50, right: 0, width: 340, background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 16, boxShadow: '0 10px 40px rgba(0,0,0,0.4)', zIndex: 100, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Notifications</h3>
            {unreadCount > 0 && <span style={{ fontSize: 11, color: 'var(--cyan)', cursor: 'pointer' }} onClick={() => notifications.forEach(n => markAsRead(n.id, n))}>Mark all read</span>}
          </div>
          
          <div style={{ maxHeight: 340, overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '30px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                <svg style={{ margin: '0 auto 10px', opacity: 0.5 }} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 01-3.4 0"/></svg>
                <p>No new notifications</p>
              </div>
            ) : (
              notifications.map(notif => {
                const isUnread = notif.userId === 'global' ? !notif.readBy?.includes(user?.uid) : !notif.isRead;
                return (
                  <div 
                    key={notif.id} 
                    onClick={() => { if(isUnread) markAsRead(notif.id, notif); }}
                    style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.03)', display: 'flex', gap: 12, alignItems: 'flex-start', cursor: isUnread ? 'pointer' : 'default', background: isUnread ? 'rgba(59,158,255,0.03)' : 'transparent', transition: 'background 0.2s' }}
                  >
                    <div style={{ flex: 'none', width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {getIconForType(notif.type)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: isUnread ? 700 : 500, color: 'var(--text)', marginBottom: 2 }}>{notif.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.4, marginBottom: 6 }}>{notif.message}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>{timeAgo(notif.createdAt)}</div>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id, notif); }}
                      style={{ background: 'none', border: 'none', color: 'var(--text-faint)', cursor: 'pointer', padding: 4 }}
                      title="Dismiss"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    // Query both personal and global notifications
    const q = query(
      collection(db, 'notifications'),
      where('userId', 'in', [user.uid, 'global']),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.readBy?.includes(user.uid) && !n.isRead).length);
    }, (error) => {
      console.error("Error fetching notifications:", error);
    });

    return () => unsubscribe();
  }, [user]);

  // Mark a specific notification as read
  const markAsRead = async (notificationId, currentNotification) => {
    if (!user) return;
    
    const notifRef = doc(db, 'notifications', notificationId);
    
    if (currentNotification.userId === 'global') {
      // For global notifications, we track who has read it using an array
      const readBy = currentNotification.readBy || [];
      if (!readBy.includes(user.uid)) {
        await updateDoc(notifRef, {
          readBy: [...readBy, user.uid]
        });
      }
    } else {
      // For personal notifications, just set isRead
      await updateDoc(notifRef, {
        isRead: true
      });
    }
  };

  // Delete a specific notification (Only for personal. Global should be hidden or admin deleted)
  const deleteNotification = async (notificationId, currentNotification) => {
    if (!user) return;
    
    if (currentNotification.userId === 'global') {
      // Regular users can only hide global notifications by adding to a 'deletedBy' list (for simplicity, we'll just mark it read)
      await markAsRead(notificationId, currentNotification);
    } else {
      await deleteDoc(doc(db, 'notifications', notificationId));
    }
  };

  // Create a new notification (Admin or System)
  const createNotification = async ({ userId = 'global', title, message, type = 'info' }) => {
    await addDoc(collection(db, 'notifications'), {
      userId,
      title,
      message,
      type,
      isRead: false,
      readBy: [],
      createdAt: serverTimestamp()
    });
  };

  // Admin: Delete any notification
  const adminDeleteNotification = async (notificationId) => {
    await deleteDoc(doc(db, 'notifications', notificationId));
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    deleteNotification,
    createNotification,
    adminDeleteNotification
  };
}

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { getMe } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [systemConfig, setSystemConfig] = useState({ isOffline: false });

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const p = await getMe();
          setProfile(p);
        } catch {
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    const unsubConfig = onSnapshot(doc(db, 'global_config', 'system'), (docSnap) => {
      if (docSnap.exists()) {
        setSystemConfig(docSnap.data());
      }
    });

    return () => {
      unsubAuth();
      unsubConfig();
    };
  }, []);

  const logout = () => signOut(auth);

  const refreshProfile = async () => {
    if (auth.currentUser) {
      const p = await getMe();
      setProfile(p);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, logout, refreshProfile, isAdmin: profile?.role === 'admin' || user?.email === 'shivashankrmali7@gmail.com', isOffline: systemConfig?.isOffline }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

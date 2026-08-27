import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, signOut } from 'firebase/auth';
import { auth, onAuthStateChanged, db } from '../lib/firebase';
import { getAuthStatus, AuthStatus } from '../lib/authGuard';
import { doc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';

export interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  authStatus: AuthStatus;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: auth.currentUser,
  loading: true,
  authStatus: getAuthStatus(),
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);
  const [loading, setLoading] = useState(true);
  const [authStatus, setAuthStatus] = useState<AuthStatus>(getAuthStatus());
  const unsubscribeSnapshotRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      // Clear previous snapshot listener if it exists
      if (unsubscribeSnapshotRef.current) {
        unsubscribeSnapshotRef.current();
        unsubscribeSnapshotRef.current = null;
      }

      if (firebaseUser) {
        // If user is not verified (and not a Google pre-verified user), ignore global login
        if (!firebaseUser.emailVerified && firebaseUser.providerData[0]?.providerId === 'password') {
          setCurrentUser(null);
          setAuthStatus({
            isLoggedIn: false,
            isEmailVerified: false,
            isGoogleUser: false,
            user: null
          });
          setLoading(false);
          return;
        }

        // Auto-Create / Sync User Document on Auth State Change
        try {
          const userRef = doc(db, "users", firebaseUser.uid);
          
          // Start Realtime Block Status Check BEFORE waiting for any async writes
          unsubscribeSnapshotRef.current = onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
              const userData = docSnap.data();
              if (userData.status === 'Blocked' || userData.isBlocked === true) {
                // Immediately sign out blocked user
                signOut(auth).then(() => {
                  alert("⚠️ Your account has been suspended/blocked by the administrator.");
                  window.location.href = '/login'; 
                });
              }
            } else {
              // If document does not exist, create it with default values
              setDoc(userRef, {
                uid: firebaseUser.uid,
                userId: firebaseUser.uid,
                displayName: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'User'),
                fullName: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'User'),
                email: firebaseUser.email || '',
                photoURL: firebaseUser.photoURL || '',
                picture: firebaseUser.photoURL || '',
                avatar: firebaseUser.photoURL || '',
                role: 'USER',
                status: 'Active',
                lastLogin: serverTimestamp(),
                createdAt: serverTimestamp(),
                updatedAt: new Date().toISOString()
              }, { merge: true });
            }
          });

          // Also do a routine update for existing users to update lastLogin
          await setDoc(userRef, {
            uid: firebaseUser.uid,
            userId: firebaseUser.uid,
            displayName: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'User'),
            fullName: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'User'),
            email: firebaseUser.email || '',
            photoURL: firebaseUser.photoURL || '',
            picture: firebaseUser.photoURL || '',
            avatar: firebaseUser.photoURL || '',
            lastLogin: serverTimestamp(),
            updatedAt: new Date().toISOString()
          }, { merge: true });

        } catch (error) {
          console.error("Error auto-syncing user profile to Firestore:", error);
        }

        setCurrentUser(firebaseUser);
        setAuthStatus(getAuthStatus());
      } else {
        setCurrentUser(null);
        setAuthStatus(getAuthStatus());
      }
      setLoading(false);
    });

    const handleStorageChange = () => {
      setCurrentUser(auth.currentUser);
      setAuthStatus(getAuthStatus());
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('filemarket:auth-change', handleStorageChange);

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshotRef.current) {
        unsubscribeSnapshotRef.current();
      }
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('filemarket:auth-change', handleStorageChange);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, loading, authStatus }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;

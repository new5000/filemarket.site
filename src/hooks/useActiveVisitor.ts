import { useEffect } from 'react';
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

/**
 * Real-time Active Visitor presence tracking hook.
 * Emits a heartbeat ping every 30 seconds to Firestore `active_visitors/{sessionId}`
 * and cleans up document on tab close or navigation leave.
 */
export function useActiveVisitorTracking() {
  useEffect(() => {
    // Generate or retrieve persistent tab session ID
    let visitorId = '';
    try {
      visitorId = sessionStorage.getItem('fm_visitor_id') || '';
      if (!visitorId) {
        visitorId = 'v_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
        sessionStorage.setItem('fm_visitor_id', visitorId);
      }
    } catch {
      visitorId = 'v_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
    }

    const visitorRef = doc(db, 'active_visitors', visitorId);

    // Heartbeat: updates timestamp every 30 seconds
    const pingPresence = async () => {
      try {
        await setDoc(visitorRef, {
          lastActive: Date.now(),
          path: window.location.pathname || '/',
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (err) {
        console.warn('Visitor ping error:', err);
      }
    };

    // Immediate initial heartbeat ping
    pingPresence();
    const interval = setInterval(pingPresence, 30000);

    // Cleanup on tab close
    const handleLeave = () => {
      try {
        deleteDoc(visitorRef).catch(() => {});
      } catch {}
    };
    window.addEventListener('beforeunload', handleLeave);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleLeave);
      try {
        deleteDoc(visitorRef).catch(() => {});
      } catch {}
    };
  }, []);
}

export default useActiveVisitorTracking;

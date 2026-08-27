import { useEffect } from 'react';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

/**
 * Real-time sliding-window visitor presence tracking hook.
 * Generates an isolated session ID per tab/window, writes to `active_presence/{sessionId}`,
 * pulses heartbeat every 15 seconds, and deletes presence on tab unload.
 */
export function useLivePresence() {
  useEffect(() => {
    // Generate or get unique session ID for this browser tab / device
    let sessionId = '';
    try {
      sessionId = sessionStorage.getItem('fm_live_session') || '';
      if (!sessionId) {
        sessionId = 'user_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
        sessionStorage.setItem('fm_live_session', sessionId);
      }
    } catch {
      sessionId = 'user_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
    }

    const presenceDocRef = doc(db, 'active_presence', sessionId);

    // Heartbeat update function
    const sendHeartbeat = async () => {
      try {
        await setDoc(presenceDocRef, {
          lastSeen: Date.now(),
          url: window.location.pathname || '/',
          userAgent: (navigator.userAgent || '').substring(0, 50)
        }, { merge: true });
      } catch (e) {
        console.warn('Presence heartbeat skipped:', e);
      }
    };

    // 1. Send immediate ping on load
    sendHeartbeat();

    // 2. Pulse every 15 seconds
    const interval = setInterval(sendHeartbeat, 15000);

    // 3. Instant remove on tab close/unload
    const handleUnload = () => {
      try {
        deleteDoc(presenceDocRef).catch(() => {});
      } catch {}
    };

    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('pagehide', handleUnload);
      try {
        deleteDoc(presenceDocRef).catch(() => {});
      } catch {}
    };
  }, []);
}

export default useLivePresence;

import { auth, reload, checkFreshEmailVerifiedStatus, triggerEmailVerification, signOut, onAuthStateChanged, getUserProfileFromFirestore } from './firebase';
import { getAuthErrorMessage } from './authErrorMapper';

export { getAuthErrorMessage };

export interface AuthStatus {
  isLoggedIn: boolean;
  isEmailVerified: boolean;
  isGoogleUser: boolean;
  user: {
    name: string;
    email: string;
    picture: string;
    userId: string;
    authProvider?: string;
  } | null;
}

/**
 * Completely wipes local storage & session storage user data to prevent session leak or stale profiles across accounts.
 */
export function clearUserSessionCache(): void {
  try {
    localStorage.removeItem('filemarket_user');
    localStorage.setItem('isLoggedIn', 'false');
    localStorage.removeItem('fm_user_name');
    localStorage.removeItem('fm_user_email');
    localStorage.removeItem('fm_user_photo');
    localStorage.removeItem('fm_user_uid');
    localStorage.removeItem('fm_email_verified');
    localStorage.removeItem('fm_user_phone');
    localStorage.removeItem('fm_user_address');
    localStorage.removeItem('fm_user_city');
    localStorage.removeItem('fm_user_zipcode');
    localStorage.removeItem('fm_purchased_products');
    localStorage.removeItem('user_session_cache');
    sessionStorage.removeItem('auth_redirect_url');
    sessionStorage.removeItem('auto_checkout_product_id');
  } catch (err) {
    console.warn('Session cache wipe warning:', err);
  }
}

/**
 * Single source of truth for user authentication & email verification state across FileMarket.site
 */
export function getAuthStatus(): AuthStatus {
  const fbUser = auth.currentUser;

  // Note: Allow signed in password users so newly signed up accounts are instantly recognized and not wiped back to Guest.
  let localUser: any = null;
  const userStr = localStorage.getItem('filemarket_user');
  if (userStr) {
    try {
      localUser = JSON.parse(userStr);
    } catch {
      localUser = null;
    }
  }

  // Security check: If cached user UID doesn't match active Firebase Auth user UID, wipe cached user!
  if (fbUser && localUser) {
    const localUid = localUser.sub || localUser.userId || localUser.uid;
    if (localUid && localUid !== fbUser.uid) {
      clearUserSessionCache();
      localUser = null;
    }
  }

  const isLoggedInStorage = localStorage.getItem('isLoggedIn') === 'true';
  const isLoggedIn = Boolean(fbUser || (isLoggedInStorage && (localUser?.email || localStorage.getItem('fm_user_email'))));

  if (!isLoggedIn) {
    return {
      isLoggedIn: false,
      isEmailVerified: false,
      isGoogleUser: false,
      user: null
    };
  }

  // Determine provider: Google users are 100% verified by Google Identity
  const isGoogleProvider = Boolean(
    fbUser?.providerData?.some(p => p.providerId === 'google.com') ||
    localUser?.authProvider === 'google.com' ||
    localUser?.authProvider === 'google' ||
    Boolean(localStorage.getItem('fm_user_photo')?.includes('googleusercontent.com'))
  );

  // Email verification check
  let isEmailVerified = false;
  if (isGoogleProvider) {
    isEmailVerified = true;
  } else if (fbUser) {
    isEmailVerified = Boolean(fbUser.emailVerified);
  } else if (localUser?.emailVerified !== undefined) {
    isEmailVerified = Boolean(localUser.emailVerified);
  } else if (localStorage.getItem('fm_email_verified') !== null) {
    isEmailVerified = localStorage.getItem('fm_email_verified') === 'true';
  }

  const effectiveEmail = fbUser?.email || localUser?.email || localStorage.getItem('fm_user_email') || '';
  const effectiveName = fbUser?.displayName || localUser?.name || localStorage.getItem('fm_user_name') || (effectiveEmail ? effectiveEmail.split('@')[0] : 'User');
  const effectivePicture = fbUser?.photoURL || localUser?.picture || localUser?.avatar || localStorage.getItem('fm_user_photo') || '';
  const effectiveId = fbUser?.uid || localUser?.sub || localUser?.userId || localUser?.uid || '';

  return {
    isLoggedIn: true,
    isEmailVerified,
    isGoogleUser: isGoogleProvider,
    user: {
      name: effectiveName,
      email: effectiveEmail,
      picture: effectivePicture,
      userId: effectiveId,
      authProvider: isGoogleProvider ? 'google.com' : 'password'
    }
  };
}

/**
 * Global Firebase Auth observer that ensures user state is completely wiped & reset
 * whenever auth status changes or a user switches accounts / logs out.
 */
export function initAuthStateObserver(onUserChange?: (status: AuthStatus) => void): () => void {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      const storedUid = localStorage.getItem('fm_user_uid');
      // If signed-in UID doesn't match stored UID, wipe previous user cache!
      if (storedUid && storedUid !== user.uid) {
        clearUserSessionCache();
      }

      try {
        const profile = await getUserProfileFromFirestore(user.uid);
        const isGoogleUser = user.providerData.some(p => p.providerId === 'google.com');
        const isVerified = Boolean(user.emailVerified || isGoogleUser);

        const updatedLocalUser = {
          name: profile?.fullName || user.displayName || (user.email ? user.email.split('@')[0] : 'User'),
          email: user.email || profile?.email || '',
          phone: profile?.phone || '',
          address: profile?.deliveryAddress || profile?.address || '',
          city: profile?.city || '',
          zipCode: profile?.zipCode || '',
          picture: profile?.picture || profile?.avatar || user.photoURL || '',
          avatar: profile?.avatar || profile?.picture || user.photoURL || '',
          sub: user.uid,
          userId: user.uid,
          emailVerified: isVerified,
          isLoggedIn: true
        };

        localStorage.setItem('filemarket_user', JSON.stringify(updatedLocalUser));
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('fm_user_name', updatedLocalUser.name);
        localStorage.setItem('fm_user_email', updatedLocalUser.email);
        localStorage.setItem('fm_user_uid', user.uid);
        localStorage.setItem('fm_email_verified', isVerified ? 'true' : 'false');
        localStorage.setItem('fm_user_phone', updatedLocalUser.phone);
        localStorage.setItem('fm_user_address', updatedLocalUser.address);
        localStorage.setItem('fm_user_city', updatedLocalUser.city);
        localStorage.setItem('fm_user_zipcode', updatedLocalUser.zipCode);
        localStorage.setItem('fm_purchased_products', JSON.stringify(profile?.purchasedProducts || []));
        localStorage.setItem('user_session_cache', JSON.stringify(updatedLocalUser));
      } catch (err) {
        console.warn('Auth state observer profile sync error:', err);
      }
    } else {
      // User is logged out: RESET EVERYTHING & clear local storage session cache
      clearUserSessionCache();
    }

    try {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('auth:state-changed'));
    } catch {}

    if (onUserChange) {
      onUserChange(getAuthStatus());
    }
  });
}

/**
 * Reloads current Firebase auth user & syncs verification status
 */
export async function syncAndCheckVerification(): Promise<boolean> {
  if (auth.currentUser) {
    try {
      await reload(auth.currentUser);
      const verified = auth.currentUser.emailVerified;
      if (verified) {
        localStorage.setItem('fm_email_verified', 'true');
        const userStr = localStorage.getItem('filemarket_user');
        if (userStr) {
          try {
            const parsed = JSON.parse(userStr);
            parsed.emailVerified = true;
            localStorage.setItem('filemarket_user', JSON.stringify(parsed));
          } catch {}
        }
        window.dispatchEvent(new Event('storage'));
      }
      return verified;
    } catch (err) {
      console.warn('syncAndCheckVerification error:', err);
    }
  }
  return localStorage.getItem('fm_email_verified') === 'true';
}

/**
 * Instantly & optimistically logs the user out from local state,
 * notifying all UI listeners immediately while performing Firebase signOut in the background.
 */
export function performOptimisticLogout(): void {
  // 1. Immediately wipe local auth state
  clearUserSessionCache();

  // 2. Broadcast events immediately to trigger optimistic UI update across all components
  try {
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('auth:logout'));
    window.dispatchEvent(new CustomEvent('auth:state-changed'));
  } catch {}

  // 3. Non-blocking Firebase Auth signout in background
  try {
    signOut(auth).catch((err: any) => {
      console.warn('Background Firebase signout notice:', err);
    });
  } catch (err) {
    console.warn('Signout call notice:', err);
  }
}


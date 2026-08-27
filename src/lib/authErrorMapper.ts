/**
 * User-Friendly Firebase Auth Error Mapper
 * Converts raw Firebase error codes/exceptions into polite, human-readable messages.
 */

export const getAuthErrorMessage = (errorOrCode: any): string => {
  if (!errorOrCode) {
    return 'Authentication failed. Please check your connection.';
  }

  const errorCode = typeof errorOrCode === 'string'
    ? errorOrCode
    : errorOrCode?.code || errorOrCode?.message || '';

  switch (errorCode) {
    case 'auth/account-exists-with-different-credential':
      return "This account is linked with Google. Please use 'Continue with Google' to sign in.";
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      return 'The email or password you entered is incorrect. Please try again.';
    case 'auth/user-not-found':
      return 'No account found with this email.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    case 'auth/email-already-in-use':
      return 'This email is already registered. Please sign in instead.';
    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 6 characters.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/operation-not-allowed':
      return 'Email/Password sign-in is currently disabled. Please use Google Sign-In.';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Sign-in popup was closed before completion.';
    case 'auth/popup-blocked':
      return 'Sign-in popup was blocked by your browser. Please allow popups for this site.';
    case 'auth/requires-recent-login':
      return 'Session expired. Please log in again to continue.';
    case 'auth/expired-action-code':
      return 'This password reset link has expired. Please request a new one.';
    case 'auth/invalid-action-code':
      return 'This password reset link is invalid or has already been used.';
    case 'auth/network-request-failed':
      return 'Network connection error. Please check your internet connection.';
    default:
      if (typeof errorCode === 'string') {
        if (errorCode.includes('invalid-credential') || errorCode.includes('wrong-password')) {
          return 'The email or password you entered is incorrect. Please try again.';
        }
        if (errorCode.includes('user-not-found')) {
          return 'No account found with this email.';
        }
        if (errorCode.includes('too-many-requests')) {
          return 'Too many attempts. Please try again later.';
        }
        if (errorCode.includes('email-already-in-use')) {
          return 'This email is already registered. Please sign in instead.';
        }
        if (errorCode.includes('network')) {
          return 'Network connection error. Please check your internet connection.';
        }
      }
      return 'Authentication failed. Please check your connection.';
  }
};

export interface ProfileData {
  fullName?: string | null;
  name?: string | null;
  address?: string | null;
  fullAddress?: string | null;
  deliveryAddress?: string | null;
  city?: string | null;
  zipCode?: string | null;
  zipcode?: string | null;
}

/**
 * Helper function `isProfileComplete` that returns `true` ONLY if the following fields are NOT empty/null:
 * - FullName
 * - FullAddress
 * - City
 * - ZipCode
 * Phone Number is optional, so it doesn't affect the verification status.
 */
export function isProfileComplete(
  profileOrName?: ProfileData | string | null,
  address?: string | null,
  city?: string | null,
  zipCode?: string | null
): boolean {
  if (profileOrName && typeof profileOrName === 'object') {
    const nameVal = (profileOrName.fullName || profileOrName.name || '').trim();
    const addressVal = (profileOrName.fullAddress || profileOrName.address || profileOrName.deliveryAddress || '').trim();
    const cityVal = (profileOrName.city || '').trim();
    const zipCodeVal = (profileOrName.zipCode || profileOrName.zipcode || '').trim();

    return Boolean(
      nameVal.length > 0 &&
      addressVal.length > 0 &&
      cityVal.length > 0 &&
      zipCodeVal.length > 0
    );
  }

  const nameVal = typeof profileOrName === 'string' ? profileOrName.trim() : '';
  const addressVal = (address || '').trim();
  const cityVal = (city || '').trim();
  const zipCodeVal = (zipCode || '').trim();

  return Boolean(
    nameVal.length > 0 &&
    addressVal.length > 0 &&
    cityVal.length > 0 &&
    zipCodeVal.length > 0
  );
}

export function isKeyboardMashOrSpam(text: string): boolean {
  const clean = text.toLowerCase().trim();
  if (clean.length < 3) return false;

  // 1. Repeating identical characters >= 4 times (e.g. "aaaa", "1111", "xxxx")
  if (/(.)\1{3,}/.test(clean)) return true;

  // 2. Common keyboard mash sequences
  const spamSequences = [
    'asdf', 'fdsa', 'asdfgh', 'asdfghjk', 'qwerty', 'ytrewq', 'zxcvb', 'bvcxz',
    '12345', '54321', '123456', 'abcdef', 'fedcba', 'cxfgv', 'xdhh', 'ghjkl',
    'qazwsx', 'wsxedc', 'edcrfv', 'rfvtgb', 'tgbnhy', 'yhnmju', 'ujmik',
    'poiiuy', 'lkjhg', 'mnbvc', '09876'
  ];
  for (const seq of spamSequences) {
    if (clean.includes(seq)) return true;
  }

  // 3. Excessive consonant cluster without any vowels or spaces in a word (> 6 consonants)
  const words = clean.split(/\s+/);
  for (const word of words) {
    if (word.length >= 7 && !/[aeiouy0-9\u0980-\u09FF]/.test(word)) {
      return true;
    }
  }

  return false;
}

export const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim().toLowerCase());
};

export function checkEmailAuthenticity(inputEmail: string): { valid: boolean; message?: string } {
  if (!isValidEmail(inputEmail)) {
    return { valid: false, message: 'Please enter a valid email address.' };
  }
  return { valid: true };
}

// Anti-Spam Address/Location Validation
export function checkAddressAuthenticity(addressStr: string): { valid: boolean; message?: string } {
  if (!addressStr || addressStr.trim().length === 0) return { valid: true };
  
  const clean = addressStr.trim();
  if (clean.length < 3) {
    return { valid: false, message: 'Location / City must be at least 3 characters if provided.' };
  }
  
  if (isKeyboardMashOrSpam(clean)) {
    return { valid: false, message: 'Please enter a genuine location.' };
  }
  
  if (!/[a-zA-Z\u0980-\u09FF]/.test(clean)) {
    return { valid: false, message: 'Please provide a valid text location with city/area name.' };
  }
  
  return { valid: true };
}

// Phone Validation (Optional, but if entered must be 11-digit BD operator number)
export function checkPhoneAuthenticity(phoneStr: string): { valid: boolean; message?: string } {
  if (!phoneStr || phoneStr.trim().length === 0) return { valid: true };
  
  const clean = phoneStr.trim().replace(/[\s-]/g, '');
  
  const bdPhoneRegex = /^(?:\+?8801|01)[3-9]\d{8}$/;
  if (!bdPhoneRegex.test(clean)) {
    return { valid: false, message: 'Invalid Bangladesh phone number (11 digits: e.g. 01738337839 or 013-019).' };
  }
  
  const digits = clean.replace(/^\+?88/, '');
  const suffix = digits.substring(2);
  
  if (/^(.)\1{8}$/.test(suffix)) {
    return { valid: false, message: 'Please enter a genuine active phone number.' };
  }
  
  return { valid: true };
}

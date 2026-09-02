export const DEFAULT_FOUNDER_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' rx='40' fill='%230f172a'/%3E%3Cpath d='M100 95a32 32 0 100-64 32 32 0 000 64zm0 18c-38 0-70 24-70 54v9h140v-9c0-30-32-54-70-54z' fill='%2310b981'/%3E%3C/svg%3E";
export const DEFAULT_USER_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' rx='40' fill='%230f172a'/%3E%3Cpath d='M100 95a32 32 0 100-64 32 32 0 000 64zm0 18c-38 0-70 24-70 54v9h140v-9c0-30-32-54-70-54z' fill='%2364748b'/%3E%3C/svg%3E";

/**
 * Automatically converts Google Drive share links, Dropbox links, and standard URLs
 * into direct embeddable image URLs.
 */
export function formatDirectImageUrl(url: string | undefined | null): string {
  if (!url || typeof url !== 'string') return '';
  const cleanUrl = url.trim();

  // Replace dead or broken default avatar links
  if (cleanUrl.includes('vzR0h2M/default-avatar') || cleanUrl.includes('default-avatar.png')) {
    return DEFAULT_FOUNDER_AVATAR;
  }

  // Handle Google Drive Links
  // Match patterns: drive.google.com/file/d/ID/... OR drive.google.com/open?id=ID OR drive.google.com/uc?id=ID
  const driveFileRegex = /drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=)([a-zA-Z0-9_-]+)/;
  const driveMatch = cleanUrl.match(driveFileRegex);

  if (driveMatch && driveMatch[1]) {
    const fileId = driveMatch[1];
    // Use Google Drive direct image stream thumbnail endpoint
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
  }

  // Handle Dropbox Links
  if (cleanUrl.includes('dropbox.com')) {
    return cleanUrl.replace('?dl=0', '?raw=1').replace('&dl=0', '&raw=1');
  }

  // Standard Image Link (ImgBB, Cloudinary, Firebase Storage, etc.)
  return cleanUrl;
}

/**
 * Automatically converts Google Drive share links, Dropbox links, and standard URLs
 * into direct embeddable image URLs.
 */
export function formatDirectImageUrl(url: string | undefined | null): string {
  if (!url || typeof url !== 'string') return '';
  const cleanUrl = url.trim();

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

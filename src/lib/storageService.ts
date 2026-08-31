import { ref, uploadBytes, getDownloadURL, deleteObject, getStorage } from 'firebase/storage';
import { getApp } from 'firebase/app';

/**
 * Pure client-side canvas compression for images (WebP/JPEG, max 900px, ~20-35KB per image)
 */
export async function compressImageFile(
  file: File,
  maxDimension = 900,
  quality = 0.72
): Promise<string> {
  return new Promise((resolve) => {
    // If SVG, return as data url
    if (file.type === 'image/svg+xml' || file.name.endsWith('.svg')) {
      const reader = new FileReader();
      reader.onload = (e) => resolve((e.target?.result as string) || '');
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const rawDataUrl = e.target?.result as string;
      if (!rawDataUrl) {
        resolve('');
        return;
      }

      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          try {
            // Try WebP first for optimal compression
            const webpUrl = canvas.toDataURL('image/webp', quality);
            if (webpUrl && webpUrl.startsWith('data:image/webp')) {
              resolve(webpUrl);
              return;
            }
          } catch {}
          resolve(canvas.toDataURL('image/jpeg', quality));
        } else {
          resolve(rawDataUrl);
        }
      };
      img.onerror = () => resolve(rawDataUrl);
      img.src = rawDataUrl;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

/**
 * Compress an existing Data URL if it is oversized
 */
export async function compressImageDataUrl(
  dataUrl: string,
  maxDimension = 900,
  quality = 0.72
): Promise<string> {
  if (!dataUrl || !dataUrl.startsWith('data:image/') || dataUrl.length < 50000) {
    return dataUrl;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, width);
      canvas.height = Math.max(1, height);
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        try {
          const webpUrl = canvas.toDataURL('image/webp', quality);
          if (webpUrl && webpUrl.startsWith('data:image/webp')) {
            resolve(webpUrl);
            return;
          }
        } catch {}
        resolve(canvas.toDataURL('image/jpeg', quality));
      } else {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/**
 * Enterprise Image File Compression & Upload Utility
 * Performs canvas compression first (~25KB payload), then attempts Firebase Storage if available.
 */
export async function uploadImageFile(
  file: File,
  folder: string = 'uploads',
  maxWidth: number = 900,
  quality: number = 0.72
): Promise<string> {
  // 1. First obtain an ultra-efficient compressed Data URL
  const compressedDataUrl = await compressImageFile(file, maxWidth, quality);

  // 2. Try Firebase Storage in background if configured
  try {
    const app = getApp();
    const storage = getStorage(app);
    const filename = `${folder}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}.webp`;
    const storageRef = ref(storage, filename);

    if (compressedDataUrl.startsWith('data:')) {
      const parts = compressedDataUrl.split(',');
      const byteString = atob(parts[1]);
      const mimeString = parts[0].split(':')[1].split(';')[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: mimeString });
      await uploadBytes(storageRef, blob, { contentType: mimeString });
      const downloadUrl = await getDownloadURL(storageRef);
      return downloadUrl;
    }
  } catch {
    // If Firebase Storage is unconfigured or blocked, safely return the lightweight base64
  }

  return compressedDataUrl;
}

/**
 * Upload Payment Screenshot directly to Firebase Storage: `payment_receipts/{orderId}_{timestamp}`
 */
export async function uploadPaymentReceipt(file: File, orderId?: string): Promise<string> {
  const folder = 'payment_receipts';
  return uploadImageFile(file, folder, 1000, 0.75);
}

/**
 * Universal media file uploader (supports images, videos, zip, pdf, etc.)
 */
export async function uploadMediaFile(file: File, folder: string = 'media'): Promise<string> {
  if (file.type.startsWith('image/')) {
    return uploadImageFile(file, folder);
  }

  try {
    const app = getApp();
    const storage = getStorage(app);
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${folder}/${Date.now()}_${safeName}`;
    const storageRef = ref(storage, filename);
    await uploadBytes(storageRef, file, { contentType: file.type || 'application/octet-stream' });
    return await getDownloadURL(storageRef);
  } catch (err) {
    console.warn('Storage binary upload fallback:', err);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}

/**
 * Smart Storage Cleanup: Deletes screenshot or asset from Firebase Storage if it's a storage URL
 */
export async function deleteStorageFile(fileUrl?: string | null): Promise<boolean> {
  if (!fileUrl) return false;
  try {
    if (fileUrl.includes('firebasestorage.googleapis.com') || fileUrl.includes('storage.googleapis.com')) {
      const app = getApp();
      const storage = getStorage(app);
      const fileRef = ref(storage, fileUrl);
      await deleteObject(fileRef);
      return true;
    }
  } catch (err) {
    console.warn('Storage delete warning (non-fatal):', err);
  }
  return false;
}



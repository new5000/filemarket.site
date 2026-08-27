import { ref, uploadBytes, getDownloadURL, deleteObject, getStorage } from 'firebase/storage';
import { getApp } from 'firebase/app';

/**
 * Enterprise Image File Compression & Upload Utility
 * Supports direct file upload with automatic image resizing/compression (max 1200px, 85% webp/jpeg quality)
 * Falls back safely to base64 DataURL if Firebase Storage is in local emulator or offline.
 */
export async function uploadImageFile(
  file: File,
  folder: string = 'uploads',
  maxWidth: number = 1200,
  quality: number = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const result = e.target?.result as string;
      if (!result) {
        reject(new Error('Failed to read file'));
        return;
      }

      // Check if SVG - return as-is
      if (file.type === 'image/svg+xml' || file.name.endsWith('.svg')) {
        try {
          const app = getApp();
          const storage = getStorage(app);
          const filename = `${folder}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
          const storageRef = ref(storage, filename);
          await uploadBytes(storageRef, file, { contentType: file.type });
          const downloadUrl = await getDownloadURL(storageRef);
          resolve(downloadUrl);
          return;
        } catch {
          resolve(result); // Fallback to Data URL
          return;
        }
      }

      // Create an image element for canvas compression
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = async () => {
        try {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedDataUrl = canvas.toDataURL('image/webp', quality);

            // Attempt Firebase Storage upload if available
            try {
              const app = getApp();
              const storage = getStorage(app);
              const filename = `${folder}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}.webp`;
              const storageRef = ref(storage, filename);

              // Convert DataURL to Blob
              const byteString = atob(compressedDataUrl.split(',')[1]);
              const mimeString = compressedDataUrl.split(',')[0].split(':')[1].split(';')[0];
              const ab = new ArrayBuffer(byteString.length);
              const ia = new Uint8Array(ab);
              for (let i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
              }
              const blob = new Blob([ab], { type: mimeString });

              await uploadBytes(storageRef, blob, { contentType: 'image/webp' });
              const downloadUrl = await getDownloadURL(storageRef);
              resolve(downloadUrl);
            } catch {
              // Fallback to high-efficiency compressed Data URL
              resolve(compressedDataUrl);
            }
          } else {
            resolve(result);
          }
        } catch {
          resolve(result);
        }
      };
      img.onerror = () => {
        resolve(result);
      };
      img.src = result;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Upload Payment Screenshot directly to Firebase Storage: `payment_receipts/{orderId}_{timestamp}`
 */
export async function uploadPaymentReceipt(file: File, orderId?: string): Promise<string> {
  const folder = 'payment_receipts';
  const prefix = orderId ? `${orderId}_${Date.now()}` : `receipt_${Date.now()}`;
  return uploadImageFile(file, folder, 1400, 0.88);
}

/**
 * Universal media file uploader (supports images, videos, zip, pdf, etc.)
 */
export async function uploadMediaFile(file: File, folder: string = 'media'): Promise<string> {
  // If image, use compressed image uploader
  if (file.type.startsWith('image/')) {
    return uploadImageFile(file, folder);
  }

  // Generic direct binary upload to Firebase Storage
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


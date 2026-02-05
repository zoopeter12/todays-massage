/**
 * Supabase Storage API Functions
 * Handles image upload, resize, compression, and validation
 */

import { supabase } from '@/lib/supabase/client';
import type {
  StorageBucket,
  ImageMimeType,
  ImageUploadOptions,
  ImageUploadResult,
  ImageValidationError,
  UploadProgress,
} from '@/types/storage';
import { BUCKET_CONFIGS as configs } from '@/types/storage';

/**
 * Validate image file before upload
 */
export function validateImage(
  file: File,
  bucket: StorageBucket
): ImageValidationError | null {
  const config = configs[bucket];

  // Check MIME type
  if (!config.allowedTypes.includes(file.type as ImageMimeType)) {
    return {
      code: 'INVALID_TYPE',
      message: `허용되지 않는 파일 형식입니다. 허용: ${config.allowedTypes.join(', ')}`,
    };
  }

  // Check file size
  if (file.size > config.maxSize) {
    const maxMB = config.maxSize / (1024 * 1024);
    return {
      code: 'FILE_TOO_LARGE',
      message: `파일 크기가 너무 큽니다. 최대 ${maxMB}MB까지 허용됩니다.`,
    };
  }

  return null;
}

/**
 * Resize image using Canvas API
 * Maintains aspect ratio and applies compression
 */
export async function resizeImage(
  file: File,
  maxWidth: number,
  maxHeight: number,
  quality: number = 0.85
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      let { width, height } = img;

      // Calculate new dimensions maintaining aspect ratio
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      canvas.width = width;
      canvas.height = height;

      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      // Draw with high quality
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to WebP for better compression, fallback to JPEG
      const outputType = 'image/webp';
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            // Fallback to JPEG if WebP fails
            canvas.toBlob(
              (jpegBlob) => {
                if (jpegBlob) {
                  resolve(jpegBlob);
                } else {
                  reject(new Error('Failed to create image blob'));
                }
              },
              'image/jpeg',
              quality
            );
          }
        },
        outputType,
        quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Generate unique filename with timestamp
 */
function generateFilename(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const ext = originalName.split('.').pop()?.toLowerCase() || 'webp';
  return `${timestamp}_${random}.${ext === 'gif' ? 'gif' : 'webp'}`;
}

/**
 * Build storage path based on bucket type
 */
function buildStoragePath(
  bucket: StorageBucket,
  filename: string,
  userId?: string,
  entityId?: string
): string {
  const parts: string[] = [];

  switch (bucket) {
    case 'reviews':
      // reviews/{userId}/{filename}
      if (userId) parts.push(userId);
      break;
    case 'shops':
      // shops/{entityId}/{filename}
      if (entityId) parts.push(entityId);
      break;
    case 'profiles':
      // profiles/{userId}/{filename}
      if (userId) parts.push(userId);
      break;
    case 'banners':
      // banners/{filename} - flat structure for admin banners
      break;
    case 'courses':
      // courses/{entityId}/{filename} - entityId is shop_id
      if (entityId) parts.push(entityId);
      break;
  }

  parts.push(filename);
  return parts.join('/');
}

/**
 * Upload single image to Supabase Storage
 */
export async function uploadImage(
  file: File,
  options: ImageUploadOptions
): Promise<ImageUploadResult> {
  const {
    bucket,
    userId,
    entityId,
    resize = true,
    maxWidth,
    maxHeight,
    quality,
  } = options;

  const config = configs[bucket];

  // Validate file
  const validationError = validateImage(file, bucket);
  if (validationError) {
    throw new Error(validationError.message);
  }

  let uploadBlob: Blob = file;
  let mimeType: ImageMimeType = file.type as ImageMimeType;

  // Resize image if enabled (skip for GIFs to preserve animation)
  if (resize && !file.type.includes('gif')) {
    try {
      uploadBlob = await resizeImage(
        file,
        maxWidth || config.defaultWidth,
        maxHeight || config.defaultHeight,
        quality || config.defaultQuality
      );
      mimeType = 'image/webp';
    } catch (error) {
      console.warn('Image resize failed, uploading original:', error);
      uploadBlob = file;
    }
  }

  // Generate unique filename and path
  const filename = generateFilename(file.name);
  const storagePath = buildStoragePath(bucket, filename, userId, entityId);

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(storagePath, uploadBlob, {
      contentType: mimeType,
      cacheControl: '31536000', // 1 year cache
      upsert: false,
    });

  if (error) {
    throw new Error(`업로드 실패: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);

  return {
    url: urlData.publicUrl,
    path: data.path,
    originalName: file.name,
    size: uploadBlob.size,
    mimeType,
  };
}

/**
 * Upload multiple images with progress tracking
 */
export async function uploadImages(
  files: File[],
  options: ImageUploadOptions,
  onProgress?: (progress: UploadProgress) => void
): Promise<ImageUploadResult[]> {
  const results: ImageUploadResult[] = [];
  const total = files.length;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    // Report progress
    onProgress?.({
      total,
      current: i + 1,
      percentage: Math.round(((i + 1) / total) * 100),
      currentFile: file.name,
    });

    const result = await uploadImage(file, options);
    results.push(result);
  }

  return results;
}

/**
 * Delete image from Supabase Storage
 */
export async function deleteImage(
  bucket: StorageBucket,
  path: string
): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove([path]);

  if (error) {
    throw new Error(`삭제 실패: ${error.message}`);
  }
}

/**
 * Delete multiple images from Supabase Storage
 */
export async function deleteImages(
  bucket: StorageBucket,
  paths: string[]
): Promise<void> {
  if (paths.length === 0) return;

  const { error } = await supabase.storage.from(bucket).remove(paths);

  if (error) {
    throw new Error(`삭제 실패: ${error.message}`);
  }
}

/**
 * Get public URL for an image
 */
export function getImageUrl(bucket: StorageBucket, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Extract path from full URL
 */
export function extractPathFromUrl(url: string, bucket: StorageBucket): string | null {
  const bucketUrl = `/storage/v1/object/public/${bucket}/`;
  const index = url.indexOf(bucketUrl);
  if (index === -1) return null;
  return url.substring(index + bucketUrl.length);
}

/**
 * Get signed URL for private access (if needed)
 */
export async function getSignedUrl(
  bucket: StorageBucket,
  path: string,
  expiresIn: number = 3600
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) {
    throw new Error(`서명된 URL 생성 실패: ${error.message}`);
  }

  return data.signedUrl;
}

/**
 * List images in a folder
 */
export async function listImages(
  bucket: StorageBucket,
  folder: string
): Promise<string[]> {
  const { data, error } = await supabase.storage.from(bucket).list(folder);

  if (error) {
    throw new Error(`목록 조회 실패: ${error.message}`);
  }

  return data
    .filter((item) => !item.id.endsWith('/')) // Exclude folders
    .map((item) => `${folder}/${item.name}`);
}

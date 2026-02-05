/**
 * Storage Type Definitions
 * Types for image upload and storage operations
 */

/**
 * Available storage buckets
 */
export type StorageBucket = 'reviews' | 'shops' | 'profiles' | 'banners' | 'courses';

/**
 * Allowed image MIME types
 */
export type ImageMimeType = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';

/**
 * Image upload options
 */
export interface ImageUploadOptions {
  /** Target storage bucket */
  bucket: StorageBucket;
  /** User ID for path organization */
  userId?: string;
  /** Entity ID (shop_id, review_id) for path organization */
  entityId?: string;
  /** Maximum file size in bytes (default: bucket limit) */
  maxSize?: number;
  /** Whether to resize image (default: true) */
  resize?: boolean;
  /** Maximum width for resize */
  maxWidth?: number;
  /** Maximum height for resize */
  maxHeight?: number;
  /** Image quality for compression (0-1) */
  quality?: number;
}

/**
 * Image upload result
 */
export interface ImageUploadResult {
  /** Full public URL */
  url: string;
  /** Storage path (bucket/folder/filename) */
  path: string;
  /** Original filename */
  originalName: string;
  /** File size in bytes */
  size: number;
  /** MIME type */
  mimeType: ImageMimeType;
}

/**
 * Image validation error
 */
export interface ImageValidationError {
  code: 'INVALID_TYPE' | 'FILE_TOO_LARGE' | 'UPLOAD_FAILED' | 'RESIZE_FAILED';
  message: string;
}

/**
 * Bucket configuration
 */
export interface BucketConfig {
  name: StorageBucket;
  maxSize: number; // bytes
  allowedTypes: ImageMimeType[];
  defaultWidth: number;
  defaultHeight: number;
  defaultQuality: number;
}

/**
 * Predefined bucket configurations
 */
export const BUCKET_CONFIGS: Record<StorageBucket, BucketConfig> = {
  reviews: {
    name: 'reviews',
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    defaultWidth: 1200,
    defaultHeight: 1200,
    defaultQuality: 0.85,
  },
  shops: {
    name: 'shops',
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    defaultWidth: 1920,
    defaultHeight: 1080,
    defaultQuality: 0.9,
  },
  profiles: {
    name: 'profiles',
    maxSize: 2 * 1024 * 1024, // 2MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    defaultWidth: 400,
    defaultHeight: 400,
    defaultQuality: 0.9,
  },
  banners: {
    name: 'banners',
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    defaultWidth: 1920,
    defaultHeight: 600,
    defaultQuality: 0.9,
  },
  courses: {
    name: 'courses',
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    defaultWidth: 800,
    defaultHeight: 600,
    defaultQuality: 0.85,
  },
};

/**
 * Multiple images upload progress
 */
export interface UploadProgress {
  total: number;
  current: number;
  percentage: number;
  currentFile?: string;
}

/**
 * Upload state for components
 */
export type UploadState = 'idle' | 'selecting' | 'processing' | 'uploading' | 'success' | 'error';

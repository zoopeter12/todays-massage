/**
 * Image Upload Hook
 * Provides state management and utilities for image upload operations
 */

import { useState, useCallback, useMemo } from 'react';
import {
  uploadImage,
  uploadImages,
  deleteImage,
  validateImage,
} from '@/lib/api/storage';
import type {
  StorageBucket,
  ImageUploadResult,
  ImageUploadOptions,
  UploadProgress,
  UploadState,
  ImageValidationError,
} from '@/types/storage';

export interface UseImageUploadOptions {
  /** Target storage bucket */
  bucket: StorageBucket;
  /** User ID for path organization */
  userId?: string;
  /** Entity ID (shop_id, review_id) for path organization */
  entityId?: string;
  /** Maximum number of images (for multi-upload) */
  maxImages?: number;
  /** Initial images (URLs) */
  initialImages?: string[];
  /** Callback when upload completes */
  onUploadComplete?: (results: ImageUploadResult[]) => void;
  /** Callback when error occurs */
  onError?: (error: Error) => void;
}

export interface UseImageUploadReturn {
  /** Current upload state */
  state: UploadState;
  /** Uploaded image URLs */
  images: string[];
  /** Upload progress (for multi-upload) */
  progress: UploadProgress | null;
  /** Error message */
  error: string | null;
  /** Validation errors for each file */
  validationErrors: ImageValidationError[];
  /** Upload single image */
  upload: (file: File) => Promise<ImageUploadResult | null>;
  /** Upload multiple images */
  uploadMultiple: (files: File[]) => Promise<ImageUploadResult[]>;
  /** Remove image by URL */
  remove: (url: string) => Promise<void>;
  /** Clear all images */
  clear: () => void;
  /** Reset state */
  reset: () => void;
  /** Validate files before upload */
  validate: (files: File[]) => ImageValidationError[];
}

/**
 * Hook for managing image uploads
 */
export function useImageUpload(
  options: UseImageUploadOptions
): UseImageUploadReturn {
  const {
    bucket,
    userId,
    entityId,
    maxImages = 10,
    initialImages = [],
    onUploadComplete,
    onError,
  } = options;

  const [state, setState] = useState<UploadState>('idle');
  const [images, setImages] = useState<string[]>(initialImages);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ImageValidationError[]>([]);

  // Build upload options with useMemo to prevent recreation
  const uploadOptions: ImageUploadOptions = useMemo(() => ({
    bucket,
    userId,
    entityId,
    resize: true,
  }), [bucket, userId, entityId]);

  /**
   * Validate files before upload
   */
  const validate = useCallback(
    (files: File[]): ImageValidationError[] => {
      const errors: ImageValidationError[] = [];

      // Check max images limit
      const totalAfterUpload = images.length + files.length;
      if (totalAfterUpload > maxImages) {
        errors.push({
          code: 'FILE_TOO_LARGE',
          message: `최대 ${maxImages}개의 이미지만 업로드할 수 있습니다.`,
        });
      }

      // Validate each file
      files.forEach((file) => {
        const fileError = validateImage(file, bucket);
        if (fileError) {
          errors.push(fileError);
        }
      });

      return errors;
    },
    [bucket, images.length, maxImages]
  );

  /**
   * Upload single image
   */
  const upload = useCallback(
    async (file: File): Promise<ImageUploadResult | null> => {
      // Validate
      const errors = validate([file]);
      if (errors.length > 0) {
        setValidationErrors(errors);
        setError(errors[0].message);
        return null;
      }

      setState('uploading');
      setError(null);
      setValidationErrors([]);

      try {
        const result = await uploadImage(file, uploadOptions);
        setImages((prev) => [...prev, result.url]);
        setState('success');
        onUploadComplete?.([result]);
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '업로드 실패';
        setError(errorMessage);
        setState('error');
        onError?.(err instanceof Error ? err : new Error(errorMessage));
        return null;
      }
    },
    [validate, uploadOptions, onUploadComplete, onError]
  );

  /**
   * Upload multiple images
   */
  const uploadMultiple = useCallback(
    async (files: File[]): Promise<ImageUploadResult[]> => {
      // Validate
      const errors = validate(files);
      if (errors.length > 0) {
        setValidationErrors(errors);
        setError(errors[0].message);
        return [];
      }

      setState('uploading');
      setError(null);
      setValidationErrors([]);
      setProgress({ total: files.length, current: 0, percentage: 0 });

      try {
        const results = await uploadImages(files, uploadOptions, (prog) => {
          setProgress(prog);
        });

        const urls = results.map((r) => r.url);
        setImages((prev) => [...prev, ...urls]);
        setState('success');
        setProgress(null);
        onUploadComplete?.(results);
        return results;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '업로드 실패';
        setError(errorMessage);
        setState('error');
        setProgress(null);
        onError?.(err instanceof Error ? err : new Error(errorMessage));
        return [];
      }
    },
    [validate, uploadOptions, onUploadComplete, onError]
  );

  /**
   * Remove image by URL
   */
  const remove = useCallback(
    async (url: string): Promise<void> => {
      // Extract path from URL
      const path = url.split(`/storage/v1/object/public/${bucket}/`)[1];
      if (!path) {
        setImages((prev) => prev.filter((img) => img !== url));
        return;
      }

      try {
        await deleteImage(bucket, path);
        setImages((prev) => prev.filter((img) => img !== url));
      } catch (err) {
        // Still remove from local state even if delete fails
        setImages((prev) => prev.filter((img) => img !== url));
        console.warn('Failed to delete image from storage:', err);
      }
    },
    [bucket]
  );

  /**
   * Clear all images
   */
  const clear = useCallback(() => {
    setImages([]);
  }, []);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setState('idle');
    setImages(initialImages);
    setProgress(null);
    setError(null);
    setValidationErrors([]);
  }, [initialImages]);

  return {
    state,
    images,
    progress,
    error,
    validationErrors,
    upload,
    uploadMultiple,
    remove,
    clear,
    reset,
    validate,
  };
}

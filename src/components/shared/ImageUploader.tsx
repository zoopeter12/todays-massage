'use client';

/**
 * ImageUploader Component
 * Handles single and multiple image uploads with preview
 * Supports drag & drop, file selection, and camera capture
 */

import { useCallback, useRef, useState } from 'react';
import { ImagePlus, X, Upload, Loader2, AlertCircle, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useImageUpload, UseImageUploadOptions } from '@/hooks/useImageUpload';
import { BUCKET_CONFIGS } from '@/types/storage';

export interface ImageUploaderProps extends Omit<UseImageUploadOptions, 'onUploadComplete'> {
  /** Additional class names */
  className?: string;
  /** Whether multiple files are allowed */
  multiple?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Whether component is disabled */
  disabled?: boolean;
  /** Show camera capture button (mobile) */
  showCameraButton?: boolean;
  /** Callback when images change */
  onChange?: (urls: string[]) => void;
  /** Compact mode for smaller displays */
  compact?: boolean;
}

export function ImageUploader({
  className,
  multiple = false,
  placeholder = '이미지를 업로드하세요',
  disabled = false,
  showCameraButton = true,
  onChange,
  compact = false,
  ...uploadOptions
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const {
    state,
    images,
    progress,
    error,
    upload,
    uploadMultiple,
    remove,
  } = useImageUpload({
    ...uploadOptions,
    onUploadComplete: (results) => {
      const urls = results.map((r) => r.url);
      onChange?.([...images, ...urls]);
    },
  });

  const config = BUCKET_CONFIGS[uploadOptions.bucket];
  const maxImages = uploadOptions.maxImages || 10;
  const canUploadMore = images.length < maxImages;
  const isUploading = state === 'uploading';

  // Handle file selection
  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      if (!canUploadMore || disabled || isUploading) return;

      const fileArray = Array.from(files);
      const filesToUpload = multiple
        ? fileArray.slice(0, maxImages - images.length)
        : [fileArray[0]];

      if (multiple) {
        await uploadMultiple(filesToUpload);
      } else {
        await upload(filesToUpload[0]);
      }
    },
    [canUploadMore, disabled, isUploading, multiple, maxImages, images.length, upload, uploadMultiple]
  );

  // Handle file input change
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFiles(files);
      }
      // Reset input
      e.target.value = '';
    },
    [handleFiles]
  );

  // Handle drag events
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        handleFiles(files);
      }
    },
    [handleFiles]
  );

  // Handle remove
  const handleRemove = useCallback(
    async (url: string) => {
      await remove(url);
      onChange?.(images.filter((img) => img !== url));
    },
    [remove, images, onChange]
  );

  // bucket 설정이 없는 경우 에러 방지
  if (!config) {
    console.error(`Invalid bucket configuration: ${uploadOptions.bucket}`);
    return (
      <div className="text-destructive text-sm">
        이미지 업로드 설정 오류가 발생했습니다.
      </div>
    );
  }

  const acceptTypes = config.allowedTypes.join(',');

  // Trigger file input
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Trigger camera input
  const triggerCameraInput = () => {
    cameraInputRef.current?.click();
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Drop Zone */}
      {canUploadMore && (
        <div
          className={cn(
            'relative border-2 border-dashed rounded-lg transition-colors',
            isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25',
            disabled || isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary/50',
            compact ? 'p-3' : 'p-6'
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={!disabled && !isUploading ? triggerFileInput : undefined}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
              {progress && (
                <div className="text-sm">
                  {progress.current} / {progress.total} 업로드 중... ({progress.percentage}%)
                </div>
              )}
            </div>
          ) : (
            <div className={cn(
              'flex items-center gap-4',
              compact ? 'flex-row' : 'flex-col'
            )}>
              <Upload className={cn('text-muted-foreground', compact ? 'h-6 w-6' : 'h-10 w-10')} />
              <div className={cn('text-center', compact && 'text-left')}>
                <p className={cn('text-muted-foreground', compact ? 'text-sm' : '')}>
                  {placeholder}
                </p>
                {!compact && (
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    최대 {config.maxSize / (1024 * 1024)}MB, {multiple ? `${maxImages}개까지` : '1개'}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Hidden file inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptTypes}
            multiple={multiple}
            onChange={handleInputChange}
            className="hidden"
            disabled={disabled || isUploading}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleInputChange}
            className="hidden"
            disabled={disabled || isUploading}
          />
        </div>
      )}

      {/* Camera button for mobile */}
      {showCameraButton && canUploadMore && !isUploading && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={triggerCameraInput}
          disabled={disabled}
          className="w-full sm:w-auto"
        >
          <Camera className="h-4 w-4 mr-2" />
          카메라로 촬영
        </Button>
      )}

      {/* Error display */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Image previews */}
      {images.length > 0 && (
        <ImagePreviewGrid
          images={images}
          onRemove={handleRemove}
          disabled={disabled || isUploading}
          compact={compact}
        />
      )}
    </div>
  );
}

/**
 * Image Preview Grid Component
 */
interface ImagePreviewGridProps {
  images: string[];
  onRemove: (url: string) => void;
  disabled?: boolean;
  compact?: boolean;
}

function ImagePreviewGrid({
  images,
  onRemove,
  disabled = false,
  compact = false,
}: ImagePreviewGridProps) {
  return (
    <div className={cn(
      'grid gap-2',
      compact ? 'grid-cols-4' : 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5'
    )}>
      {images.map((url, index) => (
        <ImagePreviewItem
          key={`${url}-${index}`}
          url={url}
          onRemove={() => onRemove(url)}
          disabled={disabled}
          compact={compact}
        />
      ))}
    </div>
  );
}

/**
 * Single Image Preview Item
 */
interface ImagePreviewItemProps {
  url: string;
  onRemove: () => void;
  disabled?: boolean;
  compact?: boolean;
}

function ImagePreviewItem({
  url,
  onRemove,
  disabled = false,
  compact = false,
}: ImagePreviewItemProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  return (
    <div
      className={cn(
        'relative aspect-square rounded-lg overflow-hidden border bg-muted group',
        compact ? 'w-16 h-16' : ''
      )}
    >
      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Error state */}
      {hasError ? (
        <div className="absolute inset-0 flex items-center justify-center bg-destructive/10">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
      ) : (
        <img
          src={url}
          alt="업로드된 이미지"
          className={cn(
            'w-full h-full object-cover transition-opacity',
            isLoading ? 'opacity-0' : 'opacity-100'
          )}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
        />
      )}

      {/* Remove button */}
      {!disabled && (
        <button
          type="button"
          onClick={onRemove}
          className={cn(
            'absolute top-1 right-1 p-1 rounded-full',
            'bg-black/60 text-white hover:bg-black/80',
            'opacity-0 group-hover:opacity-100 transition-opacity',
            'focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary'
          )}
          aria-label="이미지 삭제"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

/**
 * Standalone Image Preview Component (read-only)
 */
export interface ImagePreviewProps {
  images: string[];
  className?: string;
  maxDisplay?: number;
  onImageClick?: (url: string, index: number) => void;
}

export function ImagePreview({
  images,
  className,
  maxDisplay = 5,
  onImageClick,
}: ImagePreviewProps) {
  const displayImages = images.slice(0, maxDisplay);
  const remainingCount = images.length - maxDisplay;

  if (images.length === 0) return null;

  return (
    <div className={cn('flex gap-2 overflow-x-auto', className)}>
      {displayImages.map((url, index) => (
        <button
          key={`${url}-${index}`}
          type="button"
          onClick={() => onImageClick?.(url, index)}
          className={cn(
            'relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden',
            'border bg-muted',
            onImageClick && 'cursor-pointer hover:ring-2 hover:ring-primary'
          )}
        >
          <img
            src={url}
            alt={`이미지 ${index + 1}`}
            className="w-full h-full object-cover"
          />
          {index === displayImages.length - 1 && remainingCount > 0 && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="text-white font-semibold">+{remainingCount}</span>
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

export default ImageUploader;

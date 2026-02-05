'use client';

/**
 * ImageGallery Component
 * Full-screen image gallery with navigation
 * Supports swipe gestures and keyboard navigation
 */

import { useCallback, useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface ImageGalleryProps {
  /** Array of image URLs */
  images: string[];
  /** Initial image index to display */
  initialIndex?: number;
  /** Whether gallery is open */
  isOpen: boolean;
  /** Callback when gallery closes */
  onClose: () => void;
  /** Show download button */
  showDownload?: boolean;
  /** Alt text prefix */
  altPrefix?: string;
}

export function ImageGallery({
  images,
  initialIndex = 0,
  isOpen,
  onClose,
  showDownload = false,
  altPrefix = '이미지',
}: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  // Navigation functions (defined first for useEffect dependency)
  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    setIsZoomed(false);
  }, [images.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    setIsZoomed(false);
  }, [images.length]);

  // Reset index when images change or gallery opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setIsZoomed(false);
    }
  }, [isOpen, initialIndex]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          goToPrevious();
          break;
        case 'ArrowRight':
          goToNext();
          break;
        case 'z':
        case 'Z':
          setIsZoomed((prev) => !prev);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, goToPrevious, goToNext]);

  // Prevent body scroll when gallery is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Touch handling for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;

    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        goToNext();
      } else {
        goToPrevious();
      }
    }

    setTouchStart(null);
  };

  // Handle download
  const handleDownload = async () => {
    const url = images[currentIndex];
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `image_${currentIndex + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Failed to download image:', error);
    }
  };

  if (!isOpen || images.length === 0) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95"
      role="dialog"
      aria-modal="true"
      aria-label="이미지 갤러리"
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
        <span className="text-white text-sm">
          {currentIndex + 1} / {images.length}
        </span>
        <div className="flex items-center gap-2">
          {showDownload && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDownload}
              className="text-white hover:bg-white/20"
              aria-label="다운로드"
            >
              <Download className="h-5 w-5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsZoomed((prev) => !prev)}
            className="text-white hover:bg-white/20"
            aria-label={isZoomed ? '축소' : '확대'}
          >
            {isZoomed ? (
              <ZoomOut className="h-5 w-5" />
            ) : (
              <ZoomIn className="h-5 w-5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:bg-white/20"
            aria-label="닫기"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Main image area */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <img
          src={images[currentIndex]}
          alt={`${altPrefix} ${currentIndex + 1}`}
          className={cn(
            'max-h-full max-w-full object-contain transition-transform duration-200',
            isZoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'
          )}
          onClick={() => setIsZoomed((prev) => !prev)}
          draggable={false}
        />
      </div>

      {/* Navigation buttons */}
      {images.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPrevious}
            className={cn(
              'absolute left-4 top-1/2 -translate-y-1/2',
              'text-white hover:bg-white/20 h-12 w-12'
            )}
            aria-label="이전 이미지"
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNext}
            className={cn(
              'absolute right-4 top-1/2 -translate-y-1/2',
              'text-white hover:bg-white/20 h-12 w-12'
            )}
            aria-label="다음 이미지"
          >
            <ChevronRight className="h-8 w-8" />
          </Button>
        </>
      )}

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent">
          <div className="flex justify-center gap-2 overflow-x-auto">
            {images.map((url, index) => (
              <button
                key={`thumb-${index}`}
                type="button"
                onClick={() => {
                  setCurrentIndex(index);
                  setIsZoomed(false);
                }}
                className={cn(
                  'flex-shrink-0 w-12 h-12 rounded overflow-hidden',
                  'border-2 transition-all',
                  index === currentIndex
                    ? 'border-white opacity-100'
                    : 'border-transparent opacity-60 hover:opacity-100'
                )}
                aria-label={`${altPrefix} ${index + 1} 보기`}
                aria-current={index === currentIndex}
              >
                <img
                  src={url}
                  alt=""
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Hook for managing gallery state
 */
export function useImageGallery() {
  const [isOpen, setIsOpen] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [initialIndex, setInitialIndex] = useState(0);

  const openGallery = useCallback((imageUrls: string[], startIndex = 0) => {
    setImages(imageUrls);
    setInitialIndex(startIndex);
    setIsOpen(true);
  }, []);

  const closeGallery = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    images,
    initialIndex,
    openGallery,
    closeGallery,
  };
}

export default ImageGallery;

'use client';

/**
 * ImageUploader Usage Examples
 * This file demonstrates how to use the ImageUploader component
 * in various scenarios throughout the application.
 */

import { useState } from 'react';
import { ImageUploader, ImagePreview, ImageGallery, useImageGallery } from '@/components/shared';

// =============================================================================
// Example 1: Review Image Upload (Multiple images, customer use)
// =============================================================================
export function ReviewImageUploadExample() {
  const [reviewImages, setReviewImages] = useState<string[]>([]);

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">리뷰 이미지 업로드</h3>
      <ImageUploader
        bucket="reviews"
        userId="user-123" // Get from auth context
        multiple={true}
        maxImages={5}
        placeholder="리뷰 사진을 추가하세요 (최대 5장)"
        onChange={setReviewImages}
        showCameraButton={true}
      />

      {/* Preview of selected images */}
      {reviewImages.length > 0 && (
        <div>
          <p className="text-sm text-muted-foreground">
            {reviewImages.length}개의 이미지가 선택됨
          </p>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Example 2: Shop Image Upload (Partner dashboard)
// =============================================================================
export function ShopImageUploadExample() {
  const [shopImages, setShopImages] = useState<string[]>([
    // Existing images from database
    'https://example.com/existing-image-1.jpg',
    'https://example.com/existing-image-2.jpg',
  ]);

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">샵 이미지 관리</h3>
      <ImageUploader
        bucket="shops"
        entityId="shop-456" // Current shop ID
        multiple={true}
        maxImages={10}
        initialImages={shopImages}
        placeholder="샵 대표 이미지를 업로드하세요"
        onChange={setShopImages}
        showCameraButton={false} // Desktop admin use
      />
    </div>
  );
}

// =============================================================================
// Example 3: Profile Image Upload (Single image)
// =============================================================================
export function ProfileImageUploadExample() {
  const [profileImage, setProfileImage] = useState<string[]>([]);

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">프로필 이미지</h3>
      <ImageUploader
        bucket="profiles"
        userId="user-123"
        multiple={false}
        maxImages={1}
        placeholder="프로필 사진을 선택하세요"
        onChange={setProfileImage}
        compact={true}
      />
    </div>
  );
}

// =============================================================================
// Example 4: Read-only Image Preview with Gallery
// =============================================================================
export function ImagePreviewWithGalleryExample() {
  const gallery = useImageGallery();

  const images = [
    'https://example.com/image-1.jpg',
    'https://example.com/image-2.jpg',
    'https://example.com/image-3.jpg',
    'https://example.com/image-4.jpg',
    'https://example.com/image-5.jpg',
    'https://example.com/image-6.jpg',
  ];

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">리뷰 이미지</h3>

      {/* Preview (shows first 5, +N for remaining) */}
      <ImagePreview
        images={images}
        maxDisplay={5}
        onImageClick={(url, index) => {
          gallery.openGallery(images, index);
        }}
      />

      {/* Full-screen gallery modal */}
      <ImageGallery
        images={gallery.images}
        initialIndex={gallery.initialIndex}
        isOpen={gallery.isOpen}
        onClose={gallery.closeGallery}
        showDownload={true}
      />
    </div>
  );
}

// =============================================================================
// Example 5: Form Integration with react-hook-form
// =============================================================================
import { useForm } from 'react-hook-form';

interface ReviewFormData {
  rating: number;
  comment: string;
  images: string[];
}

export function ReviewFormIntegrationExample() {
  const { register, handleSubmit, setValue, watch } = useForm<ReviewFormData>({
    defaultValues: {
      rating: 5,
      comment: '',
      images: [],
    },
  });

  const images = watch('images');

  const onSubmit = (data: ReviewFormData) => {
    console.log('Review submitted:', data);
    // Send to API
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Rating and comment fields */}
      <input type="hidden" {...register('rating')} />
      <textarea
        {...register('comment')}
        placeholder="리뷰를 작성하세요"
        className="w-full border rounded-lg p-3"
      />

      {/* Image upload integrated with form */}
      <ImageUploader
        bucket="reviews"
        userId="user-123"
        multiple={true}
        maxImages={5}
        initialImages={images}
        onChange={(urls) => setValue('images', urls)}
        placeholder="사진 추가 (선택)"
      />

      <button
        type="submit"
        className="w-full bg-primary text-white py-2 rounded-lg"
      >
        리뷰 등록
      </button>
    </form>
  );
}

// =============================================================================
// Example 6: Using the hook directly for custom UI
// =============================================================================
import { useImageUpload } from '@/hooks/useImageUpload';

export function CustomImageUploadExample() {
  const {
    state,
    images,
    progress,
    error,
    upload,
    uploadMultiple,
    remove,
    validate,
  } = useImageUpload({
    bucket: 'reviews',
    userId: 'user-123',
    maxImages: 3,
    onUploadComplete: (results) => {
      console.log('Upload complete:', results);
    },
    onError: (err) => {
      console.error('Upload failed:', err);
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // Validate first
    const errors = validate(Array.from(files));
    if (errors.length > 0) {
      alert(errors.map(e => e.message).join('\n'));
      return;
    }

    // Upload
    uploadMultiple(Array.from(files));
  };

  return (
    <div>
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileSelect}
        disabled={state === 'uploading'}
      />

      {state === 'uploading' && progress && (
        <div>
          Uploading {progress.current}/{progress.total} ({progress.percentage}%)
        </div>
      )}

      {error && <div className="text-red-500">{error}</div>}

      <div className="flex gap-2 mt-4">
        {images.map((url, i) => (
          <div key={i} className="relative">
            <img src={url} alt="" className="w-20 h-20 object-cover" />
            <button onClick={() => remove(url)}>X</button>
          </div>
        ))}
      </div>
    </div>
  );
}

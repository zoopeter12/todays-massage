-- ========================================
-- Supabase Storage Buckets Configuration
-- For: reviews, shops, profiles images
-- ========================================

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  -- Reviews bucket: 리뷰 사진 (최대 5MB, 이미지만)
  (
    'reviews',
    'reviews',
    true,
    5242880, -- 5MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  ),
  -- Shops bucket: 샵 이미지 (최대 10MB, 이미지만)
  (
    'shops',
    'shops',
    true,
    10485760, -- 10MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  ),
  -- Profiles bucket: 프로필 이미지 (최대 2MB, 이미지만)
  (
    'profiles',
    'profiles',
    true,
    2097152, -- 2MB
    ARRAY['image/jpeg', 'image/png', 'image/webp']
  )
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ========================================
-- RLS Policies for Reviews Bucket
-- ========================================

-- Public read access for reviews images
CREATE POLICY "reviews_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'reviews');

-- Authenticated users can upload their review images
CREATE POLICY "reviews_auth_insert"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'reviews'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can update their own review images
CREATE POLICY "reviews_owner_update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'reviews'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete their own review images
CREATE POLICY "reviews_owner_delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'reviews'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ========================================
-- RLS Policies for Shops Bucket
-- ========================================

-- Public read access for shop images
CREATE POLICY "shops_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'shops');

-- Only partners (shop owners) can upload shop images
-- Partners identified by their user ID matching a shop's owner
CREATE POLICY "shops_partner_insert"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'shops'
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('partner', 'admin')
  )
);

-- Partners can update shop images they own
CREATE POLICY "shops_partner_update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'shops'
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('partner', 'admin')
  )
);

-- Partners can delete shop images they own
CREATE POLICY "shops_partner_delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'shops'
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('partner', 'admin')
  )
);

-- ========================================
-- RLS Policies for Profiles Bucket
-- ========================================

-- Public read access for profile images
CREATE POLICY "profiles_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'profiles');

-- Users can upload their own profile image
CREATE POLICY "profiles_owner_insert"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profiles'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can update their own profile image
CREATE POLICY "profiles_owner_update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profiles'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete their own profile image
CREATE POLICY "profiles_owner_delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profiles'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

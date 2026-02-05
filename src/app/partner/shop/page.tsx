'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  Store,
  MapPin,
  Phone,
  Image as ImageIcon,
  Edit,
  Save,
  X,
  Eye,
  Plus,
  Trash2,
  ZoomIn,
  GripVertical,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import NextImage from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { fetchShop, updateShop, getPartnerShopId } from '@/lib/api/partner';
import { Shop, ShopUpdate } from '@/types/supabase';
import { useImageUpload } from '@/hooks/useImageUpload';

const MAX_IMAGES = 10;

export default function ShopManagementPage() {
  const [shopId, setShopId] = useState<string | null>(null);
  const [noShop, setNoShop] = useState(false);
  const [shop, setShop] = useState<Shop | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Image management state
  const [shopImages, setShopImages] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isImageSaving, setIsImageSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    tel: '',
    category: '',
  });

  // Image upload hook
  const {
    state: uploadState,
    upload,
    uploadMultiple,
    remove: removeFromStorage,
    error: uploadError,
    progress,
  } = useImageUpload({
    bucket: 'shops',
    entityId: shopId || undefined,
    maxImages: MAX_IMAGES,
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Resolve the partner's shop ID on mount
  useEffect(() => {
    async function resolveShop() {
      const id = await getPartnerShopId();
      if (id) {
        setShopId(id);
      } else {
        setNoShop(true);
        setIsLoading(false);
      }
    }
    resolveShop();
  }, []);

  // Load shop data once shopId is resolved
  useEffect(() => {
    if (shopId) {
      loadShop(shopId);
    }
  }, [shopId]);

  async function loadShop(currentShopId: string) {
    try {
      setIsLoading(true);
      const data = await fetchShop(currentShopId);
      setShop(data);
      setShopImages(data.images || []);
      setFormData({
        name: data.name,
        address: data.address || '',
        tel: data.tel || '',
        category: data.category || '',
      });
    } catch (error) {
      console.error('Failed to load shop:', error);
      toast.error('가게 정보 로드 실패');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSave() {
    if (!shopId) return;
    try {
      setIsSaving(true);
      const updates: ShopUpdate = {
        name: formData.name,
        address: formData.address || null,
        tel: formData.tel || null,
        category: formData.category || null,
      };
      await updateShop(shopId, updates);
      toast.success('가게 정보가 저장되었습니다');
      setIsEditing(false);
      await loadShop(shopId);
    } catch (error) {
      console.error('Failed to update shop:', error);
      toast.error('저장 실패');
    } finally {
      setIsSaving(false);
    }
  }

  function handleCancel() {
    if (shop) {
      setFormData({
        name: shop.name,
        address: shop.address || '',
        tel: shop.tel || '',
        category: shop.category || '',
      });
    }
    setIsEditing(false);
  }

  async function toggleShopOpen() {
    if (!shop || !shopId) return;
    try {
      const newStatus = !shop.is_open;
      await updateShop(shopId, { is_open: newStatus });
      toast.success(newStatus ? '영업 시작됨' : '영업 종료 처리됨');
      await loadShop(shopId);
    } catch (error) {
      console.error('Failed to toggle shop status:', error);
      toast.error('영업 상태 변경 실패');
    }
  }

  // Image management functions
  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files || files.length === 0 || !shopId) return;

      // Check max images limit
      if (shopImages.length + files.length > MAX_IMAGES) {
        toast.error(`최대 ${MAX_IMAGES}개의 이미지만 업로드할 수 있습니다.`);
        return;
      }

      try {
        const fileArray = Array.from(files);
        let newUrls: string[] = [];

        if (fileArray.length === 1) {
          const result = await upload(fileArray[0]);
          if (result) {
            newUrls = [result.url];
          }
        } else {
          const results = await uploadMultiple(fileArray);
          newUrls = results.map((r) => r.url);
        }

        if (newUrls.length > 0) {
          const updatedImages = [...shopImages, ...newUrls];
          setShopImages(updatedImages);
          await saveImagesToShop(updatedImages);
          toast.success(`${newUrls.length}개의 이미지가 업로드되었습니다.`);
        }
      } catch (error) {
        console.error('Failed to upload images:', error);
        toast.error('이미지 업로드 실패');
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [shopId, shopImages, upload, uploadMultiple]
  );

  const handleDeleteClick = (imageUrl: string) => {
    setImageToDelete(imageUrl);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!imageToDelete || !shopId) return;

    try {
      setIsImageSaving(true);
      // Remove from storage
      await removeFromStorage(imageToDelete);
      // Update local state
      const updatedImages = shopImages.filter((img) => img !== imageToDelete);
      setShopImages(updatedImages);
      // Save to database
      await saveImagesToShop(updatedImages);
      toast.success('이미지가 삭제되었습니다.');
    } catch (error) {
      console.error('Failed to delete image:', error);
      toast.error('이미지 삭제 실패');
    } finally {
      setIsImageSaving(false);
      setDeleteDialogOpen(false);
      setImageToDelete(null);
    }
  };

  const handleReorder = async (newOrder: string[]) => {
    setShopImages(newOrder);
  };

  const handleReorderEnd = async () => {
    if (!shopId) return;
    try {
      await saveImagesToShop(shopImages);
      toast.success('이미지 순서가 변경되었습니다.');
    } catch (error) {
      console.error('Failed to save image order:', error);
      toast.error('순서 저장 실패');
    }
  };

  const saveImagesToShop = async (images: string[]) => {
    if (!shopId) return;
    setIsImageSaving(true);
    try {
      await updateShop(shopId, { images });
      // Update local shop state
      if (shop) {
        setShop({ ...shop, images });
      }
    } finally {
      setIsImageSaving(false);
    }
  };

  const openPreview = (imageUrl: string) => {
    setPreviewImage(imageUrl);
  };

  const closePreview = () => {
    setPreviewImage(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (noShop || !shop) {
    return (
      <div className="flex items-center justify-center py-20">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-yellow-50">
                <Store className="h-8 w-8 text-yellow-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">등록된 가게가 없습니다</h2>
              <p className="text-sm text-gray-500">
                가게를 관리하려면 먼저 가게를 등록해주세요.
                <br />
                관리자에게 문의하시면 가게 등록을 도와드립니다.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">가게 관리</h1>
          <p className="mt-1 text-sm text-gray-500">가게 정보 및 설정을 관리합니다</p>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)}>
            <Edit className="mr-2 h-4 w-4" />
            정보 수정
          </Button>
        )}
      </div>

      {/* Operating Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Store className="mr-2 h-5 w-5 text-blue-600" />
            영업 상태
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">현재 영업 상태</p>
              <p className="text-sm text-gray-500">
                고객에게 예약 가능 여부를 표시합니다
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant={shop.is_open ? 'default' : 'secondary'}>
                {shop.is_open ? '영업중' : '영업종료'}
              </Badge>
              <Switch checked={shop.is_open} onCheckedChange={toggleShopOpen} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shop Information */}
      <Card>
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
          <CardDescription>가게의 기본 정보를 관리합니다</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Shop Name */}
            <div className="space-y-2">
              <Label htmlFor="name">가게 이름</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={!isEditing}
                placeholder="가게 이름을 입력하세요"
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">카테고리</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                disabled={!isEditing}
                placeholder="예: 타이, 스웨디시, 아로마"
              />
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center">
                <MapPin className="mr-1 h-4 w-4" />
                주소
              </Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                disabled={!isEditing}
                placeholder="가게 주소를 입력하세요"
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="tel" className="flex items-center">
                <Phone className="mr-1 h-4 w-4" />
                연락처
              </Label>
              <Input
                id="tel"
                value={formData.tel}
                onChange={(e) => setFormData({ ...formData, tel: e.target.value })}
                disabled={!isEditing}
                placeholder="예: 02-1234-5678"
              />
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="flex space-x-2 pt-4">
                <Button onClick={handleSave} disabled={isSaving}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? '저장중...' : '저장'}
                </Button>
                <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                  <X className="mr-2 h-4 w-4" />
                  취소
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Eye className="mr-2 h-5 w-5 text-blue-600" />
            통계
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border p-4">
              <p className="text-sm text-gray-500">총 조회수</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {shop.view_count.toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-gray-500">등록된 이미지</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{shop.images.length}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-gray-500">등록일</p>
              <p className="mt-2 text-sm font-medium text-gray-900">
                {new Date(shop.created_at).toLocaleDateString('ko-KR')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Images Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <ImageIcon className="mr-2 h-5 w-5 text-blue-600" />
                가게 이미지
              </CardTitle>
              <CardDescription>
                최대 {MAX_IMAGES}개의 이미지를 등록할 수 있습니다. ({shopImages.length}/{MAX_IMAGES})
              </CardDescription>
            </div>
            {isImageSaving && (
              <div className="flex items-center text-sm text-gray-500">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                저장 중...
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />

          {/* Upload progress */}
          {uploadState === 'uploading' && progress && (
            <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-700">
                  업로드 중... ({progress.current}/{progress.total})
                </span>
                <span className="text-sm text-blue-600">{progress.percentage}%</span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-blue-200">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
            </div>
          )}

          {/* Error display */}
          {uploadError && (
            <div className="mb-4 flex items-center rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
              <AlertTriangle className="mr-2 h-5 w-5" />
              <span className="text-sm">{uploadError}</span>
            </div>
          )}

          {/* Image grid with reorder */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
            {/* Add image button */}
            {shopImages.length < MAX_IMAGES && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadState === 'uploading'}
                className="relative flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 transition-colors hover:border-blue-400 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uploadState === 'uploading' ? (
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                ) : (
                  <>
                    <Plus className="h-8 w-8 text-gray-400" />
                    <span className="mt-2 text-sm text-gray-500">이미지 추가</span>
                  </>
                )}
              </motion.button>
            )}

            {/* Existing images with reorder */}
            <Reorder.Group
              axis="x"
              values={shopImages}
              onReorder={handleReorder}
              className="contents"
            >
              <AnimatePresence>
                {shopImages.map((image, index) => (
                  <Reorder.Item
                    key={image}
                    value={image}
                    onDragStart={() => setIsDragging(true)}
                    onDragEnd={() => {
                      setIsDragging(false);
                      handleReorderEnd();
                    }}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                    className="group relative aspect-square overflow-hidden rounded-lg border bg-gray-100"
                    style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                  >
                    <NextImage
                      src={image}
                      alt={`${shop.name} 이미지 ${index + 1}`}
                      fill
                      className="object-cover"
                      unoptimized
                    />

                    {/* Overlay with actions */}
                    <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100">
                      {/* Drag handle */}
                      <div className="absolute left-2 top-2 rounded bg-white/90 p-1.5 shadow-sm">
                        <GripVertical className="h-4 w-4 text-gray-600" />
                      </div>

                      {/* Image number badge */}
                      <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-xs font-medium text-gray-700 shadow-sm">
                        {index + 1}
                      </div>

                      {/* Action buttons */}
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-10 w-10 rounded-full bg-white/90 hover:bg-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          openPreview(image);
                        }}
                      >
                        <ZoomIn className="h-5 w-5 text-gray-700" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        className="h-10 w-10 rounded-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(image);
                        }}
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </Reorder.Item>
                ))}
              </AnimatePresence>
            </Reorder.Group>
          </div>

          {/* Empty state */}
          {shopImages.length === 0 && uploadState !== 'uploading' && (
            <div className="mt-4 py-8 text-center">
              <ImageIcon className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-4 text-sm text-gray-500">
                등록된 이미지가 없습니다.
                <br />
                위의 추가 버튼을 클릭하여 이미지를 등록하세요.
              </p>
            </div>
          )}

          {/* Drag hint */}
          {shopImages.length > 1 && (
            <p className="mt-4 text-center text-xs text-gray-400">
              이미지를 드래그하여 순서를 변경할 수 있습니다.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>이미지 삭제</DialogTitle>
            <DialogDescription>
              이 이미지를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          {imageToDelete && (
            <div className="relative mx-auto aspect-video w-full max-w-[300px] overflow-hidden rounded-lg border">
              <NextImage
                src={imageToDelete}
                alt="삭제할 이미지"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isImageSaving}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isImageSaving}
            >
              {isImageSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  삭제 중...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  삭제
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Preview Dialog */}
      <Dialog open={!!previewImage} onOpenChange={closePreview}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>이미지 미리보기</DialogTitle>
          </DialogHeader>
          {previewImage && (
            <div className="relative aspect-video w-full overflow-hidden rounded-lg">
              <NextImage
                src={previewImage}
                alt="미리보기"
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Plus, Pencil, Trash2, Clock, Tag, ImagePlus, X, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import {
  getPartnerShopId,
  fetchShopCourses,
  createCourse,
  updateCourse,
  deleteCourse,
} from '@/lib/api/partner';
import { uploadImage, deleteImage, extractPathFromUrl } from '@/lib/api/storage';
import { Course } from '@/types/supabase';

interface CourseFormData {
  name: string;
  description: string;
  image_url: string;
  price_original: string;
  price_discount: string;
  duration: string;
}

const initialFormData: CourseFormData = {
  name: '',
  description: '',
  image_url: '',
  price_original: '',
  price_discount: '',
  duration: '',
};

interface FormErrors {
  name?: string;
  description?: string;
  price_original?: string;
  price_discount?: string;
  duration?: string;
}

const MAX_DESCRIPTION_LENGTH = 500;

export default function CoursesPage() {
  const [shopId, setShopId] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [deletingCourseId, setDeletingCourseId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CourseFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadCourses = useCallback(async (sid: string) => {
    try {
      const data = await fetchShopCourses(sid);
      setCourses(data);
    } catch (error) {
      toast.error('코스 목록을 불러오는데 실패했습니다.');
    }
  }, []);

  useEffect(() => {
    async function init() {
      setIsLoading(true);
      try {
        const id = await getPartnerShopId();
        if (!id) {
          toast.error('가게 정보를 찾을 수 없습니다.');
          setIsLoading(false);
          return;
        }
        setShopId(id);
        await loadCourses(id);
      } catch (error) {
        toast.error('데이터를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, [loadCourses]);

  function validateForm(): boolean {
    const errors: FormErrors = {};

    if (!formData.name.trim()) {
      errors.name = '코스명을 입력해주세요.';
    }

    if (formData.description.length > MAX_DESCRIPTION_LENGTH) {
      errors.description = `설명은 ${MAX_DESCRIPTION_LENGTH}자 이하로 입력해주세요.`;
    }

    const priceOriginal = Number(formData.price_original);
    if (!formData.price_original || isNaN(priceOriginal) || priceOriginal < 0) {
      errors.price_original = '정가를 0 이상으로 입력해주세요.';
    }

    if (formData.price_discount) {
      const priceDiscount = Number(formData.price_discount);
      if (isNaN(priceDiscount) || priceDiscount < 0) {
        errors.price_discount = '할인가를 0 이상으로 입력해주세요.';
      }
      if (!isNaN(priceDiscount) && !isNaN(priceOriginal) && priceDiscount > priceOriginal) {
        errors.price_discount = '할인가는 정가보다 낮아야 합니다.';
      }
    }

    const duration = Number(formData.duration);
    if (!formData.duration || isNaN(duration) || duration < 15) {
      errors.duration = '소요시간은 15분 이상이어야 합니다.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleOpenCreate() {
    setEditingCourse(null);
    setFormData(initialFormData);
    setFormErrors({});
    setIsDialogOpen(true);
  }

  function handleOpenEdit(course: Course) {
    setEditingCourse(course);
    setFormData({
      name: course.name,
      description: course.description || '',
      image_url: course.image_url || '',
      price_original: String(course.price_original),
      price_discount: course.price_discount != null ? String(course.price_discount) : '',
      duration: String(course.duration),
    });
    setFormErrors({});
    setIsDialogOpen(true);
  }

  function handleOpenDelete(courseId: string) {
    setDeletingCourseId(courseId);
    setIsDeleteDialogOpen(true);
  }

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !shopId) return;

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    setIsUploading(true);
    try {
      const result = await uploadImage(file, {
        bucket: 'courses',
        entityId: shopId,
      });

      setFormData((prev) => ({ ...prev, image_url: result.url }));
      toast.success('이미지가 업로드되었습니다.');
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error(error instanceof Error ? error.message : '이미지 업로드에 실패했습니다.');
    } finally {
      setIsUploading(false);
    }
  }

  async function handleRemoveImage() {
    if (!formData.image_url) return;

    // Try to delete from storage if it's a new upload (not from editing)
    const path = extractPathFromUrl(formData.image_url, 'courses');
    if (path) {
      try {
        await deleteImage('courses', path);
      } catch (error) {
        console.warn('Failed to delete image from storage:', error);
      }
    }

    setFormData((prev) => ({ ...prev, image_url: '' }));
  }

  async function handleSave() {
    if (!validateForm() || !shopId) return;

    setIsSaving(true);
    try {
      const courseData = {
        shop_id: shopId,
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        image_url: formData.image_url || null,
        price_original: Number(formData.price_original),
        price_discount: formData.price_discount ? Number(formData.price_discount) : null,
        duration: Number(formData.duration),
      };

      if (editingCourse) {
        // If image changed and old image exists, delete old image
        if (editingCourse.image_url && editingCourse.image_url !== formData.image_url) {
          const oldPath = extractPathFromUrl(editingCourse.image_url, 'courses');
          if (oldPath) {
            try {
              await deleteImage('courses', oldPath);
            } catch (error) {
              console.warn('Failed to delete old image:', error);
            }
          }
        }
        await updateCourse(editingCourse.id, courseData);
        toast.success('코스가 수정되었습니다.');
      } else {
        await createCourse(courseData);
        toast.success('코스가 추가되었습니다.');
      }

      setIsDialogOpen(false);
      await loadCourses(shopId);
    } catch (error) {
      toast.error(editingCourse ? '코스 수정에 실패했습니다.' : '코스 추가에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!deletingCourseId || !shopId) return;

    setIsDeleting(true);
    try {
      // Find the course to get its image URL
      const courseToDelete = courses.find((c) => c.id === deletingCourseId);
      if (courseToDelete?.image_url) {
        const path = extractPathFromUrl(courseToDelete.image_url, 'courses');
        if (path) {
          try {
            await deleteImage('courses', path);
          } catch (error) {
            console.warn('Failed to delete course image:', error);
          }
        }
      }

      await deleteCourse(deletingCourseId);
      toast.success('코스가 삭제되었습니다.');
      setIsDeleteDialogOpen(false);
      setDeletingCourseId(null);
      await loadCourses(shopId);
    } catch (error) {
      toast.error('코스 삭제에 실패했습니다.');
    } finally {
      setIsDeleting(false);
    }
  }

  function formatPrice(price: number): string {
    return price.toLocaleString('ko-KR') + '원';
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-28" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">코스 관리</h1>
          <p className="mt-1 text-sm text-gray-500">
            총 {courses.length}개의 코스가 등록되어 있습니다.
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" />
          새 코스
        </Button>
      </div>

      {/* Course List */}
      {courses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Tag className="h-12 w-12 text-gray-300" />
            <p className="mt-4 text-lg font-medium text-gray-500">
              등록된 코스가 없습니다
            </p>
            <p className="mt-1 text-sm text-gray-400">
              새 코스를 추가하여 시작해보세요.
            </p>
            <Button className="mt-6" onClick={handleOpenCreate}>
              <Plus className="mr-2 h-4 w-4" />
              첫 코스 추가하기
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Card key={course.id} className="relative overflow-hidden">
              {/* Course Image */}
              {course.image_url && (
                <div className="relative h-40 w-full">
                  <Image
                    src={course.image_url}
                    alt={course.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
              )}
              <CardContent className={course.image_url ? 'p-5' : 'p-5'}>
                {/* Course Name */}
                <h3 className="text-lg font-semibold text-gray-900">
                  {course.name}
                </h3>

                {/* Description */}
                {course.description && (
                  <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                    {course.description}
                  </p>
                )}

                {/* Duration */}
                <div className="mt-2 flex items-center text-sm text-gray-500">
                  <Clock className="mr-1.5 h-4 w-4" />
                  {course.duration}분
                </div>

                {/* Price */}
                <div className="mt-3">
                  {course.price_discount != null && course.price_discount < course.price_original ? (
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-bold text-blue-600">
                        {formatPrice(course.price_discount)}
                      </span>
                      <span className="text-sm text-gray-400 line-through">
                        {formatPrice(course.price_original)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-lg font-bold text-gray-900">
                      {formatPrice(course.price_original)}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEdit(course)}
                  >
                    <Pencil className="mr-1.5 h-3.5 w-3.5" />
                    수정
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => handleOpenDelete(course.id)}
                  >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                    삭제
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingCourse ? '코스 수정' : '새 코스 추가'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Course Image Upload */}
            <div className="space-y-2">
              <Label>코스 이미지</Label>
              {formData.image_url ? (
                <div className="relative h-40 w-full overflow-hidden rounded-lg border">
                  <Image
                    src={formData.image_url}
                    alt="코스 이미지 미리보기"
                    fill
                    className="object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute right-2 top-2 h-8 w-8"
                    onClick={handleRemoveImage}
                    disabled={isUploading}
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">이미지 삭제</span>
                  </Button>
                </div>
              ) : (
                <div
                  className="flex h-40 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 transition-colors hover:border-gray-400 hover:bg-gray-100"
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      fileInputRef.current?.click();
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label="이미지 업로드"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                      <p className="mt-2 text-sm text-gray-500">업로드 중...</p>
                    </>
                  ) : (
                    <>
                      <ImagePlus className="h-8 w-8 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-500">
                        클릭하여 이미지 업로드
                      </p>
                      <p className="text-xs text-gray-400">
                        JPG, PNG, WebP (최대 5MB)
                      </p>
                    </>
                  )}
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleImageUpload}
                disabled={isUploading}
              />
            </div>

            {/* Course Name */}
            <div className="space-y-2">
              <Label htmlFor="course-name">
                코스명 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="course-name"
                placeholder="예: 전신 마사지 60분"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                aria-invalid={!!formErrors.name}
                aria-describedby={formErrors.name ? 'name-error' : undefined}
              />
              {formErrors.name && (
                <p id="name-error" className="text-sm text-red-500" role="alert">
                  {formErrors.name}
                </p>
              )}
            </div>

            {/* Course Description */}
            <div className="space-y-2">
              <Label htmlFor="course-description">
                코스 설명
                <span className="ml-2 text-xs text-gray-400">
                  ({formData.description.length}/{MAX_DESCRIPTION_LENGTH}자)
                </span>
              </Label>
              <Textarea
                id="course-description"
                placeholder="코스에 대한 상세 설명을 입력하세요."
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                rows={3}
                maxLength={MAX_DESCRIPTION_LENGTH}
                aria-invalid={!!formErrors.description}
                aria-describedby={formErrors.description ? 'description-error' : undefined}
              />
              {formErrors.description && (
                <p id="description-error" className="text-sm text-red-500" role="alert">
                  {formErrors.description}
                </p>
              )}
            </div>

            {/* Original Price */}
            <div className="space-y-2">
              <Label htmlFor="course-price-original">
                정가 (원) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="course-price-original"
                type="number"
                min="0"
                placeholder="예: 50000"
                value={formData.price_original}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, price_original: e.target.value }))
                }
                aria-invalid={!!formErrors.price_original}
                aria-describedby={formErrors.price_original ? 'price-original-error' : undefined}
              />
              {formErrors.price_original && (
                <p id="price-original-error" className="text-sm text-red-500" role="alert">
                  {formErrors.price_original}
                </p>
              )}
            </div>

            {/* Discount Price */}
            <div className="space-y-2">
              <Label htmlFor="course-price-discount">할인가 (원)</Label>
              <Input
                id="course-price-discount"
                type="number"
                min="0"
                placeholder="할인 없으면 비워두세요"
                value={formData.price_discount}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, price_discount: e.target.value }))
                }
                aria-invalid={!!formErrors.price_discount}
                aria-describedby={formErrors.price_discount ? 'price-discount-error' : undefined}
              />
              {formErrors.price_discount && (
                <p id="price-discount-error" className="text-sm text-red-500" role="alert">
                  {formErrors.price_discount}
                </p>
              )}
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label htmlFor="course-duration">
                소요시간 (분) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="course-duration"
                type="number"
                min="15"
                step="5"
                placeholder="예: 60"
                value={formData.duration}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, duration: e.target.value }))
                }
                aria-invalid={!!formErrors.duration}
                aria-describedby={formErrors.duration ? 'duration-error' : undefined}
              />
              {formErrors.duration && (
                <p id="duration-error" className="text-sm text-red-500" role="alert">
                  {formErrors.duration}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose asChild>
              <Button variant="outline" disabled={isSaving || isUploading}>
                취소
              </Button>
            </DialogClose>
            <Button onClick={handleSave} disabled={isSaving || isUploading}>
              {isSaving ? '저장 중...' : editingCourse ? '수정' : '추가'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>코스를 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              이 작업은 되돌릴 수 없습니다. 해당 코스와 관련된 예약이 있을 수 있으니
              주의해주세요.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? '삭제 중...' : '삭제'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

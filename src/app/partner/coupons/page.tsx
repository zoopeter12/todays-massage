'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Ticket,
  Plus,
  Edit2,
  Trash2,
  Clock,
  Users,
  TrendingUp,
  Power,
  PowerOff,
  Copy,
  Share2,
  Link2,
  QrCode,
} from 'lucide-react';
import QRCode from 'qrcode';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  fetchPartnerCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} from '@/lib/api/coupons';
import { Coupon, CouponFormData } from '@/types/coupons';
import { getPartnerShop } from '@/lib/api/partner';
import { toast } from 'sonner';

export default function PartnerCouponsPage() {
  const queryClient = useQueryClient();
  const [shopId, setShopId] = useState<string | null>(null);
  const [noShop, setNoShop] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [deletingCoupon, setDeletingCoupon] = useState<Coupon | null>(null);

  useEffect(() => {
    const checkPartner = async () => {
      try {
        const shop = await getPartnerShop();
        if (shop) {
          setShopId(shop.id);
        } else {
          setNoShop(true);
        }
      } catch (error) {
        console.error('Failed to get partner shop:', error);
        setNoShop(true);
      } finally {
        setIsInitializing(false);
      }
    };
    checkPartner();
  }, []);

  // Fetch coupons
  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ['partner-coupons', shopId],
    queryFn: () => (shopId ? fetchPartnerCoupons(shopId) : Promise.resolve([])),
    enabled: !!shopId,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CouponFormData) => {
      if (!shopId) {
        return Promise.reject(new Error('Shop ID not found'));
      }
      return createCoupon(shopId, data);
    },
    onSuccess: () => {
      toast.success('쿠폰이 생성되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['partner-coupons', shopId] });
      setCreateDialogOpen(false);
    },
    onError: () => {
      toast.error('쿠폰 생성에 실패했습니다.');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CouponFormData> & { is_active?: boolean };
    }) => updateCoupon(id, data),
    onSuccess: () => {
      toast.success('쿠폰이 수정되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['partner-coupons', shopId] });
      setEditingCoupon(null);
    },
    onError: () => {
      toast.error('쿠폰 수정에 실패했습니다.');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteCoupon,
    onSuccess: () => {
      toast.success('쿠폰이 삭제되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['partner-coupons', shopId] });
      setDeletingCoupon(null);
    },
    onError: () => {
      toast.error('쿠폰 삭제에 실패했습니다.');
    },
  });

  const handleToggleActive = (coupon: Coupon) => {
    updateMutation.mutate({
      id: coupon.id,
      data: { is_active: !coupon.is_active },
    });
  };

  const activeCoupons = coupons.filter((c) => c.is_active);
  const inactiveCoupons = coupons.filter((c) => !c.is_active);

  // Show loading state
  if (isInitializing || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12 text-muted-foreground">
          로딩 중...
        </div>
      </div>
    );
  }

  // Show message if partner has no registered shop
  if (noShop || !shopId) {
    return (
      <div className="flex items-center justify-center py-20">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-yellow-50">
                <Ticket className="h-8 w-8 text-yellow-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">등록된 가게가 없습니다</h2>
              <p className="text-sm text-gray-500">
                쿠폰 관리를 이용하려면 먼저 가게를 등록해주세요.
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
    <div className="container mx-auto px-4 py-8 pb-24">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">쿠폰 관리</h1>
          <p className="text-muted-foreground">
            고객에게 제공할 쿠폰을 생성하고 관리하세요
          </p>
        </div>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              쿠폰 생성
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <CouponForm
              onSubmit={(data) => createMutation.mutate(data)}
              onCancel={() => setCreateDialogOpen(false)}
              isLoading={createMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active" className="gap-2">
            활성 쿠폰
            {activeCoupons.length > 0 && (
              <Badge variant="secondary">{activeCoupons.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="inactive">비활성 쿠폰</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
          <CouponGrid
            coupons={activeCoupons}
            onEdit={setEditingCoupon}
            onDelete={setDeletingCoupon}
            onToggleActive={handleToggleActive}
            emptyMessage="활성화된 쿠폰이 없습니다"
          />
        </TabsContent>

        <TabsContent value="inactive" className="mt-6">
          <CouponGrid
            coupons={inactiveCoupons}
            onEdit={setEditingCoupon}
            onDelete={setDeletingCoupon}
            onToggleActive={handleToggleActive}
            emptyMessage="비활성화된 쿠폰이 없습니다"
          />
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      {editingCoupon && (
        <Dialog
          open={!!editingCoupon}
          onOpenChange={() => setEditingCoupon(null)}
        >
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <CouponForm
              initialData={editingCoupon}
              onSubmit={(data) =>
                updateMutation.mutate({ id: editingCoupon.id, data })
              }
              onCancel={() => setEditingCoupon(null)}
              isLoading={updateMutation.isPending}
              isEdit
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation */}
      {deletingCoupon && (
        <AlertDialog
          open={!!deletingCoupon}
          onOpenChange={() => setDeletingCoupon(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>쿠폰 삭제</AlertDialogTitle>
              <AlertDialogDescription>
                &ldquo;{deletingCoupon.name}&rdquo; 쿠폰을 삭제하시겠습니까?
                <br />
                이미 다운로드한 사용자의 쿠폰은 유지됩니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteMutation.mutate(deletingCoupon.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                삭제
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

interface CouponGridProps {
  coupons: Coupon[];
  onEdit: (coupon: Coupon) => void;
  onDelete: (coupon: Coupon) => void;
  onToggleActive: (coupon: Coupon) => void;
  emptyMessage: string;
}

function CouponGrid({
  coupons,
  onEdit,
  onDelete,
  onToggleActive,
  emptyMessage,
}: CouponGridProps) {
  if (coupons.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Ticket className="h-16 w-16 mx-auto mb-4 opacity-50" />
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {coupons.map((coupon) => (
        <CouponCard
          key={coupon.id}
          coupon={coupon}
          onEdit={() => onEdit(coupon)}
          onDelete={() => onDelete(coupon)}
          onToggleActive={() => onToggleActive(coupon)}
        />
      ))}
    </div>
  );
}

interface CouponCardProps {
  coupon: Coupon;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
}

function CouponCard({
  coupon,
  onEdit,
  onDelete,
  onToggleActive,
}: CouponCardProps) {
  const [sharePopoverOpen, setSharePopoverOpen] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);

  const discountDisplay =
    coupon.discount_type === 'percent'
      ? `${coupon.discount_value}%`
      : `${coupon.discount_value.toLocaleString()}원`;

  const usagePercent =
    coupon.usage_limit !== null
      ? (coupon.used_count / coupon.usage_limit) * 100
      : 0;

  // Generate coupon URL for sharing
  const getCouponUrl = useCallback(() => {
    if (typeof window === 'undefined') return '';
    const baseUrl = window.location.origin;
    return `${baseUrl}/coupons/${coupon.id}`;
  }, [coupon.id]);

  // Copy coupon code to clipboard
  const handleCopyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(coupon.id);
      toast.success('쿠폰 코드가 복사되었습니다');
    } catch {
      toast.error('복사에 실패했습니다');
    }
  }, [coupon.id]);

  // Copy coupon link to clipboard
  const handleCopyLink = useCallback(async () => {
    try {
      const url = getCouponUrl();
      await navigator.clipboard.writeText(url);
      toast.success('쿠폰 링크가 복사되었습니다');
      setSharePopoverOpen(false);
    } catch {
      toast.error('링크 복사에 실패했습니다');
    }
  }, [getCouponUrl]);

  // Generate QR code
  const handleShowQrCode = useCallback(async () => {
    if (qrCodeDataUrl) return; // Already generated
    setIsGeneratingQr(true);
    try {
      const url = getCouponUrl();
      const dataUrl = await QRCode.toDataURL(url, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });
      setQrCodeDataUrl(dataUrl);
    } catch {
      toast.error('QR 코드 생성에 실패했습니다');
    } finally {
      setIsGeneratingQr(false);
    }
  }, [getCouponUrl, qrCodeDataUrl]);

  // Reset QR code when popover closes
  useEffect(() => {
    if (!sharePopoverOpen) {
      setQrCodeDataUrl(null);
    }
  }, [sharePopoverOpen]);

  return (
    <Card className="p-4 relative overflow-hidden border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
      {/* Decorative circles */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-background -ml-3" />
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-background -mr-3" />

      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Ticket className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg">{coupon.name}</h3>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-primary">
                {discountDisplay}
              </span>
              <span className="text-sm text-muted-foreground">할인</span>
            </div>
          </div>

          <Badge variant={coupon.is_active ? 'default' : 'secondary'}>
            {coupon.is_active ? '활성' : '비활성'}
          </Badge>
        </div>

        {/* Details */}
        <div className="space-y-2 text-sm text-muted-foreground">
          {coupon.min_price > 0 && (
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span>{coupon.min_price.toLocaleString()}원 이상</span>
            </div>
          )}

          {coupon.discount_type === 'percent' && coupon.max_discount && (
            <p>최대 {coupon.max_discount.toLocaleString()}원 할인</p>
          )}

          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>
              {format(new Date(coupon.valid_until), 'yyyy.MM.dd까지', {
                locale: ko,
              })}
            </span>
          </div>

          {coupon.usage_limit !== null && (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>
                  {coupon.used_count} / {coupon.usage_limit} 사용
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(usagePercent, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onToggleActive}
            className="flex-1 gap-2"
          >
            {coupon.is_active ? (
              <>
                <PowerOff className="h-4 w-4" />
                비활성화
              </>
            ) : (
              <>
                <Power className="h-4 w-4" />
                활성화
              </>
            )}
          </Button>

          {/* Copy Code Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopyCode}
            title="쿠폰 코드 복사"
          >
            <Copy className="h-4 w-4" />
          </Button>

          {/* Share Popover */}
          <Popover open={sharePopoverOpen} onOpenChange={setSharePopoverOpen}>
            <PopoverTrigger asChild>
              <Button size="sm" variant="outline" title="공유">
                <Share2 className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64" align="end">
              <div className="space-y-3">
                <h4 className="font-medium text-sm">쿠폰 공유</h4>

                {/* Copy Link Button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2"
                  onClick={handleCopyLink}
                >
                  <Link2 className="h-4 w-4" />
                  링크 복사
                </Button>

                {/* QR Code Section */}
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start gap-2"
                    onClick={handleShowQrCode}
                    disabled={isGeneratingQr}
                  >
                    <QrCode className="h-4 w-4" />
                    {isGeneratingQr ? 'QR 생성 중...' : 'QR 코드 표시'}
                  </Button>

                  {qrCodeDataUrl && (
                    <div className="flex flex-col items-center gap-2 p-3 bg-white rounded-lg border">
                      <img
                        src={qrCodeDataUrl}
                        alt="쿠폰 QR 코드"
                        className="w-[160px] h-[160px]"
                      />
                      <p className="text-xs text-muted-foreground text-center">
                        QR 코드를 스캔하여 쿠폰 받기
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Button size="sm" variant="outline" onClick={onEdit}>
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onDelete}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

interface CouponFormProps {
  initialData?: Coupon;
  onSubmit: (data: CouponFormData) => void;
  onCancel: () => void;
  isLoading: boolean;
  isEdit?: boolean;
}

function CouponForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading,
  isEdit,
}: CouponFormProps) {
  const [formData, setFormData] = useState<CouponFormData>({
    name: initialData?.name || '',
    discount_type: initialData?.discount_type || 'percent',
    discount_value: initialData?.discount_value || 0,
    min_price: initialData?.min_price || 0,
    max_discount: initialData?.max_discount || null,
    usage_limit: initialData?.usage_limit || null,
    valid_from:
      initialData?.valid_from ||
      new Date().toISOString().split('T')[0],
    valid_until:
      initialData?.valid_until ||
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>{isEdit ? '쿠폰 수정' : '쿠폰 생성'}</DialogTitle>
        <DialogDescription>
          고객에게 제공할 쿠폰 정보를 입력하세요
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        {/* Coupon name */}
        <div className="space-y-2">
          <Label htmlFor="name">쿠폰 이름 *</Label>
          <Input
            id="name"
            placeholder="예: 신규 회원 환영 쿠폰"
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            required
          />
        </div>

        {/* Discount type */}
        <div className="space-y-2">
          <Label htmlFor="discount_type">할인 유형 *</Label>
          <Select
            value={formData.discount_type}
            onValueChange={(value: 'percent' | 'fixed') =>
              setFormData({ ...formData, discount_type: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percent">퍼센트 할인</SelectItem>
              <SelectItem value="fixed">정액 할인</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Discount value */}
        <div className="space-y-2">
          <Label htmlFor="discount_value">
            할인 값 * ({formData.discount_type === 'percent' ? '%' : '원'})
          </Label>
          <Input
            id="discount_value"
            type="number"
            placeholder={formData.discount_type === 'percent' ? '10' : '5000'}
            value={formData.discount_value || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                discount_value: Number(e.target.value),
              })
            }
            required
            min="0"
          />
        </div>

        {/* Max discount (for percent type) */}
        {formData.discount_type === 'percent' && (
          <div className="space-y-2">
            <Label htmlFor="max_discount">최대 할인 금액 (원)</Label>
            <Input
              id="max_discount"
              type="number"
              placeholder="10000 (선택사항)"
              value={formData.max_discount || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  max_discount: e.target.value ? Number(e.target.value) : null,
                })
              }
              min="0"
            />
          </div>
        )}

        {/* Min price */}
        <div className="space-y-2">
          <Label htmlFor="min_price">최소 결제 금액 (원)</Label>
          <Input
            id="min_price"
            type="number"
            placeholder="0"
            value={formData.min_price || ''}
            onChange={(e) =>
              setFormData({ ...formData, min_price: Number(e.target.value) })
            }
            min="0"
          />
        </div>

        {/* Usage limit */}
        <div className="space-y-2">
          <Label htmlFor="usage_limit">발급 수량 제한</Label>
          <Input
            id="usage_limit"
            type="number"
            placeholder="무제한 (선택사항)"
            value={formData.usage_limit || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                usage_limit: e.target.value ? Number(e.target.value) : null,
              })
            }
            min="1"
          />
        </div>

        {/* Valid from */}
        <div className="space-y-2">
          <Label htmlFor="valid_from">시작일 *</Label>
          <Input
            id="valid_from"
            type="date"
            value={formData.valid_from}
            onChange={(e) =>
              setFormData({ ...formData, valid_from: e.target.value })
            }
            required
          />
        </div>

        {/* Valid until */}
        <div className="space-y-2">
          <Label htmlFor="valid_until">만료일 *</Label>
          <Input
            id="valid_until"
            type="date"
            value={formData.valid_until}
            onChange={(e) =>
              setFormData({ ...formData, valid_until: e.target.value })
            }
            required
          />
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          취소
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? '처리 중...' : isEdit ? '수정' : '생성'}
        </Button>
      </DialogFooter>
    </form>
  );
}

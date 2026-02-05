'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  HelpCircle,
  Image,
  MessageSquare,
  Plus,
  Edit,
  Trash2,
  Eye,
  Pin,
  Calendar,
  Upload,
  X,
  Loader2,
  Link as LinkIcon,
  GripVertical,
} from 'lucide-react';
import { PaginationControls, usePagination } from '@/components/admin/pagination-controls';
import type { Notice, FAQ, Banner } from '@/types/admin';
import {
  getNotices,
  createNotice,
  updateNotice,
  deleteNotice,
  getFaqs,
  createFaq,
  updateFaq,
  deleteFaq,
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  reorderFaqs,
  reorderBanners,
} from '@/lib/api/content';
import { useImageUpload } from '@/hooks/useImageUpload';
import { cn } from '@/lib/utils';

// @dnd-kit imports
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

type ContentTab = 'notices' | 'faqs' | 'banners';

// Sortable FAQ Row Component
function SortableFaqRow({
  faq,
  getCategoryBadge,
  onEdit,
  onDelete,
}: {
  faq: FAQ;
  getCategoryBadge: (category: string) => JSX.Element;
  onEdit: (faq: FAQ) => void;
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: faq.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow ref={setNodeRef} style={style} className={isDragging ? 'bg-violet-50' : ''}>
      <TableCell className="w-10">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded touch-none"
          aria-label="드래그하여 순서 변경"
        >
          <GripVertical className="h-4 w-4 text-gray-400" />
        </button>
      </TableCell>
      <TableCell className="font-medium max-w-md truncate">{faq.question}</TableCell>
      <TableCell>{getCategoryBadge(faq.category)}</TableCell>
      <TableCell>{faq.order}</TableCell>
      <TableCell>
        <Badge variant={faq.is_published ? 'default' : 'secondary'}>
          {faq.is_published ? '게시중' : '미게시'}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(faq)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-600 hover:text-red-700"
            onClick={() => onDelete(faq.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

// Sortable Banner Row Component
function SortableBannerRow({
  banner,
  onEdit,
  onDelete,
}: {
  banner: Banner;
  onEdit: (banner: Banner) => void;
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: banner.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow ref={setNodeRef} style={style} className={isDragging ? 'bg-blue-50' : ''}>
      <TableCell className="w-10">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded touch-none"
          aria-label="드래그하여 순서 변경"
        >
          <GripVertical className="h-4 w-4 text-gray-400" />
        </button>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="w-20 h-12 rounded bg-gray-100 overflow-hidden">
            {banner.image_url ? (
              <img src={banner.image_url} alt={banner.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Image className="h-4 w-4 text-gray-400" />
              </div>
            )}
          </div>
          <span className="font-medium">{banner.title}</span>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline">
          {banner.position === 'main' ? '메인' : banner.position === 'search' ? '검색' : '상세'}
        </Badge>
      </TableCell>
      <TableCell className="text-sm">
        {banner.start_date} ~ {banner.end_date}
      </TableCell>
      <TableCell>{banner.click_count.toLocaleString()}</TableCell>
      <TableCell>
        <Badge variant={banner.is_active ? 'default' : 'secondary'}>
          {banner.is_active ? '활성' : '비활성'}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(banner)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-600 hover:text-red-700"
            onClick={() => onDelete(banner.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export default function AdminContentPage() {
  const [activeTab, setActiveTab] = useState<ContentTab>('notices');
  const [notices, setNotices] = useState<Notice[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [reordering, setReordering] = useState(false);

  // Drag state for overlay
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  // Pagination states for each content type
  const noticesPagination = usePagination(10);
  const faqsPagination = usePagination(10);
  const bannersPagination = usePagination(10);

  // Dialog states
  const [isNoticeDialogOpen, setIsNoticeDialogOpen] = useState(false);
  const [isFaqDialogOpen, setIsFaqDialogOpen] = useState(false);
  const [isBannerDialogOpen, setIsBannerDialogOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);

  // Form states
  const [noticeForm, setNoticeForm] = useState({
    title: '',
    content: '',
    category: 'general' as Notice['category'],
    is_pinned: false,
    is_published: true,
  });
  const [faqForm, setFaqForm] = useState({
    question: '',
    answer: '',
    category: 'general' as FAQ['category'],
    is_published: true,
  });
  const [bannerForm, setBannerForm] = useState({
    title: '',
    image_url: '',
    link_url: '',
    position: 'main' as Banner['position'],
    is_active: true,
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  // Banner image upload states
  const [bannerImageMode, setBannerImageMode] = useState<'upload' | 'url'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const bannerFileInputRef = useRef<HTMLInputElement>(null);

  const bannerImageUpload = useImageUpload({
    bucket: 'banners',
    maxImages: 1,
    onUploadComplete: (results) => {
      if (results.length > 0) {
        setBannerForm(prev => ({ ...prev, image_url: results[0].url }));
      }
    },
    onError: (error) => {
      console.error('Banner image upload error:', error);
    },
  });

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchContent();
  }, []);

  async function fetchContent() {
    setLoading(true);
    setError(null);
    try {
      const [noticesData, faqsData, bannersData] = await Promise.all([
        getNotices(),
        getFaqs(),
        getBanners(),
      ]);

      setNotices(noticesData);
      setFaqs(faqsData);
      setBanners(bannersData);
    } catch (err) {
      console.error('Failed to fetch content:', err);
      setError('콘텐츠를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  function getCategoryBadge(category: string) {
    const categoryMap: Record<string, { label: string; className: string }> = {
      general: { label: '일반', className: 'bg-gray-100 text-gray-800' },
      event: { label: '이벤트', className: 'bg-violet-100 text-violet-800' },
      maintenance: { label: '점검', className: 'bg-amber-100 text-amber-800' },
      policy: { label: '정책', className: 'bg-blue-100 text-blue-800' },
      reservation: { label: '예약', className: 'bg-green-100 text-green-800' },
      payment: { label: '결제', className: 'bg-pink-100 text-pink-800' },
      account: { label: '계정', className: 'bg-indigo-100 text-indigo-800' },
      partner: { label: '파트너', className: 'bg-orange-100 text-orange-800' },
    };
    const config = categoryMap[category] || { label: category, className: 'bg-gray-100 text-gray-800' };
    return <Badge className={config.className}>{config.label}</Badge>;
  }

  // FAQ Drag handlers
  function handleFaqDragStart(event: DragStartEvent) {
    setActiveDragId(event.active.id as string);
  }

  async function handleFaqDragEnd(event: DragEndEvent) {
    setActiveDragId(null);
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = faqs.findIndex((f) => f.id === active.id);
      const newIndex = faqs.findIndex((f) => f.id === over.id);

      const newFaqs = arrayMove(faqs, oldIndex, newIndex);
      setFaqs(newFaqs);

      // Save to server
      setReordering(true);
      try {
        await reorderFaqs(newFaqs.map((f) => f.id));
        // Refresh to get updated order numbers
        await fetchContent();
      } catch (err) {
        console.error('Failed to reorder FAQs:', err);
        alert('순서 변경에 실패했습니다.');
        // Revert on error
        await fetchContent();
      } finally {
        setReordering(false);
      }
    }
  }

  // Banner Drag handlers
  function handleBannerDragStart(event: DragStartEvent) {
    setActiveDragId(event.active.id as string);
  }

  async function handleBannerDragEnd(event: DragEndEvent) {
    setActiveDragId(null);
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = banners.findIndex((b) => b.id === active.id);
      const newIndex = banners.findIndex((b) => b.id === over.id);

      const newBanners = arrayMove(banners, oldIndex, newIndex);
      setBanners(newBanners);

      // Save to server
      setReordering(true);
      try {
        await reorderBanners(newBanners.map((b) => b.id));
        // Refresh to get updated order numbers
        await fetchContent();
      } catch (err) {
        console.error('Failed to reorder banners:', err);
        alert('순서 변경에 실패했습니다.');
        // Revert on error
        await fetchContent();
      } finally {
        setReordering(false);
      }
    }
  }

  // Edit handlers for FAQ
  function handleEditFaq(faq: FAQ) {
    setEditingFaq(faq);
    setFaqForm({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      is_published: faq.is_published,
    });
    setIsFaqDialogOpen(true);
  }

  // Edit handlers for Banner
  function handleEditBanner(banner: Banner) {
    setEditingBanner(banner);
    setBannerForm({
      title: banner.title,
      image_url: banner.image_url,
      link_url: banner.link_url || '',
      position: banner.position,
      is_active: banner.is_active,
      start_date: banner.start_date,
      end_date: banner.end_date,
    });
    setIsBannerDialogOpen(true);
  }

  async function handleSaveNotice() {
    if (!noticeForm.title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }
    if (!noticeForm.content.trim()) {
      alert('내용을 입력해주세요.');
      return;
    }

    setSaving(true);
    try {
      if (editingNotice) {
        await updateNotice(editingNotice.id, noticeForm);
        alert('공지사항이 수정되었습니다.');
      } else {
        await createNotice({
          ...noticeForm,
          published_at: noticeForm.is_published ? new Date().toISOString() : null,
          created_by: '', // Will be set by API
        });
        alert('공지사항이 등록되었습니다.');
      }

      setIsNoticeDialogOpen(false);
      setEditingNotice(null);
      setNoticeForm({ title: '', content: '', category: 'general', is_pinned: false, is_published: true });
      await fetchContent();
    } catch (err) {
      console.error('Failed to save notice:', err);
      alert('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveFaq() {
    if (!faqForm.question.trim()) {
      alert('질문을 입력해주세요.');
      return;
    }
    if (!faqForm.answer.trim()) {
      alert('답변을 입력해주세요.');
      return;
    }

    setSaving(true);
    try {
      if (editingFaq) {
        await updateFaq(editingFaq.id, faqForm);
        alert('FAQ가 수정되었습니다.');
      } else {
        await createFaq({
          ...faqForm,
          order: 0, // Will be auto-incremented by API
        });
        alert('FAQ가 등록되었습니다.');
      }

      setIsFaqDialogOpen(false);
      setEditingFaq(null);
      setFaqForm({ question: '', answer: '', category: 'general', is_published: true });
      await fetchContent();
    } catch (err) {
      console.error('Failed to save FAQ:', err);
      alert('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveBanner() {
    if (!bannerForm.title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }
    if (!bannerForm.image_url.trim()) {
      alert('이미지 URL을 입력해주세요.');
      return;
    }
    if (new Date(bannerForm.start_date) > new Date(bannerForm.end_date)) {
      alert('종료일은 시작일 이후여야 합니다.');
      return;
    }

    setSaving(true);
    try {
      if (editingBanner) {
        await updateBanner(editingBanner.id, bannerForm);
        alert('배너가 수정되었습니다.');
      } else {
        await createBanner({
          ...bannerForm,
          order: 0, // Will be auto-incremented by API
        });
        alert('배너가 등록되었습니다.');
      }

      setIsBannerDialogOpen(false);
      setEditingBanner(null);
      setBannerForm({
        title: '',
        image_url: '',
        link_url: '',
        position: 'main',
        is_active: true,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });
      bannerImageUpload.reset();
      setBannerImageMode('upload');
      await fetchContent();
    } catch (err) {
      console.error('Failed to save banner:', err);
      alert('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(type: 'notice' | 'faq' | 'banner', id: string) {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      if (type === 'notice') {
        await deleteNotice(id);
      } else if (type === 'faq') {
        await deleteFaq(id);
      } else if (type === 'banner') {
        await deleteBanner(id);
      }

      alert('삭제되었습니다.');
      await fetchContent();
    } catch (err) {
      console.error('Failed to delete:', err);
      alert('삭제에 실패했습니다.');
    }
  }

  // Banner image upload handlers
  const handleBannerImageDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleBannerImageDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleBannerImageDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      const result = await bannerImageUpload.upload(file);
      if (result) {
        setBannerForm(prev => ({ ...prev, image_url: result.url }));
      }
    }
  }, [bannerImageUpload]);

  const handleBannerFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const result = await bannerImageUpload.upload(file);
      if (result) {
        setBannerForm(prev => ({ ...prev, image_url: result.url }));
      }
    }
    e.target.value = '';
  }, [bannerImageUpload]);

  const handleRemoveBannerImage = useCallback(() => {
    setBannerForm(prev => ({ ...prev, image_url: '' }));
    bannerImageUpload.clear();
  }, [bannerImageUpload]);

  // Pagination calculations for notices
  const noticesTotal = notices.length;
  const noticesTotalPages = Math.ceil(noticesTotal / noticesPagination.pageSize);
  const noticesStartIndex = (noticesPagination.currentPage - 1) * noticesPagination.pageSize;
  const paginatedNotices = notices.slice(noticesStartIndex, noticesStartIndex + noticesPagination.pageSize);

  // Pagination calculations for FAQs
  const faqsTotal = faqs.length;
  const faqsTotalPages = Math.ceil(faqsTotal / faqsPagination.pageSize);
  const faqsStartIndex = (faqsPagination.currentPage - 1) * faqsPagination.pageSize;
  const paginatedFaqs = faqs.slice(faqsStartIndex, faqsStartIndex + faqsPagination.pageSize);

  // Pagination calculations for banners
  const bannersTotal = banners.length;
  const bannersTotalPages = Math.ceil(bannersTotal / bannersPagination.pageSize);
  const bannersStartIndex = (bannersPagination.currentPage - 1) * bannersPagination.pageSize;
  const paginatedBanners = banners.slice(bannersStartIndex, bannersStartIndex + bannersPagination.pageSize);

  // Get active drag item for overlay
  const activeFaq = activeDragId ? faqs.find((f) => f.id === activeDragId) : null;
  const activeBanner = activeDragId ? banners.find((b) => b.id === activeDragId) : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto mb-4"></div>
          <p className="text-gray-500">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">콘텐츠 관리</h1>
        {reordering && (
          <div className="flex items-center gap-2 text-sm text-violet-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            순서 저장 중...
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-none shadow-md">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-violet-100">
              <FileText className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">공지사항</p>
              <p className="text-xl font-bold text-gray-900">{notices.length}개</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-md">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-pink-100">
              <HelpCircle className="h-5 w-5 text-pink-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">FAQ</p>
              <p className="text-xl font-bold text-gray-900">{faqs.length}개</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-md">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-blue-100">
              <Image className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">배너</p>
              <p className="text-xl font-bold text-gray-900">{banners.length}개</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ContentTab)}>
        <TabsList className="bg-white shadow-sm">
          <TabsTrigger value="notices" className="gap-2">
            <FileText className="h-4 w-4" /> 공지사항
          </TabsTrigger>
          <TabsTrigger value="faqs" className="gap-2">
            <HelpCircle className="h-4 w-4" /> FAQ
          </TabsTrigger>
          <TabsTrigger value="banners" className="gap-2">
            <Image className="h-4 w-4" /> 배너
          </TabsTrigger>
        </TabsList>

        {/* Notices Tab */}
        <TabsContent value="notices" className="mt-4">
          <Card className="border-none shadow-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>공지사항 목록</CardTitle>
              <Button onClick={() => setIsNoticeDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> 새 공지
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>제목</TableHead>
                    <TableHead>카테고리</TableHead>
                    <TableHead>조회수</TableHead>
                    <TableHead>작성일</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead className="text-right">관리</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedNotices.map((notice) => (
                    <TableRow key={notice.id}>
                      <TableCell>
                        {notice.is_pinned && <Pin className="h-4 w-4 text-violet-500" />}
                      </TableCell>
                      <TableCell className="font-medium">{notice.title}</TableCell>
                      <TableCell>{getCategoryBadge(notice.category)}</TableCell>
                      <TableCell>{notice.view_count}</TableCell>
                      <TableCell>{new Date(notice.created_at).toLocaleDateString('ko-KR')}</TableCell>
                      <TableCell>
                        <Badge variant={notice.is_published ? 'default' : 'secondary'}>
                          {notice.is_published ? '게시중' : '미게시'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingNotice(notice);
                              setNoticeForm({
                                title: notice.title,
                                content: notice.content,
                                category: notice.category,
                                is_pinned: notice.is_pinned,
                                is_published: notice.is_published,
                              });
                              setIsNoticeDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDelete('notice', notice.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <PaginationControls
                currentPage={noticesPagination.currentPage}
                totalPages={noticesTotalPages}
                totalItems={noticesTotal}
                pageSize={noticesPagination.pageSize}
                onPageChange={noticesPagination.handlePageChange}
                onPageSizeChange={noticesPagination.handlePageSizeChange}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* FAQ Tab with Drag and Drop */}
        <TabsContent value="faqs" className="mt-4">
          <Card className="border-none shadow-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>FAQ 목록</CardTitle>
                <p className="text-sm text-gray-500 mt-1">드래그하여 순서를 변경할 수 있습니다</p>
              </div>
              <Button onClick={() => setIsFaqDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> 새 FAQ
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleFaqDragStart}
                onDragEnd={handleFaqDragEnd}
                modifiers={[restrictToVerticalAxis]}
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10"></TableHead>
                      <TableHead>질문</TableHead>
                      <TableHead>카테고리</TableHead>
                      <TableHead>순서</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead className="text-right">관리</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <SortableContext
                      items={paginatedFaqs.map((f) => f.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {paginatedFaqs.map((faq) => (
                        <SortableFaqRow
                          key={faq.id}
                          faq={faq}
                          getCategoryBadge={getCategoryBadge}
                          onEdit={handleEditFaq}
                          onDelete={(id) => handleDelete('faq', id)}
                        />
                      ))}
                    </SortableContext>
                  </TableBody>
                </Table>
                <DragOverlay>
                  {activeFaq ? (
                    <Table>
                      <TableBody>
                        <TableRow className="bg-white shadow-lg border">
                          <TableCell className="w-10">
                            <GripVertical className="h-4 w-4 text-gray-400" />
                          </TableCell>
                          <TableCell className="font-medium max-w-md truncate">{activeFaq.question}</TableCell>
                          <TableCell>{getCategoryBadge(activeFaq.category)}</TableCell>
                          <TableCell>{activeFaq.order}</TableCell>
                          <TableCell>
                            <Badge variant={activeFaq.is_published ? 'default' : 'secondary'}>
                              {activeFaq.is_published ? '게시중' : '미게시'}
                            </Badge>
                          </TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  ) : null}
                </DragOverlay>
              </DndContext>
              <PaginationControls
                currentPage={faqsPagination.currentPage}
                totalPages={faqsTotalPages}
                totalItems={faqsTotal}
                pageSize={faqsPagination.pageSize}
                onPageChange={faqsPagination.handlePageChange}
                onPageSizeChange={faqsPagination.handlePageSizeChange}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Banners Tab with Drag and Drop */}
        <TabsContent value="banners" className="mt-4">
          <Card className="border-none shadow-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>배너 목록</CardTitle>
                <p className="text-sm text-gray-500 mt-1">드래그하여 순서를 변경할 수 있습니다</p>
              </div>
              <Button onClick={() => setIsBannerDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> 새 배너
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleBannerDragStart}
                onDragEnd={handleBannerDragEnd}
                modifiers={[restrictToVerticalAxis]}
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10"></TableHead>
                      <TableHead>배너</TableHead>
                      <TableHead>위치</TableHead>
                      <TableHead>기간</TableHead>
                      <TableHead>클릭수</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead className="text-right">관리</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <SortableContext
                      items={paginatedBanners.map((b) => b.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {paginatedBanners.map((banner) => (
                        <SortableBannerRow
                          key={banner.id}
                          banner={banner}
                          onEdit={handleEditBanner}
                          onDelete={(id) => handleDelete('banner', id)}
                        />
                      ))}
                    </SortableContext>
                  </TableBody>
                </Table>
                <DragOverlay>
                  {activeBanner ? (
                    <Table>
                      <TableBody>
                        <TableRow className="bg-white shadow-lg border">
                          <TableCell className="w-10">
                            <GripVertical className="h-4 w-4 text-gray-400" />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-20 h-12 rounded bg-gray-100 overflow-hidden">
                                {activeBanner.image_url ? (
                                  <img src={activeBanner.image_url} alt={activeBanner.title} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Image className="h-4 w-4 text-gray-400" />
                                  </div>
                                )}
                              </div>
                              <span className="font-medium">{activeBanner.title}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {activeBanner.position === 'main' ? '메인' : activeBanner.position === 'search' ? '검색' : '상세'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {activeBanner.start_date} ~ {activeBanner.end_date}
                          </TableCell>
                          <TableCell>{activeBanner.click_count.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant={activeBanner.is_active ? 'default' : 'secondary'}>
                              {activeBanner.is_active ? '활성' : '비활성'}
                            </Badge>
                          </TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  ) : null}
                </DragOverlay>
              </DndContext>
              <PaginationControls
                currentPage={bannersPagination.currentPage}
                totalPages={bannersTotalPages}
                totalItems={bannersTotal}
                pageSize={bannersPagination.pageSize}
                onPageChange={bannersPagination.handlePageChange}
                onPageSizeChange={bannersPagination.handlePageSizeChange}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Notice Dialog */}
      <Dialog open={isNoticeDialogOpen} onOpenChange={setIsNoticeDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingNotice ? '공지사항 수정' : '새 공지사항'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">제목</label>
              <Input
                value={noticeForm.title}
                onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
                placeholder="공지사항 제목"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">카테고리</label>
              <Select
                value={noticeForm.category}
                onValueChange={(v) => setNoticeForm({ ...noticeForm, category: v as Notice['category'] })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">일반</SelectItem>
                  <SelectItem value="event">이벤트</SelectItem>
                  <SelectItem value="maintenance">점검</SelectItem>
                  <SelectItem value="policy">정책</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">내용</label>
              <Textarea
                value={noticeForm.content}
                onChange={(e) => setNoticeForm({ ...noticeForm, content: e.target.value })}
                placeholder="공지사항 내용을 입력하세요"
                className="mt-1"
                rows={5}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  checked={noticeForm.is_pinned}
                  onCheckedChange={(v) => setNoticeForm({ ...noticeForm, is_pinned: v })}
                />
                <label className="text-sm">상단 고정</label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={noticeForm.is_published}
                  onCheckedChange={(v) => setNoticeForm({ ...noticeForm, is_published: v })}
                />
                <label className="text-sm">게시</label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNoticeDialogOpen(false)} disabled={saving}>취소</Button>
            <Button onClick={handleSaveNotice} disabled={saving}>
              {saving ? '저장 중...' : '저장'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* FAQ Dialog */}
      <Dialog open={isFaqDialogOpen} onOpenChange={setIsFaqDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingFaq ? 'FAQ 수정' : '새 FAQ'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">질문</label>
              <Input
                value={faqForm.question}
                onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
                placeholder="자주 묻는 질문"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">카테고리</label>
              <Select
                value={faqForm.category}
                onValueChange={(v) => setFaqForm({ ...faqForm, category: v as FAQ['category'] })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">일반</SelectItem>
                  <SelectItem value="reservation">예약</SelectItem>
                  <SelectItem value="payment">결제</SelectItem>
                  <SelectItem value="account">계정</SelectItem>
                  <SelectItem value="partner">파트너</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">답변</label>
              <Textarea
                value={faqForm.answer}
                onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
                placeholder="답변 내용을 입력하세요"
                className="mt-1"
                rows={5}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={faqForm.is_published}
                onCheckedChange={(v) => setFaqForm({ ...faqForm, is_published: v })}
              />
              <label className="text-sm">게시</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFaqDialogOpen(false)} disabled={saving}>취소</Button>
            <Button onClick={handleSaveFaq} disabled={saving}>
              {saving ? '저장 중...' : '저장'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Banner Dialog */}
      <Dialog open={isBannerDialogOpen} onOpenChange={setIsBannerDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingBanner ? '배너 수정' : '새 배너'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">제목</label>
              <Input
                value={bannerForm.title}
                onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                placeholder="배너 제목"
                className="mt-1"
              />
            </div>
            {/* Banner Image Upload Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">배너 이미지</label>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant={bannerImageMode === 'upload' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setBannerImageMode('upload')}
                    className="h-7 text-xs"
                  >
                    <Upload className="h-3 w-3 mr-1" />
                    업로드
                  </Button>
                  <Button
                    type="button"
                    variant={bannerImageMode === 'url' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setBannerImageMode('url')}
                    className="h-7 text-xs"
                  >
                    <LinkIcon className="h-3 w-3 mr-1" />
                    URL
                  </Button>
                </div>
              </div>

              {bannerImageMode === 'upload' ? (
                <div className="space-y-3">
                  {/* Image Preview or Drop Zone */}
                  {bannerForm.image_url ? (
                    <div className="relative rounded-lg overflow-hidden border bg-muted">
                      <img
                        src={bannerForm.image_url}
                        alt="배너 미리보기"
                        className="w-full h-40 object-cover"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveBannerImage}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                        aria-label="이미지 삭제"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      className={cn(
                        'relative border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer',
                        isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25',
                        bannerImageUpload.state === 'uploading' && 'opacity-50 cursor-not-allowed',
                        'hover:border-primary/50'
                      )}
                      onDragOver={handleBannerImageDragOver}
                      onDragLeave={handleBannerImageDragLeave}
                      onDrop={handleBannerImageDrop}
                      onClick={() => bannerFileInputRef.current?.click()}
                    >
                      {bannerImageUpload.state === 'uploading' ? (
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <Loader2 className="h-8 w-8 animate-spin" />
                          <span className="text-sm">업로드 중...</span>
                          {bannerImageUpload.progress && (
                            <div className="w-full max-w-xs bg-muted rounded-full h-2 overflow-hidden">
                              <div
                                className="h-full bg-primary transition-all duration-300"
                                style={{ width: `${bannerImageUpload.progress.percentage}%` }}
                              />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <Upload className="h-10 w-10" />
                          <p className="text-sm">이미지를 드래그하거나 클릭하여 업로드</p>
                          <p className="text-xs text-muted-foreground/70">
                            최대 10MB, JPG/PNG/WebP/GIF
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Hidden file input */}
                  <input
                    ref={bannerFileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleBannerFileSelect}
                    className="hidden"
                    disabled={bannerImageUpload.state === 'uploading'}
                  />

                  {/* Upload error */}
                  {bannerImageUpload.error && (
                    <div className="text-sm text-destructive flex items-center gap-2">
                      <X className="h-4 w-4" />
                      {bannerImageUpload.error}
                    </div>
                  )}
                </div>
              ) : (
                <Input
                  value={bannerForm.image_url}
                  onChange={(e) => setBannerForm({ ...bannerForm, image_url: e.target.value })}
                  placeholder="https://example.com/banner.jpg"
                  className="mt-1"
                />
              )}

              {/* URL mode preview */}
              {bannerImageMode === 'url' && bannerForm.image_url && (
                <div className="mt-3 rounded-lg overflow-hidden border bg-muted">
                  <img
                    src={bannerForm.image_url}
                    alt="배너 미리보기"
                    className="w-full h-32 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">링크 URL</label>
              <Input
                value={bannerForm.link_url}
                onChange={(e) => setBannerForm({ ...bannerForm, link_url: e.target.value })}
                placeholder="클릭 시 이동할 URL (선택)"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">위치</label>
              <Select
                value={bannerForm.position}
                onValueChange={(v) => setBannerForm({ ...bannerForm, position: v as Banner['position'] })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="main">메인 페이지</SelectItem>
                  <SelectItem value="search">검색 페이지</SelectItem>
                  <SelectItem value="detail">상세 페이지</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">시작일</label>
                <Input
                  type="date"
                  value={bannerForm.start_date}
                  onChange={(e) => setBannerForm({ ...bannerForm, start_date: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">종료일</label>
                <Input
                  type="date"
                  value={bannerForm.end_date}
                  onChange={(e) => setBannerForm({ ...bannerForm, end_date: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={bannerForm.is_active}
                onCheckedChange={(v) => setBannerForm({ ...bannerForm, is_active: v })}
              />
              <label className="text-sm">활성화</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBannerDialogOpen(false)} disabled={saving}>취소</Button>
            <Button onClick={handleSaveBanner} disabled={saving}>
              {saving ? '저장 중...' : '저장'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

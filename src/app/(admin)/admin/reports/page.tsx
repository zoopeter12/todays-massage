'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  AlertTriangle,
  MessageSquare,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Store,
  FileText,
  Flag,
  Download,
  Paperclip,
  Image as ImageIcon,
  AlertOctagon,
} from 'lucide-react';
import { PaginationControls, usePagination } from '@/components/admin/pagination-controls';
import type { Report, CustomerInquiry } from '@/types/admin';
import type { ReportWithReporter, CustomerInquiryWithUser } from '@/types/database-helpers';
import { supabase } from '@/lib/supabase/client';
import { batchGetTargetNames, getReasonLabel } from '@/lib/admin/reports-helpers';
import { deductCreditOnReport } from '@/lib/api/credit-score';

type ReportTab = 'reports' | 'inquiries';
type ReportStatus = 'all' | 'pending' | 'reviewing' | 'resolved' | 'dismissed';

export default function AdminReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>('reports');
  const [reports, setReports] = useState<Report[]>([]);
  const [inquiries, setInquiries] = useState<CustomerInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReportStatus>('all');

  // Pagination states
  const reportsPagination = usePagination(10);
  const inquiriesPagination = usePagination(10);

  // Dialog states
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [selectedInquiry, setSelectedInquiry] = useState<CustomerInquiry | null>(null);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [isInquiryDialogOpen, setIsInquiryDialogOpen] = useState(false);
  const [resolution, setResolution] = useState('');
  const [response, setResponse] = useState('');
  const [warningMessage, setWarningMessage] = useState('');
  const [selectedAction, setSelectedAction] = useState<'resolved' | 'dismissed' | 'warning'>('resolved');
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  const [stats, setStats] = useState({
    totalReports: 0,
    pendingReports: 0,
    totalInquiries: 0,
    pendingInquiries: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      // Fetch reports with reporter profile information
      const { data: reportsData, error: reportsError } = await supabase
        .from('reports')
        .select(`
          *,
          reporter:profiles!reporter_id(nickname, phone)
        `)
        .order('created_at', { ascending: false });

      if (reportsError) {
        console.error('Failed to fetch reports:', reportsError);
        setReports([]);
      } else {
        // Batch fetch target names for better performance
        const targetNamesMap = await batchGetTargetNames(
          (reportsData || []).map(r => ({
            target_type: r.target_type,
            target_id: r.target_id,
          }))
        );

        // Transform data to match the Report type
        const transformedReports: Report[] = (reportsData || []).map((report) => ({
          id: report.id,
          reporter_id: report.reporter_id,
          reporter_name: report.reporter?.nickname || '알 수 없음',
          target_type: report.target_type,
          target_id: report.target_id,
          target_name: targetNamesMap.get(`${report.target_type}-${report.target_id}`) || '알 수 없음',
          reason: getReasonLabel(report.reason),
          description: report.description,
          evidence_urls: report.evidence_urls || [],
          status: report.status,
          resolution: report.resolution,
          resolved_by: report.resolved_by,
          resolved_at: report.resolved_at,
          created_at: report.created_at,
        }));
        setReports(transformedReports);
      }

      // Fetch customer inquiries with user profile information
      const { data: inquiriesData, error: inquiriesError } = await supabase
        .from('customer_inquiries')
        .select(`
          *,
          user:profiles(nickname, phone)
        `)
        .order('created_at', { ascending: false });

      if (inquiriesError) {
        console.error('Failed to fetch inquiries:', inquiriesError);
        setInquiries([]);
      } else {
        // Transform data to match the CustomerInquiry type
        const transformedInquiries: CustomerInquiry[] = (inquiriesData || []).map((inquiry) => ({
          id: inquiry.id,
          user_id: inquiry.user_id,
          user_name: inquiry.user_id ? (inquiry.user?.nickname || '알 수 없음') : inquiry.user_name,
          user_phone: inquiry.user_id ? (inquiry.user?.phone || inquiry.user_phone) : inquiry.user_phone,
          category: inquiry.category,
          subject: inquiry.subject,
          content: inquiry.content,
          attachments: inquiry.attachments || [],
          status: inquiry.status,
          response: inquiry.response,
          responded_by: inquiry.responded_by,
          responded_at: inquiry.responded_at,
          created_at: inquiry.created_at,
        }));
        setInquiries(transformedInquiries);
      }

      // Calculate stats
      const totalReports = reportsData?.length || 0;
      const pendingReports = reportsData?.filter((r) => r.status === 'pending' || r.status === 'reviewing').length || 0;
      const totalInquiries = inquiriesData?.length || 0;
      const pendingInquiries = inquiriesData?.filter((i) => i.status === 'pending' || i.status === 'in_progress').length || 0;

      setStats({
        totalReports,
        pendingReports,
        totalInquiries,
        pendingInquiries,
      });
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }

  function getReportStatusBadge(status: string) {
    const statusMap: Record<string, { label: string; className: string }> = {
      pending: { label: '접수', className: 'bg-amber-100 text-amber-800' },
      reviewing: { label: '검토중', className: 'bg-blue-100 text-blue-800' },
      resolved: { label: '처리완료', className: 'bg-green-100 text-green-800' },
      dismissed: { label: '기각', className: 'bg-gray-100 text-gray-800' },
    };
    const config = statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-800' };
    return <Badge className={config.className}>{config.label}</Badge>;
  }

  function getInquiryStatusBadge(status: string) {
    const statusMap: Record<string, { label: string; className: string }> = {
      pending: { label: '대기', className: 'bg-amber-100 text-amber-800' },
      in_progress: { label: '처리중', className: 'bg-blue-100 text-blue-800' },
      resolved: { label: '답변완료', className: 'bg-green-100 text-green-800' },
      closed: { label: '종료', className: 'bg-gray-100 text-gray-800' },
    };
    const config = statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-800' };
    return <Badge className={config.className}>{config.label}</Badge>;
  }

  function getTargetTypeIcon(type: string) {
    switch (type) {
      case 'shop':
        return <Store className="h-4 w-4" />;
      case 'review':
        return <FileText className="h-4 w-4" />;
      case 'user':
        return <User className="h-4 w-4" />;
      default:
        return <Flag className="h-4 w-4" />;
    }
  }

  function getCategoryBadge(category: string) {
    const categoryMap: Record<string, { label: string; className: string }> = {
      general: { label: '일반', className: 'bg-gray-100 text-gray-800' },
      reservation: { label: '예약', className: 'bg-green-100 text-green-800' },
      payment: { label: '결제', className: 'bg-pink-100 text-pink-800' },
      technical: { label: '기술', className: 'bg-blue-100 text-blue-800' },
      complaint: { label: '불만', className: 'bg-red-100 text-red-800' },
    };
    const config = categoryMap[category] || { label: category, className: 'bg-gray-100 text-gray-800' };
    return <Badge className={config.className}>{config.label}</Badge>;
  }

  async function handleResolveReport(status: 'resolved' | 'dismissed' | 'warning') {
    if (!selectedReport) return;
    if (status === 'resolved' && !resolution) {
      alert('처리 내용을 입력해주세요.');
      return;
    }
    if (status === 'warning' && !warningMessage) {
      alert('경고 메시지를 입력해주세요.');
      return;
    }

    try {
      // Get current user's ID
      const { data: { user } } = await supabase.auth.getUser();

      // Build resolution text for warning action
      const finalResolution = status === 'warning'
        ? `[경고 조치] ${warningMessage}${resolution ? `\n\n처리 내용: ${resolution}` : ''}`
        : (status === 'resolved' ? resolution : null);

      // For warning action, status is still 'resolved' in DB
      const dbStatus = status === 'warning' ? 'resolved' : status;

      const { error } = await supabase
        .from('reports')
        .update({
          status: dbStatus,
          resolution: finalResolution,
          resolved_by: user?.id,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', selectedReport.id);

      if (error) {
        console.error('Failed to update report:', error);
        alert('신고 처리에 실패했습니다.');
        return;
      }

      // 신고가 승인/경고 처리되면 신고 대상의 신용점수 차감 (-50점)
      if (status === 'resolved' || status === 'warning') {
        // 신고 대상이 user인 경우에만 신용점수 차감
        if (selectedReport.target_type === 'user') {
          try {
            const result = await deductCreditOnReport(selectedReport.target_id, selectedReport.id);

            if (result.isBlacklisted) {
              console.log(`User ${selectedReport.target_id} has been blacklisted due to credit score`);
              // 블랙리스트 처리 시 추가 알림 (선택사항)
              alert(`신고가 처리되었으며, 신고 대상이 신용점수 0점으로 인해 블랙리스트에 추가되었습니다.`);
            }
          } catch (creditError) {
            // 신용점수 차감 실패 시 로그만 남기고 계속 진행 (soft fail)
            console.error('Failed to deduct credit score:', creditError);
          }
        }
      }

      const statusMessages = {
        resolved: '처리',
        dismissed: '기각',
        warning: '경고 조치',
      };
      alert(`신고가 ${statusMessages[status]}되었습니다.`);
      setIsReportDialogOpen(false);
      setSelectedReport(null);
      setResolution('');
      setWarningMessage('');
      setSelectedAction('resolved');
      fetchData();
    } catch (error) {
      console.error('Failed to resolve report:', error);
      alert('신고 처리 중 오류가 발생했습니다.');
    }
  }

  function getFileNameFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const fileName = pathname.split('/').pop() || 'file';
      // Decode URL encoding and return
      return decodeURIComponent(fileName);
    } catch {
      return url.split('/').pop() || 'file';
    }
  }

  function getFileExtension(url: string): string {
    const fileName = getFileNameFromUrl(url);
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    return ext;
  }

  function isImageFile(url: string): boolean {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
    return imageExtensions.includes(getFileExtension(url));
  }

  async function handleRespondInquiry() {
    if (!selectedInquiry || !response) {
      alert('답변 내용을 입력해주세요.');
      return;
    }

    try {
      // Get current user's ID
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('customer_inquiries')
        .update({
          status: 'resolved',
          response,
          responded_by: user?.id,
          responded_at: new Date().toISOString(),
        })
        .eq('id', selectedInquiry.id);

      if (error) {
        console.error('Failed to respond to inquiry:', error);
        alert('답변 전송에 실패했습니다.');
        return;
      }

      alert('답변이 전송되었습니다.');
      setIsInquiryDialogOpen(false);
      setSelectedInquiry(null);
      setResponse('');
      fetchData();
    } catch (error) {
      console.error('Failed to respond to inquiry:', error);
      alert('답변 전송 중 오류가 발생했습니다.');
    }
  }

  const filteredReports = reports.filter((report) => {
    if (statusFilter !== 'all' && report.status !== statusFilter) return false;
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      report.reporter_name?.toLowerCase().includes(search) ||
      report.target_name?.toLowerCase().includes(search) ||
      report.reason.toLowerCase().includes(search)
    );
  });

  const filteredInquiries = inquiries.filter((inquiry) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      inquiry.user_name?.toLowerCase().includes(search) ||
      inquiry.subject.toLowerCase().includes(search) ||
      inquiry.content.toLowerCase().includes(search)
    );
  });

  // Pagination calculations for reports
  const reportsTotal = filteredReports.length;
  const reportsTotalPages = Math.ceil(reportsTotal / reportsPagination.pageSize);
  const reportsStartIndex = (reportsPagination.currentPage - 1) * reportsPagination.pageSize;
  const paginatedReports = filteredReports.slice(reportsStartIndex, reportsStartIndex + reportsPagination.pageSize);

  // Pagination calculations for inquiries
  const inquiriesTotal = filteredInquiries.length;
  const inquiriesTotalPages = Math.ceil(inquiriesTotal / inquiriesPagination.pageSize);
  const inquiriesStartIndex = (inquiriesPagination.currentPage - 1) * inquiriesPagination.pageSize;
  const paginatedInquiries = filteredInquiries.slice(inquiriesStartIndex, inquiriesStartIndex + inquiriesPagination.pageSize);

  // Reset page when filter changes
  useEffect(() => {
    reportsPagination.resetPage();
    inquiriesPagination.resetPage();
  }, [searchTerm, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">신고/CS 관리</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none shadow-md">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">전체 신고</p>
              <p className="text-xl font-bold text-gray-900">{stats.totalReports}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-md">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-amber-100">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">처리 대기</p>
              <p className="text-xl font-bold text-amber-600">{stats.pendingReports}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-md">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-violet-100">
              <MessageSquare className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">전체 문의</p>
              <p className="text-xl font-bold text-gray-900">{stats.totalInquiries}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-md">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-pink-100">
              <Clock className="h-5 w-5 text-pink-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">답변 대기</p>
              <p className="text-xl font-bold text-pink-600">{stats.pendingInquiries}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ReportTab)}>
        <TabsList className="bg-white shadow-sm">
          <TabsTrigger value="reports" className="gap-2">
            <AlertTriangle className="h-4 w-4" /> 신고 관리
          </TabsTrigger>
          <TabsTrigger value="inquiries" className="gap-2">
            <MessageSquare className="h-4 w-4" /> 문의 관리
          </TabsTrigger>
        </TabsList>

        {/* Reports Tab */}
        <TabsContent value="reports" className="mt-4 space-y-4">
          <Card className="border-none shadow-md">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="신고자, 대상, 사유로 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ReportStatus)}>
                  <SelectTrigger className="w-full sm:w-32">
                    <SelectValue placeholder="상태" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    <SelectItem value="pending">접수</SelectItem>
                    <SelectItem value="reviewing">검토중</SelectItem>
                    <SelectItem value="resolved">처리완료</SelectItem>
                    <SelectItem value="dismissed">기각</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md">
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
                </div>
              ) : filteredReports.length === 0 ? (
                <div className="p-8 text-center text-gray-500">신고 내역이 없습니다.</div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>신고자</TableHead>
                        <TableHead>대상</TableHead>
                        <TableHead>사유</TableHead>
                        <TableHead>신고일</TableHead>
                        <TableHead>상태</TableHead>
                        <TableHead className="text-right">관리</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedReports.map((report) => (
                        <TableRow key={report.id}>
                          <TableCell>
                            <div className="font-medium">{report.reporter_name}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getTargetTypeIcon(report.target_type)}
                              <span>{report.target_name}</span>
                            </div>
                          </TableCell>
                          <TableCell>{report.reason}</TableCell>
                          <TableCell>
                            {new Date(report.created_at).toLocaleDateString('ko-KR')}
                          </TableCell>
                          <TableCell>{getReportStatusBadge(report.status)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedReport(report);
                                setIsReportDialogOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <PaginationControls
                    currentPage={reportsPagination.currentPage}
                    totalPages={reportsTotalPages}
                    totalItems={reportsTotal}
                    pageSize={reportsPagination.pageSize}
                    onPageChange={reportsPagination.handlePageChange}
                    onPageSizeChange={reportsPagination.handlePageSizeChange}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inquiries Tab */}
        <TabsContent value="inquiries" className="mt-4 space-y-4">
          <Card className="border-none shadow-md">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="문의자, 제목, 내용으로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md">
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
                </div>
              ) : filteredInquiries.length === 0 ? (
                <div className="p-8 text-center text-gray-500">문의 내역이 없습니다.</div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>문의자</TableHead>
                        <TableHead>카테고리</TableHead>
                        <TableHead>제목</TableHead>
                        <TableHead>문의일</TableHead>
                        <TableHead>상태</TableHead>
                        <TableHead className="text-right">관리</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedInquiries.map((inquiry) => (
                        <TableRow key={inquiry.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{inquiry.user_name}</p>
                              <p className="text-xs text-gray-500">{inquiry.user_phone}</p>
                            </div>
                          </TableCell>
                          <TableCell>{getCategoryBadge(inquiry.category)}</TableCell>
                          <TableCell className="max-w-xs truncate">{inquiry.subject}</TableCell>
                          <TableCell>
                            {new Date(inquiry.created_at).toLocaleDateString('ko-KR')}
                          </TableCell>
                          <TableCell>{getInquiryStatusBadge(inquiry.status)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedInquiry(inquiry);
                                setIsInquiryDialogOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                  </Table>
                  <PaginationControls
                    currentPage={inquiriesPagination.currentPage}
                    totalPages={inquiriesTotalPages}
                    totalItems={inquiriesTotal}
                    pageSize={inquiriesPagination.pageSize}
                    onPageChange={inquiriesPagination.handlePageChange}
                    onPageSizeChange={inquiriesPagination.handlePageSizeChange}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Report Detail Dialog */}
      <Dialog open={isReportDialogOpen} onOpenChange={(open) => {
        setIsReportDialogOpen(open);
        if (!open) {
          setSelectedImageIndex(null);
          setSelectedAction('resolved');
          setWarningMessage('');
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>신고 상세</DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getTargetTypeIcon(selectedReport.target_type)}
                  <span className="font-semibold">{selectedReport.target_name}</span>
                </div>
                {getReportStatusBadge(selectedReport.status)}
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">신고자</span>
                  <span>{selectedReport.reporter_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">신고 사유</span>
                  <span>{selectedReport.reason}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">신고일</span>
                  <span>{new Date(selectedReport.created_at).toLocaleString('ko-KR')}</span>
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-1">상세 내용</p>
                <p className="text-sm text-gray-600">{selectedReport.description || '내용 없음'}</p>
              </div>

              {/* Evidence Image Gallery */}
              {selectedReport.evidence_urls && selectedReport.evidence_urls.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    증거 자료 ({selectedReport.evidence_urls.length}개)
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedReport.evidence_urls.map((url, index) => (
                      <div
                        key={index}
                        className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer hover:opacity-80 transition-opacity border border-gray-200"
                        onClick={() => setSelectedImageIndex(index)}
                      >
                        {isImageFile(url) ? (
                          <img
                            src={url}
                            alt={`증거 ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-2">
                            <FileText className="h-8 w-8 text-gray-400 mb-1" />
                            <span className="text-xs text-gray-500 text-center truncate w-full">
                              {getFileNameFromUrl(url)}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Full-size Image Viewer */}
                  {selectedImageIndex !== null && (
                    <div className="mt-3 p-3 bg-gray-900 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-300">
                          {selectedImageIndex + 1} / {selectedReport.evidence_urls.length}
                        </span>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-white hover:bg-gray-700"
                            onClick={() => setSelectedImageIndex(
                              selectedImageIndex > 0 ? selectedImageIndex - 1 : selectedReport.evidence_urls.length - 1
                            )}
                          >
                            이전
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-white hover:bg-gray-700"
                            onClick={() => setSelectedImageIndex(
                              selectedImageIndex < selectedReport.evidence_urls.length - 1 ? selectedImageIndex + 1 : 0
                            )}
                          >
                            다음
                          </Button>
                          <a
                            href={selectedReport.evidence_urls[selectedImageIndex]}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                          >
                            <Button variant="ghost" size="sm" className="text-white hover:bg-gray-700">
                              <Download className="h-4 w-4 mr-1" />
                              다운로드
                            </Button>
                          </a>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-white hover:bg-gray-700"
                            onClick={() => setSelectedImageIndex(null)}
                          >
                            닫기
                          </Button>
                        </div>
                      </div>
                      {isImageFile(selectedReport.evidence_urls[selectedImageIndex]) ? (
                        <img
                          src={selectedReport.evidence_urls[selectedImageIndex]}
                          alt={`증거 ${selectedImageIndex + 1}`}
                          className="w-full max-h-96 object-contain rounded"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8">
                          <FileText className="h-16 w-16 text-gray-400 mb-2" />
                          <span className="text-gray-300">
                            {getFileNameFromUrl(selectedReport.evidence_urls[selectedImageIndex])}
                          </span>
                          <a
                            href={selectedReport.evidence_urls[selectedImageIndex]}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 text-blue-400 hover:underline text-sm"
                          >
                            새 탭에서 열기
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {selectedReport.status === 'resolved' && selectedReport.resolution && (
                <div className={`p-3 rounded-lg ${selectedReport.resolution.startsWith('[경고 조치]') ? 'bg-amber-50' : 'bg-green-50'}`}>
                  <p className={`text-sm font-medium mb-1 ${selectedReport.resolution.startsWith('[경고 조치]') ? 'text-amber-700' : 'text-green-700'}`}>
                    {selectedReport.resolution.startsWith('[경고 조치]') ? '경고 조치 결과' : '처리 결과'}
                  </p>
                  <p className={`text-sm whitespace-pre-wrap ${selectedReport.resolution.startsWith('[경고 조치]') ? 'text-amber-600' : 'text-green-600'}`}>
                    {selectedReport.resolution}
                  </p>
                </div>
              )}

              {(selectedReport.status === 'pending' || selectedReport.status === 'reviewing') && (
                <div className="space-y-4 border-t pt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">처리 방법 선택</label>
                    <Select value={selectedAction} onValueChange={(v) => setSelectedAction(v as 'resolved' | 'dismissed' | 'warning')}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="처리 방법 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="resolved">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span>처리 완료</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="warning">
                          <div className="flex items-center gap-2">
                            <AlertOctagon className="h-4 w-4 text-amber-600" />
                            <span>경고 조치</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="dismissed">
                          <div className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-gray-600" />
                            <span>기각</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedAction === 'warning' && (
                    <div className="space-y-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                      <label className="text-sm font-medium text-amber-800 flex items-center gap-2">
                        <AlertOctagon className="h-4 w-4" />
                        경고 메시지 (필수)
                      </label>
                      <Textarea
                        value={warningMessage}
                        onChange={(e) => setWarningMessage(e.target.value)}
                        placeholder="신고 대상에게 전달할 경고 메시지를 입력하세요"
                        rows={3}
                        className="border-amber-300 focus:border-amber-500"
                      />
                      <p className="text-xs text-amber-600">
                        이 경고 메시지는 신고 대상에게 전달될 수 있습니다.
                      </p>
                    </div>
                  )}

                  {(selectedAction === 'resolved' || selectedAction === 'warning') && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        처리 내용 {selectedAction === 'resolved' ? '(필수)' : '(선택)'}
                      </label>
                      <Textarea
                        value={resolution}
                        onChange={(e) => setResolution(e.target.value)}
                        placeholder="처리 내용을 입력하세요"
                        rows={3}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            {selectedReport && (selectedReport.status === 'pending' || selectedReport.status === 'reviewing') ? (
              <>
                <Button variant="outline" onClick={() => setIsReportDialogOpen(false)}>
                  취소
                </Button>
                <Button
                  onClick={() => handleResolveReport(selectedAction)}
                  className={
                    selectedAction === 'warning'
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : selectedAction === 'dismissed'
                      ? 'bg-gray-600 hover:bg-gray-700'
                      : ''
                  }
                >
                  {selectedAction === 'resolved' && '처리 완료'}
                  {selectedAction === 'warning' && '경고 조치'}
                  {selectedAction === 'dismissed' && '기각'}
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setIsReportDialogOpen(false)}>
                닫기
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Inquiry Detail Dialog */}
      <Dialog open={isInquiryDialogOpen} onOpenChange={setIsInquiryDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>문의 상세</DialogTitle>
          </DialogHeader>
          {selectedInquiry && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{selectedInquiry.subject}</h3>
                  {getCategoryBadge(selectedInquiry.category)}
                </div>
                {getInquiryStatusBadge(selectedInquiry.status)}
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">문의자</span>
                  <span>{selectedInquiry.user_name} ({selectedInquiry.user_phone})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">문의일</span>
                  <span>{new Date(selectedInquiry.created_at).toLocaleString('ko-KR')}</span>
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-1">문의 내용</p>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedInquiry.content}</p>
              </div>

              {/* Attachments Section */}
              {selectedInquiry.attachments && selectedInquiry.attachments.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Paperclip className="h-4 w-4" />
                    첨부파일 ({selectedInquiry.attachments.length}개)
                  </p>
                  <div className="space-y-2">
                    {selectedInquiry.attachments.map((url, index) => {
                      const fileName = getFileNameFromUrl(url);
                      const isImage = isImageFile(url);

                      return (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          {isImage ? (
                            <div className="flex-shrink-0 w-12 h-12 rounded overflow-hidden bg-gray-200">
                              <img
                                src={url}
                                alt={fileName}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="flex-shrink-0 w-12 h-12 rounded bg-gray-200 flex items-center justify-center">
                              <FileText className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-700 truncate">
                              {fileName}
                            </p>
                            <p className="text-xs text-gray-500 uppercase">
                              {getFileExtension(url) || '파일'}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            {isImage && (
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </a>
                            )}
                            <a
                              href={url}
                              download={fileName}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button variant="outline" size="sm">
                                <Download className="h-4 w-4 mr-1" />
                                다운로드
                              </Button>
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Image Preview Grid for attachments */}
                  {selectedInquiry.attachments.filter(isImageFile).length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-500 mb-2">이미지 미리보기</p>
                      <div className="grid grid-cols-4 gap-2">
                        {selectedInquiry.attachments
                          .filter(isImageFile)
                          .map((url, index) => (
                            <a
                              key={index}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="aspect-square rounded-lg overflow-hidden bg-gray-100 hover:opacity-80 transition-opacity border border-gray-200"
                            >
                              <img
                                src={url}
                                alt={`첨부 이미지 ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </a>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {selectedInquiry.response && (
                <div className="p-3 bg-violet-50 rounded-lg">
                  <p className="text-sm font-medium text-violet-700 mb-1">답변</p>
                  <p className="text-sm text-violet-600 whitespace-pre-wrap">{selectedInquiry.response}</p>
                  <p className="text-xs text-violet-400 mt-2">
                    {selectedInquiry.responded_at && new Date(selectedInquiry.responded_at).toLocaleString('ko-KR')}
                  </p>
                </div>
              )}

              {(selectedInquiry.status === 'pending' || selectedInquiry.status === 'in_progress') && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">답변</label>
                  <Textarea
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    placeholder="답변 내용을 입력하세요"
                    rows={4}
                  />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            {selectedInquiry && (selectedInquiry.status === 'pending' || selectedInquiry.status === 'in_progress') ? (
              <>
                <Button variant="outline" onClick={() => setIsInquiryDialogOpen(false)}>
                  취소
                </Button>
                <Button onClick={handleRespondInquiry} disabled={!response}>
                  답변 전송
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setIsInquiryDialogOpen(false)}>
                닫기
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

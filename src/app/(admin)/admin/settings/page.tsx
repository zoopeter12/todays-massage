'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
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
  Settings,
  Shield,
  Clock,
  Database,
  Bell,
  CreditCard,
  Save,
  RefreshCw,
  User,
  Eye,
  Key,
  Percent,
  Loader2,
} from 'lucide-react';
import type { AdminLog, SystemConfig } from '@/types/admin';
import {
  getSystemSettings,
  updateGeneralSettings,
  updatePaymentSettings,
  updateNotificationSettings,
  type GeneralSettings,
  type PaymentSettings,
  type NotificationSettings,
} from '@/lib/api/settings';
import { getAdminLogs } from '@/lib/api/admin-logs';
import { supabase } from '@/lib/supabase/client';

type SettingsTab = 'general' | 'payment' | 'notifications' | 'logs';

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [isLogDialogOpen, setIsLogDialogOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AdminLog | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();

  // Settings states
  const [generalSettings, setGeneralSettings] = useState({
    siteName: '마사지 예약 플랫폼',
    siteDescription: '편리한 마사지 예약 서비스',
    contactEmail: 'support@massage-platform.com',
    contactPhone: '1588-0000',
    maintenanceMode: false,
    registrationEnabled: true,
  });

  const [paymentSettings, setPaymentSettings] = useState({
    commissionRate: 10,
    minWithdrawal: 10000,
    settlementDay: 15,
    paymentMethods: {
      card: true,
      kakaopay: true,
      naverpay: true,
      toss: true,
    },
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailEnabled: true,
    smsEnabled: true,
    pushEnabled: true,
    reservationReminder: true,
    marketingEnabled: false,
    reminderHours: 24,
  });

  // Fetch settings from DB
  const fetchSettings = useCallback(async () => {
    try {
      const settings = await getSystemSettings();

      setGeneralSettings({
        siteName: settings.general.siteName,
        siteDescription: settings.general.siteDescription,
        contactEmail: settings.general.supportEmail,
        contactPhone: settings.general.supportPhone,
        maintenanceMode: settings.general.maintenanceMode,
        registrationEnabled: settings.general.allowRegistration,
      });

      setPaymentSettings({
        commissionRate: settings.payment.platformFeeRate,
        minWithdrawal: settings.payment.minWithdrawal,
        settlementDay: settings.payment.settlementDay,
        paymentMethods: settings.payment.paymentMethods,
      });

      setNotificationSettings({
        emailEnabled: settings.notification.emailEnabled,
        smsEnabled: settings.notification.smsEnabled,
        pushEnabled: settings.notification.pushEnabled,
        reservationReminder: settings.notification.reservationReminder,
        marketingEnabled: settings.notification.marketingEnabled,
        reminderHours: settings.notification.reminderHours,
      });
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setInitialLoading(false);
    }
  }, []);

  // Get current user
  useEffect(() => {
    async function getCurrentUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id);
    }
    getCurrentUser();
  }, []);

  useEffect(() => {
    fetchSettings();
    fetchLogs();
  }, [fetchSettings]);

  async function fetchLogs() {
    try {
      const { logs: fetchedLogs, error } = await getAdminLogs({ limit: 50 });

      if (error) {
        console.error('Failed to fetch logs:', error);
        setLogs([]);
        return;
      }

      setLogs(fetchedLogs);
    } catch (error) {
      console.error('Exception fetching logs:', error);
      setLogs([]);
    }
  }

  async function handleSaveGeneral() {
    setLoading(true);
    try {
      await updateGeneralSettings({
        siteName: generalSettings.siteName,
        siteDescription: generalSettings.siteDescription,
        supportEmail: generalSettings.contactEmail,
        supportPhone: generalSettings.contactPhone,
        maintenanceMode: generalSettings.maintenanceMode,
        allowRegistration: generalSettings.registrationEnabled,
      }, currentUserId);
      alert('일반 설정이 저장되었습니다.');
    } catch (error) {
      console.error('Failed to save general settings:', error);
      alert('설정 저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSavePayment() {
    setLoading(true);
    try {
      await updatePaymentSettings({
        platformFeeRate: paymentSettings.commissionRate,
        minWithdrawal: paymentSettings.minWithdrawal,
        settlementDay: paymentSettings.settlementDay,
        paymentMethods: paymentSettings.paymentMethods,
      }, currentUserId);
      alert('결제 설정이 저장되었습니다.');
    } catch (error) {
      console.error('Failed to save payment settings:', error);
      alert('설정 저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveNotifications() {
    setLoading(true);
    try {
      await updateNotificationSettings({
        emailEnabled: notificationSettings.emailEnabled,
        smsEnabled: notificationSettings.smsEnabled,
        pushEnabled: notificationSettings.pushEnabled,
        reservationReminder: notificationSettings.reservationReminder,
        reminderHours: notificationSettings.reminderHours,
        marketingEnabled: notificationSettings.marketingEnabled,
      }, currentUserId);
      alert('알림 설정이 저장되었습니다.');
    } catch (error) {
      console.error('Failed to save notification settings:', error);
      alert('설정 저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  function getActionLabel(action: string) {
    const actionMap: Record<string, string> = {
      'user.suspend': '회원 정지',
      'user.delete': '회원 삭제',
      'user.role_change': '권한 변경',
      'shop.approve': '매장 승인',
      'shop.reject': '매장 반려',
      'shop.suspend': '매장 정지',
      'settlement.process': '정산 처리',
      'config.update': '설정 변경',
      'report.resolve': '신고 처리',
      'content.create': '콘텐츠 생성',
      'content.update': '콘텐츠 수정',
      'content.delete': '콘텐츠 삭제',
    };
    return actionMap[action] || action;
  }

  function getActionBadge(action: string) {
    let className = 'bg-gray-100 text-gray-800';
    if (action.includes('suspend') || action.includes('delete') || action.includes('reject')) {
      className = 'bg-red-100 text-red-800';
    } else if (action.includes('approve') || action.includes('create')) {
      className = 'bg-green-100 text-green-800';
    } else if (action.includes('update') || action.includes('process')) {
      className = 'bg-blue-100 text-blue-800';
    }
    return <Badge className={className}>{getActionLabel(action)}</Badge>;
  }

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
          <p className="text-gray-500">설정을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">시스템 설정</h1>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as SettingsTab)}>
        <TabsList className="bg-white shadow-sm">
          <TabsTrigger value="general" className="gap-2">
            <Settings className="h-4 w-4" /> 일반
          </TabsTrigger>
          <TabsTrigger value="payment" className="gap-2">
            <CreditCard className="h-4 w-4" /> 결제
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" /> 알림
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-2">
            <Database className="h-4 w-4" /> 로그
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="mt-4">
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle>일반 설정</CardTitle>
              <CardDescription>사이트의 기본 설정을 관리합니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">사이트 이름</label>
                  <Input
                    value={generalSettings.siteName}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, siteName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">사이트 설명</label>
                  <Input
                    value={generalSettings.siteDescription}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, siteDescription: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">고객센터 이메일</label>
                  <Input
                    type="email"
                    value={generalSettings.contactEmail}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, contactEmail: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">고객센터 전화</label>
                  <Input
                    value={generalSettings.contactPhone}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, contactPhone: e.target.value })}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-sm font-medium">사이트 상태</h3>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">점검 모드</p>
                    <p className="text-xs text-gray-500">활성화 시 일반 사용자 접근이 차단됩니다.</p>
                  </div>
                  <Switch
                    checked={generalSettings.maintenanceMode}
                    onCheckedChange={(v) => setGeneralSettings({ ...generalSettings, maintenanceMode: v })}
                  />
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">회원가입 허용</p>
                    <p className="text-xs text-gray-500">비활성화 시 새 회원가입이 차단됩니다.</p>
                  </div>
                  <Switch
                    checked={generalSettings.registrationEnabled}
                    onCheckedChange={(v) => setGeneralSettings({ ...generalSettings, registrationEnabled: v })}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveGeneral} disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? '저장 중...' : '저장'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Settings */}
        <TabsContent value="payment" className="mt-4">
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle>결제 설정</CardTitle>
              <CardDescription>수수료 및 정산 관련 설정을 관리합니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Percent className="h-4 w-4" /> 플랫폼 수수료율
                  </label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={paymentSettings.commissionRate}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, commissionRate: Number(e.target.value) })}
                      min={0}
                      max={100}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">최소 출금 금액</label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={paymentSettings.minWithdrawal}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, minWithdrawal: Number(e.target.value) })}
                      min={0}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">원</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">정산 기준일</label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={paymentSettings.settlementDay}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, settlementDay: Number(e.target.value) })}
                      min={1}
                      max={28}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">일</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-sm font-medium">결제 수단</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(paymentSettings.paymentMethods).map(([method, enabled]) => (
                    <div
                      key={method}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <span className="text-sm font-medium capitalize">
                        {method === 'card' ? '카드' : method === 'kakaopay' ? '카카오페이' : method === 'naverpay' ? '네이버페이' : '토스'}
                      </span>
                      <Switch
                        checked={enabled}
                        onCheckedChange={(v) =>
                          setPaymentSettings({
                            ...paymentSettings,
                            paymentMethods: { ...paymentSettings.paymentMethods, [method]: v },
                          })
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSavePayment} disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? '저장 중...' : '저장'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="mt-4">
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle>알림 설정</CardTitle>
              <CardDescription>사용자 알림 관련 설정을 관리합니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-medium">알림 채널</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">이메일 알림</p>
                    </div>
                    <Switch
                      checked={notificationSettings.emailEnabled}
                      onCheckedChange={(v) => setNotificationSettings({ ...notificationSettings, emailEnabled: v })}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">SMS 알림</p>
                    </div>
                    <Switch
                      checked={notificationSettings.smsEnabled}
                      onCheckedChange={(v) => setNotificationSettings({ ...notificationSettings, smsEnabled: v })}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">푸시 알림</p>
                    </div>
                    <Switch
                      checked={notificationSettings.pushEnabled}
                      onCheckedChange={(v) => setNotificationSettings({ ...notificationSettings, pushEnabled: v })}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-sm font-medium">알림 유형</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">예약 리마인더</p>
                      <p className="text-xs text-gray-500">예약 전 미리 알림을 발송합니다.</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={notificationSettings.reminderHours}
                          onChange={(e) => setNotificationSettings({ ...notificationSettings, reminderHours: Number(e.target.value) })}
                          className="w-20"
                          min={1}
                          max={72}
                        />
                        <span className="text-sm text-gray-500">시간 전</span>
                      </div>
                      <Switch
                        checked={notificationSettings.reservationReminder}
                        onCheckedChange={(v) => setNotificationSettings({ ...notificationSettings, reservationReminder: v })}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">마케팅 알림</p>
                      <p className="text-xs text-gray-500">이벤트 및 프로모션 알림을 발송합니다.</p>
                    </div>
                    <Switch
                      checked={notificationSettings.marketingEnabled}
                      onCheckedChange={(v) => setNotificationSettings({ ...notificationSettings, marketingEnabled: v })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveNotifications} disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? '저장 중...' : '저장'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Logs */}
        <TabsContent value="logs" className="mt-4">
          <Card className="border-none shadow-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>활동 로그</CardTitle>
                <CardDescription>관리자 활동 기록을 조회합니다.</CardDescription>
              </div>
              <Button variant="outline" onClick={fetchLogs}>
                <RefreshCw className="h-4 w-4 mr-2" />
                새로고침
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>관리자</TableHead>
                    <TableHead>작업</TableHead>
                    <TableHead>대상</TableHead>
                    <TableHead>IP 주소</TableHead>
                    <TableHead>일시</TableHead>
                    <TableHead className="text-right">상세</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-pink-400 flex items-center justify-center text-white text-xs font-medium">
                            {log.admin_name?.charAt(0) || 'A'}
                          </div>
                          <span className="text-sm">{log.admin_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getActionBadge(log.action)}</TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-500">
                          {log.target_type}: {log.target_id}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-mono text-gray-500">{log.ip_address}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {new Date(log.created_at).toLocaleString('ko-KR')}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedLog(log);
                            setIsLogDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Log Detail Dialog */}
      <Dialog open={isLogDialogOpen} onOpenChange={setIsLogDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>활동 로그 상세</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">관리자</span>
                  <span>{selectedLog.admin_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">작업</span>
                  {getActionBadge(selectedLog.action)}
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">대상</span>
                  <span>{selectedLog.target_type}: {selectedLog.target_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">IP 주소</span>
                  <span className="font-mono">{selectedLog.ip_address}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">일시</span>
                  <span>{new Date(selectedLog.created_at).toLocaleString('ko-KR')}</span>
                </div>
              </div>

              {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-2">상세 정보</p>
                  <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.user_agent && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-2">User Agent</p>
                  <p className="text-xs text-gray-500 break-all">{selectedLog.user_agent}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLogDialogOpen(false)}>
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

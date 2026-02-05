'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  Search,
  Users,
  UserCheck,
  UserX,
  Ban,
  MoreVertical,
  Eye,
  Mail,
  Phone,
  Calendar,
  Shield,
} from 'lucide-react';
import type { Profile } from '@/types/supabase';
import { suspendUser, unsuspendUser } from '@/lib/api/users';
import { createAdminLog } from '@/lib/api/admin-logs';

interface AdminUserData extends Profile {
  email?: string;
  reservation_count?: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<AdminUserData | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isSuspendOpen, setIsSuspendOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    customers: 0,
    partners: 0,
    admins: 0,
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (roleFilter !== 'all') {
        query = query.eq('role', roleFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      setUsers((data as AdminUserData[]) ?? []);

      // Calculate stats
      const allUsers = data ?? [];
      setStats({
        total: allUsers.length,
        customers: allUsers.filter((u) => u.role === 'customer').length,
        partners: allUsers.filter((u) => u.role === 'partner').length,
        admins: allUsers.filter((u) => u.role === 'admin').length,
      });
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  }, [roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = users.filter((user) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      user.nickname?.toLowerCase().includes(search) ||
      user.phone?.toLowerCase().includes(search) ||
      user.id.toLowerCase().includes(search)
    );
  });

  function getRoleBadge(role: string) {
    const roleMap: Record<string, { label: string; className: string }> = {
      customer: { label: '고객', className: 'bg-blue-100 text-blue-800' },
      partner: { label: '사장님', className: 'bg-violet-100 text-violet-800' },
      admin: { label: '관리자', className: 'bg-pink-100 text-pink-800' },
    };
    const config = roleMap[role] || { label: role, className: 'bg-gray-100 text-gray-800' };
    return <Badge className={config.className}>{config.label}</Badge>;
  }

  function getStatusBadge(status?: string) {
    if (status === 'suspended') {
      return <Badge className="bg-red-100 text-red-800">정지됨</Badge>;
    }
    if (status === 'deleted') {
      return <Badge className="bg-gray-100 text-gray-800">삭제됨</Badge>;
    }
    return null; // active는 표시하지 않음
  }

  function getAuthProviderLabel(provider: string | null) {
    const providerMap: Record<string, string> = {
      phone: '전화번호',
      google: 'Google',
      kakao: '카카오',
    };
    return provider ? providerMap[provider] || provider : '-';
  }

  async function handleSuspend() {
    if (!selectedUser || !suspendReason) return;

    try {
      // 현재 로그인한 관리자 정보 가져오기
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('로그인이 필요합니다.');
        return;
      }

      // 사용자 정지 처리
      const result = await suspendUser(selectedUser.id, suspendReason, null);

      if (!result.success) {
        alert(`정지 처리 실패: ${result.error || '알 수 없는 오류가 발생했습니다.'}`);
        return;
      }

      // 관리자 활동 로그 기록
      await createAdminLog({
        adminId: user.id,
        adminName: user.email || 'Unknown Admin',
        action: 'user_suspend',
        targetType: 'user',
        targetId: selectedUser.id,
        details: {
          reason: suspendReason,
          suspended_user_nickname: selectedUser.nickname,
          suspended_user_phone: selectedUser.phone,
        },
      });

      // 성공 처리
      alert(`사용자 ${selectedUser.nickname || selectedUser.id}를 정지 처리했습니다.\n사유: ${suspendReason}`);

      // 다이얼로그 닫기 및 상태 초기화
      setIsSuspendOpen(false);
      setSuspendReason('');
      setSelectedUser(null);

      // 목록 새로고침
      fetchUsers();
    } catch (error) {
      console.error('Failed to suspend user:', error);
      alert('정지 처리 중 오류가 발생했습니다.');
    }
  }

  async function handleChangeRole(userId: string, newRole: string) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      fetchUsers();
      alert('권한이 변경되었습니다.');
    } catch (error) {
      console.error('Failed to change role:', error);
      alert('권한 변경에 실패했습니다.');
    }
  }

  async function handleUnsuspend(userId: string) {
    try {
      // 현재 로그인한 관리자 정보 가져오기
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('로그인이 필요합니다.');
        return;
      }

      const userToUnsuspend = users.find(u => u.id === userId);
      if (!userToUnsuspend) {
        alert('사용자를 찾을 수 없습니다.');
        return;
      }

      // 사용자 정지 해제 처리
      const result = await unsuspendUser(userId);

      if (!result.success) {
        alert(`정지 해제 실패: ${result.error || '알 수 없는 오류가 발생했습니다.'}`);
        return;
      }

      // 관리자 활동 로그 기록
      await createAdminLog({
        adminId: user.id,
        adminName: user.email || 'Unknown Admin',
        action: 'user_unsuspend',
        targetType: 'user',
        targetId: userId,
        details: {
          unsuspended_user_nickname: userToUnsuspend.nickname,
          unsuspended_user_phone: userToUnsuspend.phone,
        },
      });

      // 성공 처리
      alert(`사용자 ${userToUnsuspend.nickname || userId}의 정지를 해제했습니다.`);

      // 목록 새로고침
      fetchUsers();
    } catch (error) {
      console.error('Failed to unsuspend user:', error);
      alert('정지 해제 중 오류가 발생했습니다.');
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">회원관리</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none shadow-md">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-gray-100">
              <Users className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">전체 회원</p>
              <p className="text-xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-md">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-blue-100">
              <UserCheck className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">고객</p>
              <p className="text-xl font-bold text-blue-600">{stats.customers}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-md">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-violet-100">
              <UserCheck className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">사장님</p>
              <p className="text-xl font-bold text-violet-600">{stats.partners}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-md">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-pink-100">
              <Shield className="h-5 w-5 text-pink-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">관리자</p>
              <p className="text-xl font-bold text-pink-600">{stats.admins}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-none shadow-md">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="닉네임, 전화번호로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Tabs value={roleFilter} onValueChange={setRoleFilter} className="w-full sm:w-auto">
              <TabsList>
                <TabsTrigger value="all">전체</TabsTrigger>
                <TabsTrigger value="customer">고객</TabsTrigger>
                <TabsTrigger value="partner">사장님</TabsTrigger>
                <TabsTrigger value="admin">관리자</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="border-none shadow-md">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
              <p className="mt-2 text-gray-500">로딩 중...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {searchTerm ? '검색 결과가 없습니다.' : '등록된 회원이 없습니다.'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>회원정보</TableHead>
                  <TableHead>권한</TableHead>
                  <TableHead>가입방식</TableHead>
                  <TableHead>추천인 코드</TableHead>
                  <TableHead>가입일</TableHead>
                  <TableHead className="text-right">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-pink-400 flex items-center justify-center text-white font-medium">
                          {user.nickname?.charAt(0) || user.phone?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {user.nickname || '닉네임 없음'}
                          </p>
                          <p className="text-sm text-gray-500">{user.phone || '-'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getRoleBadge(user.role)}
                        {getStatusBadge(user.status)}
                      </div>
                    </TableCell>
                    <TableCell>{getAuthProviderLabel(user.auth_provider)}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {user.referral_code || '-'}
                      </code>
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString('ko-KR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user);
                            setIsDetailOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {user.role !== 'admin' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                              setSelectedUser(user);
                              setIsSuspendOpen(true);
                            }}
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* User Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>회원 상세정보</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-400 to-pink-400 flex items-center justify-center text-white text-xl font-bold">
                  {selectedUser.nickname?.charAt(0) || '?'}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">
                    {selectedUser.nickname || '닉네임 없음'}
                  </h3>
                  {getRoleBadge(selectedUser.role)}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span>{selectedUser.phone || '-'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>
                    가입일: {new Date(selectedUser.created_at).toLocaleDateString('ko-KR')}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Shield className="h-4 w-4 text-gray-400" />
                  <span>가입방식: {getAuthProviderLabel(selectedUser.auth_provider)}</span>
                </div>
                {selectedUser.status === 'suspended' && (
                  <div className="border-t pt-3 mt-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Ban className="h-4 w-4 text-red-600" />
                      <span className="font-medium text-red-600">정지 상태</span>
                    </div>
                    {selectedUser.suspension_reason && (
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">사유:</span> {selectedUser.suspension_reason}
                      </p>
                    )}
                    {selectedUser.suspended_at && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">정지일:</span>{' '}
                        {new Date(selectedUser.suspended_at).toLocaleString('ko-KR')}
                      </p>
                    )}
                    {selectedUser.suspended_until && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">해제 예정:</span>{' '}
                        {new Date(selectedUser.suspended_until).toLocaleString('ko-KR')}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">권한 변경</p>
                <div className="flex gap-2">
                  <Button
                    variant={selectedUser.role === 'customer' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleChangeRole(selectedUser.id, 'customer')}
                    disabled={selectedUser.role === 'customer'}
                  >
                    고객
                  </Button>
                  <Button
                    variant={selectedUser.role === 'partner' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleChangeRole(selectedUser.id, 'partner')}
                    disabled={selectedUser.role === 'partner'}
                  >
                    사장님
                  </Button>
                  <Button
                    variant={selectedUser.role === 'admin' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleChangeRole(selectedUser.id, 'admin')}
                    disabled={selectedUser.role === 'admin'}
                  >
                    관리자
                  </Button>
                </div>
              </div>

              {selectedUser.status === 'suspended' && (
                <div className="border-t pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-green-600 hover:text-green-700 hover:bg-green-50"
                    onClick={() => {
                      if (confirm(`${selectedUser.nickname || '해당 회원'}의 정지를 해제하시겠습니까?`)) {
                        handleUnsuspend(selectedUser.id);
                        setIsDetailOpen(false);
                      }
                    }}
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    정지 해제
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Suspend Dialog */}
      <Dialog open={isSuspendOpen} onOpenChange={setIsSuspendOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>회원 정지</DialogTitle>
            <DialogDescription>
              {selectedUser?.nickname || '해당 회원'}을(를) 정지하시겠습니까?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">정지 사유</label>
              <Input
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="정지 사유를 입력하세요"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSuspendOpen(false)}>
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleSuspend}
              disabled={!suspendReason}
            >
              정지 처리
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

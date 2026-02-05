'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Ban,
  UserX,
  Plus,
  Trash2,
  Calendar,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { BlacklistEntry } from '@/lib/api/blacklist';
import { fetchBlacklist, addToBlacklist, removeFromBlacklist } from '@/lib/api/blacklist';
import { createAdminLog } from '@/lib/api/admin-logs';

interface BlacklistWithUser extends BlacklistEntry {
  user_info?: {
    nickname?: string;
    phone?: string;
    status?: string;
  };
}

interface UserSearchResult {
  id: string;
  nickname: string | null;
  phone: string | null;
  di: string | null;
  status: string;
}

export default function AdminBlacklistPage() {
  const [blacklist, setBlacklist] = useState<BlacklistWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<BlacklistWithUser | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  // Add form
  const [addMethod, setAddMethod] = useState<'di' | 'user'>('user');
  const [addDi, setAddDi] = useState('');
  const [addReason, setAddReason] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<UserSearchResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const totalPages = Math.ceil(totalCount / pageSize);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchBlacklist(currentPage, pageSize);

      // DI로 사용자 정보 조회 (profiles 테이블에서 di로 매칭)
      const blacklistWithUsers: BlacklistWithUser[] = await Promise.all(
        result.data.map(async (entry) => {
          try {
            const { data: userData } = await supabase
              .from('profiles')
              .select('nickname, phone, status')
              .eq('di', entry.di)
              .maybeSingle();

            return {
              ...entry,
              user_info: userData || undefined,
            };
          } catch {
            return entry;
          }
        })
      );

      setBlacklist(blacklistWithUsers);
      setTotalCount(result.total);
    } catch (error) {
      console.error('Failed to fetch blacklist:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 사용자 검색
  const handleUserSearch = async () => {
    if (!userSearchTerm.trim()) {
      setUserSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nickname, phone, di, status')
        .or(`nickname.ilike.%${userSearchTerm}%,phone.ilike.%${userSearchTerm}%`)
        .limit(10);

      if (error) throw error;

      setUserSearchResults((data as UserSearchResult[]) || []);
    } catch (error) {
      console.error('Failed to search users:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const filteredBlacklist = blacklist.filter((entry) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      entry.di.toLowerCase().includes(search) ||
      entry.reason.toLowerCase().includes(search) ||
      entry.user_info?.nickname?.toLowerCase().includes(search) ||
      entry.user_info?.phone?.toLowerCase().includes(search)
    );
  });

  async function handleAdd() {
    try {
      // 현재 로그인한 관리자 정보
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('로그인이 필요합니다.');
        return;
      }

      let diValue: string;
      let userId: string | undefined;

      // DI 값 결정
      if (addMethod === 'di') {
        if (!addDi.trim()) {
          alert('DI를 입력해주세요.');
          return;
        }
        diValue = addDi.trim();
      } else {
        if (!selectedUser?.di) {
          alert('DI 정보가 없는 사용자입니다.');
          return;
        }
        diValue = selectedUser.di;
        userId = selectedUser.id;
      }

      if (!addReason.trim()) {
        alert('차단 사유를 입력해주세요.');
        return;
      }

      // 블랙리스트 추가
      const result = await addToBlacklist(diValue, addReason.trim(), user.id, userId);

      if (!result.success) {
        alert(`블랙리스트 추가 실패: ${result.error}`);
        return;
      }

      // 관리자 활동 로그
      await createAdminLog({
        adminId: user.id,
        adminName: user.email || 'Unknown Admin',
        action: 'blacklist_add',
        targetType: 'blacklist',
        targetId: diValue,
        details: {
          di: diValue,
          reason: addReason,
          method: addMethod,
          user_id: userId,
          user_nickname: selectedUser?.nickname,
          user_phone: selectedUser?.phone,
        },
      });

      alert('블랙리스트에 추가했습니다.');

      // 초기화 및 새로고침
      setIsAddOpen(false);
      setAddDi('');
      setAddReason('');
      setSelectedUser(null);
      setUserSearchTerm('');
      setUserSearchResults([]);
      fetchData();
    } catch (error) {
      console.error('Failed to add to blacklist:', error);
      alert('블랙리스트 추가 중 오류가 발생했습니다.');
    }
  }

  async function handleRemove() {
    if (!selectedEntry) return;

    try {
      // 현재 로그인한 관리자 정보
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('로그인이 필요합니다.');
        return;
      }

      const result = await removeFromBlacklist(selectedEntry.di);

      if (!result.success) {
        alert(`블랙리스트 해제 실패: ${result.error}`);
        return;
      }

      // 관리자 활동 로그
      await createAdminLog({
        adminId: user.id,
        adminName: user.email || 'Unknown Admin',
        action: 'blacklist_remove',
        targetType: 'blacklist',
        targetId: selectedEntry.di,
        details: {
          di: selectedEntry.di,
          original_reason: selectedEntry.reason,
          user_nickname: selectedEntry.user_info?.nickname,
          user_phone: selectedEntry.user_info?.phone,
        },
      });

      alert('블랙리스트에서 해제했습니다.');

      setIsConfirmOpen(false);
      setSelectedEntry(null);
      fetchData();
    } catch (error) {
      console.error('Failed to remove from blacklist:', error);
      alert('블랙리스트 해제 중 오류가 발생했습니다.');
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">블랙리스트 관리</h1>
          <p className="text-sm text-gray-500 mt-1">
            악의적 사용자 또는 부적절한 행위를 한 사용자를 관리합니다.
          </p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          블랙리스트 추가
        </Button>
      </div>

      {/* Stats Card */}
      <Card className="border-none shadow-md">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="p-2 rounded-full bg-red-100">
            <Ban className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">전체 블랙리스트</p>
            <p className="text-xl font-bold text-red-600">{totalCount}</p>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <Card className="border-none shadow-md">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="DI, 사유, 닉네임, 전화번호로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Blacklist Table */}
      <Card className="border-none shadow-md">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
              <p className="mt-2 text-gray-500">로딩 중...</p>
            </div>
          ) : filteredBlacklist.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {searchTerm ? '검색 결과가 없습니다.' : '등록된 블랙리스트가 없습니다.'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>사용자 정보</TableHead>
                  <TableHead>DI</TableHead>
                  <TableHead>차단 사유</TableHead>
                  <TableHead>차단일</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead className="text-right">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBlacklist.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      {entry.user_info ? (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-400 to-orange-400 flex items-center justify-center text-white font-medium">
                            {entry.user_info.nickname?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {entry.user_info.nickname || '닉네임 없음'}
                            </p>
                            <p className="text-sm text-gray-500">
                              {entry.user_info.phone || '-'}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <UserX className="h-5 w-5 text-gray-400" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">탈퇴한 사용자</p>
                          </div>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded break-all">
                        {entry.di.substring(0, 16)}...
                      </code>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-gray-900 line-clamp-2 max-w-xs">
                        {entry.reason}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        {new Date(entry.blocked_at).toLocaleDateString('ko-KR')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-red-100 text-red-800">차단됨</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => {
                          setSelectedEntry(entry);
                          setIsConfirmOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <Card className="border-none shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                전체 {totalCount}개 중 {(currentPage - 1) * pageSize + 1}-
                {Math.min(currentPage * pageSize, totalCount)}개 표시
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-gray-700">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>블랙리스트 추가</DialogTitle>
            <DialogDescription>
              사용자를 블랙리스트에 추가합니다. DI 값은 본인인증 정보로, 재가입 시에도 차단됩니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* 추가 방식 선택 */}
            <div>
              <label className="text-sm font-medium text-gray-700">추가 방식</label>
              <Select value={addMethod} onValueChange={(v) => setAddMethod(v as 'di' | 'user')}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">사용자 검색</SelectItem>
                  <SelectItem value="di">DI 직접 입력</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 사용자 검색 */}
            {addMethod === 'user' && (
              <div>
                <label className="text-sm font-medium text-gray-700">사용자 검색</label>
                <div className="flex gap-2 mt-1">
                  <Input
                    placeholder="닉네임 또는 전화번호"
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleUserSearch();
                      }
                    }}
                  />
                  <Button onClick={handleUserSearch} disabled={isSearching}>
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
                {userSearchResults.length > 0 && (
                  <div className="mt-2 border rounded-md divide-y max-h-48 overflow-y-auto">
                    {userSearchResults.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => {
                          setSelectedUser(user);
                          setUserSearchResults([]);
                        }}
                        className="w-full p-2 text-left hover:bg-gray-50 transition-colors"
                      >
                        <p className="text-sm font-medium">{user.nickname || '닉네임 없음'}</p>
                        <p className="text-xs text-gray-500">{user.phone || '-'}</p>
                        {!user.di && (
                          <p className="text-xs text-red-500 mt-1">⚠️ DI 정보 없음</p>
                        )}
                      </button>
                    ))}
                  </div>
                )}
                {selectedUser && (
                  <div className="mt-2 p-3 bg-blue-50 rounded-md">
                    <p className="text-sm font-medium text-blue-900">
                      선택됨: {selectedUser.nickname || '닉네임 없음'}
                    </p>
                    <p className="text-xs text-blue-700">{selectedUser.phone}</p>
                    {selectedUser.di && (
                      <p className="text-xs text-blue-600 mt-1 break-all">
                        DI: {selectedUser.di.substring(0, 20)}...
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* DI 직접 입력 */}
            {addMethod === 'di' && (
              <div>
                <label className="text-sm font-medium text-gray-700">DI</label>
                <Input
                  value={addDi}
                  onChange={(e) => setAddDi(e.target.value)}
                  placeholder="본인인증 DI 값을 입력하세요"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  DI는 본인인증 시 생성되는 고유 식별값입니다.
                </p>
              </div>
            )}

            {/* 차단 사유 */}
            <div>
              <label className="text-sm font-medium text-gray-700">차단 사유</label>
              <Textarea
                value={addReason}
                onChange={(e) => setAddReason(e.target.value)}
                placeholder="차단 사유를 입력하세요"
                className="mt-1"
                rows={3}
              />
            </div>

            {/* 경고 */}
            <div className="flex gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium">주의사항</p>
                <ul className="mt-1 space-y-1 list-disc list-inside text-xs">
                  <li>블랙리스트 추가 시 해당 사용자의 서비스 이용이 제한됩니다.</li>
                  <li>DI 기반 차단으로 재가입 시에도 차단이 유지됩니다.</li>
                  <li>신중하게 처리해주세요.</li>
                </ul>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleAdd}
              disabled={
                (addMethod === 'di' && !addDi.trim()) ||
                (addMethod === 'user' && !selectedUser) ||
                !addReason.trim()
              }
            >
              블랙리스트 추가
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Confirmation Dialog */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>블랙리스트 해제</DialogTitle>
            <DialogDescription>
              정말로 블랙리스트에서 해제하시겠습니까?
            </DialogDescription>
          </DialogHeader>
          {selectedEntry && (
            <div className="space-y-3 py-4">
              {selectedEntry.user_info && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-md">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-400 to-orange-400 flex items-center justify-center text-white font-medium">
                    {selectedEntry.user_info.nickname?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {selectedEntry.user_info.nickname || '닉네임 없음'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {selectedEntry.user_info.phone || '-'}
                    </p>
                  </div>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-700">차단 사유:</p>
                <p className="text-sm text-gray-900 mt-1">{selectedEntry.reason}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">차단일:</p>
                <p className="text-sm text-gray-900 mt-1">
                  {new Date(selectedEntry.blocked_at).toLocaleString('ko-KR')}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmOpen(false)}>
              취소
            </Button>
            <Button variant="destructive" onClick={handleRemove}>
              해제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

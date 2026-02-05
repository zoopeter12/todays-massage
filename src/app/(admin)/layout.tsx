'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Store,
  CreditCard,
  FileText,
  AlertTriangle,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/toaster';

const menuItems = [
  { href: '/admin', label: '대시보드', icon: LayoutDashboard },
  { href: '/admin/users', label: '회원관리', icon: Users },
  { href: '/admin/shops', label: '매장관리', icon: Store },
  { href: '/admin/settlements', label: '정산관리', icon: CreditCard },
  { href: '/admin/content', label: '콘텐츠관리', icon: FileText },
  { href: '/admin/reports', label: '신고/CS관리', icon: AlertTriangle },
  { href: '/admin/settings', label: '시스템설정', icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminName, setAdminName] = useState<string | null>(null);

  const checkAdminAuthorization = useCallback(async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push('/login');
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, nickname')
        .eq('id', user.id)
        .single();

      if (profileError || profile?.role !== 'admin') {
        router.push('/');
        return;
      }

      setIsAuthorized(true);
      setAdminName(profile.nickname || '관리자');
    } catch (error) {
      console.error('Admin authorization check failed:', error);
      router.push('/');
    } finally {
      setAuthChecking(false);
    }
  }, [router]);

  useEffect(() => {
    checkAdminAuthorization();
  }, [checkAdminAuthorization]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  if (authChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-violet-50 to-pink-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mb-4"></div>
          <div className="text-lg text-gray-600">권한 확인 중...</div>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-violet-50 to-pink-50">
        <div className="text-center">
          <div className="text-red-600 text-xl font-semibold mb-2">접근 권한이 없습니다</div>
          <div className="text-gray-600">메인 페이지로 이동합니다...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-pink-50">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="bg-white shadow-md"
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-40 h-full w-64 bg-white border-r border-gray-200 shadow-lg transition-transform duration-300 ease-in-out',
          'lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-center border-b border-gray-200 bg-gradient-to-r from-violet-600 to-pink-500">
          <h1 className="text-xl font-bold text-white">관리자 콘솔</h1>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/admin' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all',
                  isActive
                    ? 'bg-gradient-to-r from-violet-500 to-pink-500 text-white shadow-md'
                    : 'text-gray-600 hover:bg-violet-50 hover:text-violet-700'
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span>{item.label}</span>
                {isActive && <ChevronRight className="h-4 w-4 ml-auto" />}
              </Link>
            );
          })}
        </nav>

        {/* Admin info and logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white font-semibold">
              {adminName?.charAt(0) || 'A'}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{adminName}</p>
              <p className="text-xs text-gray-500">관리자</p>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full text-gray-600 hover:text-red-600 hover:border-red-300"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            로그아웃
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-64 min-h-screen">
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>

      {/* Toast notifications */}
      <Toaster />
    </div>
  );
}

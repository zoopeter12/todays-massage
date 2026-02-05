'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, Calendar, Store, Settings, Menu, LogIn, ClipboardList, Wallet, BarChart3, Users, UserCog, Clock, Ticket, MessageSquare, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { supabase } from '@/lib/supabase/client';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { name: '대시보드', href: '/partner', icon: Home },
  { name: '예약 관리', href: '/partner/reservations', icon: Calendar },
  { name: '고객 문의', href: '/partner/chat', icon: MessageCircle },
  { name: '코스 관리', href: '/partner/courses', icon: ClipboardList },
  { name: '정산', href: '/partner/settlements', icon: Wallet },
  { name: '통계', href: '/partner/statistics', icon: BarChart3 },
  { name: '고객 관리', href: '/partner/customers', icon: Users },
  { name: '직원 관리', href: '/partner/staff', icon: UserCog },
  { name: '운영시간', href: '/partner/operating-hours', icon: Clock },
  { name: '쿠폰 관리', href: '/partner/coupons', icon: Ticket },
  { name: '리뷰 관리', href: '/partner/reviews', icon: MessageSquare },
  { name: '가게 관리', href: '/partner/shop', icon: Store },
  { name: '설정', href: '/partner/settings', icon: Settings },
];

const mobileNavItems: NavItem[] = [
  { name: '대시보드', href: '/partner', icon: Home },
  { name: '예약', href: '/partner/reservations', icon: Calendar },
  { name: '문의', href: '/partner/chat', icon: MessageCircle },
  { name: '정산', href: '/partner/settlements', icon: Wallet },
  { name: '설정', href: '/partner/settings', icon: Settings },
];

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    }
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session?.user);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Loading state while checking auth
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md px-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  // Not authenticated - show login prompt
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
                <LogIn className="h-8 w-8 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">로그인이 필요합니다</h2>
              <p className="text-sm text-gray-500">
                파트너 센터를 이용하려면 로그인해주세요.
              </p>
              <Link href="/login">
                <Button className="w-full mt-4">
                  <LogIn className="mr-2 h-4 w-4" />
                  로그인하기
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Header */}
      <header className="sticky top-0 z-50 border-b bg-white shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          {/* Logo */}
          <Link href="/partner" className="flex items-center space-x-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-700">
              <Store className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">오늘의마사지</h1>
              <p className="text-xs text-gray-500">파트너 센터</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? 'default' : 'ghost'}
                    className="relative"
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.name}
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* Mobile Menu Button */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <div className="flex flex-col space-y-4 mt-8">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                    >
                      <Button
                        variant={isActive ? 'default' : 'ghost'}
                        className="w-full justify-start"
                      >
                        <item.icon className="mr-2 h-5 w-5" />
                        {item.name}
                      </Button>
                    </Link>
                  );
                })}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl p-4 pb-20 md:pb-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white md:hidden">
        <div className="grid grid-cols-5">
          {mobileNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center py-3 ${
                  isActive ? 'text-blue-600' : 'text-gray-500'
                }`}
              >
                <item.icon className="h-6 w-6" />
                <span className="mt-1 text-xs">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

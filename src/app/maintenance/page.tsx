'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

/**
 * 점검 중 안내 페이지
 *
 * 점검 모드가 활성화되면 일반 사용자가 리다이렉트됨
 * 관리자는 /admin 경로로 우회 가능
 */
export default function MaintenancePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(false);

  // 주기적으로 점검 모드 상태 확인
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/settings/status');
        const data = await res.json();

        if (!data.maintenanceMode) {
          // 점검 모드가 해제되면 홈으로 이동
          router.push('/');
        }
      } catch (error) {
        console.error('Failed to check maintenance status:', error);
      }
    };

    // 30초마다 상태 확인
    const interval = setInterval(checkStatus, 30000);

    return () => clearInterval(interval);
  }, [router]);

  const handleRefresh = async () => {
    setChecking(true);
    try {
      const res = await fetch('/api/settings/status');
      const data = await res.json();

      if (!data.maintenanceMode) {
        router.push('/');
      } else {
        // 아직 점검 중이면 페이지 새로고침
        setTimeout(() => setChecking(false), 1000);
      }
    } catch (error) {
      console.error('Failed to check maintenance status:', error);
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 to-pink-50 p-4">
      <Card className="w-full max-w-md border-none shadow-xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-amber-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            시스템 점검 중
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="space-y-2">
            <p className="text-gray-600">
              현재 시스템 점검이 진행 중입니다.
            </p>
            <p className="text-gray-600">
              불편을 드려 죄송합니다.
            </p>
            <p className="text-sm text-gray-500 mt-4">
              점검이 완료되면 자동으로 이동됩니다.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              onClick={handleRefresh}
              disabled={checking}
              className="w-full bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700"
            >
              {checking ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  확인 중...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  상태 확인
                </>
              )}
            </Button>

            <p className="text-xs text-gray-400">
              문의: support@massage-platform.com
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

/**
 * 알림 권한 요청 버튼 컴포넌트
 */
import React from 'react';
import { Bell, BellOff, BellRing, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useNotification } from './NotificationProvider';

interface NotificationButtonProps {
  /** 버튼 크기 */
  size?: 'default' | 'sm' | 'lg' | 'icon';
  /** 버튼 변형 */
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  /** 알림 개수 표시 여부 */
  showBadge?: boolean;
  /** 클래스명 */
  className?: string;
}

export function NotificationButton({
  size = 'icon',
  variant = 'ghost',
  showBadge = true,
  className,
}: NotificationButtonProps) {
  const {
    permission,
    isLoading,
    requestPermission,
    isSupported,
    unreadCount,
  } = useNotification();

  // 지원하지 않는 브라우저
  if (!isSupported) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={variant}
              size={size}
              className={className}
              disabled
            >
              <BellOff className="h-5 w-5 text-muted-foreground" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>이 브라우저는 푸시 알림을 지원하지 않습니다</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // 로딩 중
  if (isLoading) {
    return (
      <Button
        variant={variant}
        size={size}
        className={className}
        disabled
      >
        <Loader2 className="h-5 w-5 animate-spin" />
      </Button>
    );
  }

  // 권한 거부됨
  if (permission === 'denied') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={variant}
              size={size}
              className={className}
              disabled
            >
              <BellOff className="h-5 w-5 text-destructive" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>알림이 차단되어 있습니다. 브라우저 설정에서 허용해주세요.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // 권한 허용됨
  if (permission === 'granted') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={variant}
              size={size}
              className={`relative ${className}`}
            >
              <Bell className="h-5 w-5" />
              {showBadge && unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>알림이 활성화되어 있습니다</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // 권한 요청 필요
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size={size}
            className={className}
            onClick={requestPermission}
          >
            <BellRing className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>클릭하여 푸시 알림을 활성화하세요</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default NotificationButton;

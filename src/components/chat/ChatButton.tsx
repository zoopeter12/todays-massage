'use client';

import { useRouter } from 'next/navigation';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ChatButtonProps {
  shopId: string;
  shopName?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'icon';
  size?: 'sm' | 'default' | 'lg' | 'icon';
  className?: string;
}

/**
 * Button to start a chat with a shop
 * Used on shop detail pages, search results, etc.
 */
export function ChatButton({
  shopId,
  shopName,
  variant = 'outline',
  size = 'default',
  className,
}: ChatButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/chat/${shopId}`);
  };

  if (size === 'icon' || variant === 'icon') {
    return (
      <Button
        variant="outline"
        size="icon"
        onClick={handleClick}
        className={cn('shrink-0', className)}
        title={shopName ? `${shopName}에 문의하기` : '문의하기'}
      >
        <MessageCircle className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={cn('gap-2', className)}
    >
      <MessageCircle className="h-4 w-4" />
      <span>문의하기</span>
    </Button>
  );
}

/**
 * Floating chat button for shop detail pages
 */
interface FloatingChatButtonProps {
  shopId: string;
  shopName?: string;
}

export function FloatingChatButton({ shopId, shopName }: FloatingChatButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/chat/${shopId}`);
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        'fixed bottom-20 right-4 z-40',
        'flex items-center justify-center',
        'w-14 h-14 rounded-full',
        'bg-blue-500 hover:bg-blue-600 text-white',
        'shadow-lg hover:shadow-xl',
        'transition-all duration-200',
        'active:scale-95'
      )}
      title={shopName ? `${shopName}에 문의하기` : '문의하기'}
    >
      <MessageCircle className="h-6 w-6" />
    </button>
  );
}

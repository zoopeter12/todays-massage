'use client';

import { useState, useRef, useCallback, KeyboardEvent } from 'react';
import { Send, Image, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSend: (message: string) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = '메시지를 입력하세요...',
  maxLength = 1000,
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(async () => {
    if (!message.trim() || isSending || disabled) return;

    try {
      setIsSending(true);
      await onSend(message.trim());
      setMessage('');

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  }, [message, isSending, disabled, onSend]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      // Send on Enter (without Shift)
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      if (value.length <= maxLength) {
        setMessage(value);

        // Auto-resize textarea
        const textarea = e.target;
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
      }
    },
    [maxLength]
  );

  const canSend = message.trim().length > 0 && !isSending && !disabled;

  return (
    <div className="border-t bg-white p-3">
      <div className="flex items-end gap-2">
        {/* Message Input */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isSending}
            className={cn(
              'min-h-[40px] max-h-[120px] resize-none pr-4',
              'rounded-2xl border-gray-200 focus:border-blue-300',
              'text-sm'
            )}
            rows={1}
          />
        </div>

        {/* Send Button */}
        <Button
          type="button"
          size="icon"
          onClick={handleSend}
          disabled={!canSend}
          className={cn(
            'h-10 w-10 rounded-full shrink-0',
            canSend
              ? 'bg-blue-500 hover:bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-400'
          )}
        >
          <Send className={cn('h-5 w-5', isSending && 'animate-pulse')} />
        </Button>
      </div>

      {/* Character count (optional) */}
      {message.length > maxLength * 0.8 && (
        <div className="text-right mt-1">
          <span
            className={cn(
              'text-xs',
              message.length >= maxLength ? 'text-red-500' : 'text-gray-400'
            )}
          >
            {message.length}/{maxLength}
          </span>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Gift, Check, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { findUserByReferralCode } from '@/lib/api/referrals';

interface ReferralCodeInputProps {
  onCodeValidated: (referrerId: string | null) => void;
  disabled?: boolean;
}

export function ReferralCodeInput({ onCodeValidated, disabled }: ReferralCodeInputProps) {
  const searchParams = useSearchParams();
  const refFromUrl = searchParams.get('ref');

  const [code, setCode] = useState(refFromUrl || '');
  const [status, setStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validReferrerId, setValidReferrerId] = useState<string | null>(null);

  // Auto-validate code from URL
  useEffect(() => {
    if (refFromUrl) {
      validateCode(refFromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refFromUrl]);

  const validateCode = async (inputCode: string) => {
    const trimmedCode = inputCode.trim().toUpperCase();

    if (!trimmedCode) {
      setStatus('idle');
      setErrorMessage(null);
      setValidReferrerId(null);
      onCodeValidated(null);
      return;
    }

    if (trimmedCode.length < 6) {
      setStatus('idle');
      return;
    }

    setStatus('checking');
    setErrorMessage(null);

    try {
      const referrer = await findUserByReferralCode(trimmedCode);

      if (referrer) {
        if (referrer.referral_count >= 50) {
          setStatus('invalid');
          setErrorMessage('추천인의 최대 추천 횟수를 초과했습니다.');
          setValidReferrerId(null);
          onCodeValidated(null);
        } else {
          setStatus('valid');
          setValidReferrerId(referrer.id);
          onCodeValidated(referrer.id);
        }
      } else {
        setStatus('invalid');
        setErrorMessage('유효하지 않은 추천 코드입니다.');
        setValidReferrerId(null);
        onCodeValidated(null);
      }
    } catch {
      setStatus('invalid');
      setErrorMessage('추천 코드 확인 중 오류가 발생했습니다.');
      setValidReferrerId(null);
      onCodeValidated(null);
    }
  };

  // Debounce timer ref
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (value.length <= 8) {
      setCode(value);
      setStatus('idle');
      setErrorMessage(null);

      // Clear previous timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      if (value.length >= 6) {
        // Debounce validation
        debounceTimerRef.current = setTimeout(() => validateCode(value), 500);
      } else {
        onCodeValidated(null);
      }
    }
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleClear = () => {
    setCode('');
    setStatus('idle');
    setErrorMessage(null);
    setValidReferrerId(null);
    onCodeValidated(null);
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'checking':
        return <Loader2 className="w-4 h-4 animate-spin text-gray-400" />;
      case 'valid':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'invalid':
        return <X className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getInputClassName = () => {
    const base = 'pl-10 pr-10 uppercase tracking-widest';
    if (status === 'valid') return `${base} border-green-500 focus:ring-green-500`;
    if (status === 'invalid') return `${base} border-red-500 focus:ring-red-500`;
    return base;
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="referral-code" className="flex items-center gap-2">
        <Gift className="w-4 h-4 text-purple-500" />
        추천 코드 (선택)
      </Label>
      <div className="relative">
        <Gift className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          id="referral-code"
          type="text"
          placeholder="추천 코드 입력"
          value={code}
          onChange={handleCodeChange}
          className={getInputClassName()}
          disabled={disabled || status === 'checking'}
          maxLength={8}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {getStatusIcon()}
          {code && status !== 'checking' && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <X className="w-3 h-3 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {status === 'valid' && (
        <p className="text-xs text-green-600 flex items-center gap-1">
          <Check className="w-3 h-3" />
          추천 코드가 확인되었습니다. 첫 예약 완료 시 3,000P가 지급됩니다!
        </p>
      )}

      {errorMessage && (
        <p className="text-xs text-red-600">{errorMessage}</p>
      )}

      {!code && (
        <p className="text-xs text-muted-foreground">
          친구에게 받은 추천 코드가 있다면 입력하세요
        </p>
      )}
    </div>
  );
}

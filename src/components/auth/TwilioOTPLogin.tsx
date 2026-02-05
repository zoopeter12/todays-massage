/**
 * Twilio OTP 로그인 컴포넌트
 *
 * @description
 * 전화번호 기반 OTP 인증을 처리하는 독립형 로그인 컴포넌트입니다.
 * 기존 로그인 페이지를 수정하지 않고 별도로 사용할 수 있습니다.
 *
 * @example
 * ```tsx
 * import { TwilioOTPLogin } from '@/components/auth/TwilioOTPLogin';
 *
 * export default function LoginPage() {
 *   return (
 *     <TwilioOTPLogin
 *       onSuccess={(user) => router.push('/')}
 *       onError={(error) => console.error(error)}
 *     />
 *   );
 * }
 * ```
 */

'use client';

import { useState, useEffect } from 'react';
import { useTwilioOTP } from '@/hooks/use-twilio-otp';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';

interface TwilioOTPLoginProps {
  onSuccess?: (user: { id: string; phone: string }) => void;
  onError?: (error: string) => void;
  /**
   * 회원가입 허용 여부
   * false인 경우 기존 회원만 로그인 가능
   */
  registrationAllowed?: boolean;
}

export function TwilioOTPLogin({ onSuccess, onError, registrationAllowed = true }: TwilioOTPLoginProps) {
  const { sendOTP, verifyOTP, isLoading, error: hookError, clearError } = useTwilioOTP();

  // UI 상태
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'verify'>('phone');
  const [countdown, setCountdown] = useState(0);
  const [devOTP, setDevOTP] = useState<string | null>(null);

  // 카운트다운 타이머
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // 전화번호 포맷팅
  const formatPhoneDisplay = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 7) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneDisplay(e.target.value);
    setPhone(formatted);
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(value);
  };

  // OTP 발송
  const handleSendOTP = async () => {
    clearError();

    if (!phone) {
      onError?.('전화번호를 입력해주세요.');
      return;
    }

    const result = await sendOTP(phone);

    if (result.success) {
      setStep('verify');
      setCountdown(60); // 1분 카운트다운
      setDevOTP(result.otp || null); // 개발 환경에서만 OTP 저장
    } else {
      onError?.(result.error || 'OTP 발송에 실패했습니다.');
    }
  };

  // OTP 검증
  const handleVerifyOTP = async () => {
    clearError();

    if (!code || code.length !== 6) {
      onError?.('인증번호 6자리를 입력해주세요.');
      return;
    }

    const result = await verifyOTP(phone, code, { registrationAllowed });

    if (result.success && result.user) {
      onSuccess?.(result.user);
    } else {
      onError?.(result.error || '인증에 실패했습니다.');
    }
  };

  // 뒤로가기
  const handleBack = () => {
    setStep('phone');
    setCode('');
    clearError();
  };

  // 재발송
  const handleResend = async () => {
    if (countdown > 0) return;
    await handleSendOTP();
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {step === 'phone' ? (
        // 1단계: 전화번호 입력
        <>
          <div className="space-y-2">
            <Label htmlFor="phone">전화번호</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={handlePhoneChange}
              placeholder="010-1234-5678"
              disabled={isLoading}
              maxLength={13} // 010-1234-5678
            />
          </div>

          <Button
            onClick={handleSendOTP}
            disabled={isLoading || !phone}
            className="w-full"
          >
            {isLoading ? '발송 중...' : '인증번호 받기'}
          </Button>
        </>
      ) : (
        // 2단계: OTP 검증
        <>
          <div className="space-y-2">
            <Label htmlFor="code">인증번호</Label>
            <div className="text-sm text-gray-600 mb-2">
              {phone}로 발송된 인증번호를 입력해주세요.
            </div>
            <Input
              id="code"
              type="text"
              inputMode="numeric"
              value={code}
              onChange={handleCodeChange}
              placeholder="123456"
              disabled={isLoading}
              maxLength={6}
              autoFocus
            />

            {/* 개발 환경에서만 OTP 표시 */}
            {devOTP && process.env.NODE_ENV === 'development' && (
              <Alert className="bg-yellow-50 border-yellow-200">
                <div className="text-sm">
                  <strong>개발 모드:</strong> OTP = {devOTP}
                </div>
              </Alert>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={isLoading}
              className="flex-1"
            >
              이전
            </Button>
            <Button
              onClick={handleVerifyOTP}
              disabled={isLoading || code.length !== 6}
              className="flex-1"
            >
              {isLoading ? '확인 중...' : '인증 확인'}
            </Button>
          </div>

          <div className="text-center text-sm text-gray-600">
            {countdown > 0 ? (
              <span>재발송 가능: {countdown}초 후</span>
            ) : (
              <button
                onClick={handleResend}
                className="text-blue-600 hover:underline"
                disabled={isLoading}
              >
                인증번호 재발송
              </button>
            )}
          </div>
        </>
      )}

      {/* 에러 표시 */}
      {hookError && (
        <Alert className="bg-red-50 border-red-200">
          <div className="text-sm text-red-600">{hookError}</div>
        </Alert>
      )}
    </div>
  );
}

/**
 * Twilio OTP 인증 Hook
 *
 * @description
 * 전화번호 기반 OTP 인증을 위한 React Hook입니다.
 * 기존 로그인 페이지를 수정하지 않고, 별도 컴포넌트에서 사용 가능합니다.
 *
 * @example
 * ```tsx
 * const { sendOTP, verifyOTP, isLoading, error } = useTwilioOTP();
 *
 * // OTP 발송
 * await sendOTP('010-1234-5678');
 *
 * // OTP 검증
 * const result = await verifyOTP('010-1234-5678', '123456');
 * if (result.success) {
 *   // 로그인 성공
 * }
 * ```
 */

import { useState } from 'react';
import { getSupabase } from '@/lib/supabase/client';

export interface SendOTPResult {
  success: boolean;
  message?: string;
  error?: string;
  otp?: string; // 개발 환경에서만 포함
}

export interface VerifyOTPResult {
  success: boolean;
  message?: string;
  error?: string;
  user?: {
    id: string;
    phone: string;
  };
  session?: {
    access_token: string;
    refresh_token: string;
  } | null;
}

export function useTwilioOTP() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * OTP 발송
   */
  const sendOTP = async (phone: string): Promise<SendOTPResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/twilio/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'OTP 발송에 실패했습니다.');
        return {
          success: false,
          error: data.error || 'OTP 발송에 실패했습니다.',
        };
      }

      return {
        success: true,
        message: data.message,
        otp: data.otp, // 개발 환경에서만 포함
      };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '네트워크 오류가 발생했습니다.';
      setError(errorMessage);

      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * OTP 검증
   * @param phone 전화번호
   * @param code 인증번호
   * @param options 옵션
   * @param options.registrationAllowed 회원가입 허용 여부 (기본값: true)
   */
  const verifyOTP = async (
    phone: string,
    code: string,
    options?: { registrationAllowed?: boolean }
  ): Promise<VerifyOTPResult> => {
    const { registrationAllowed = true } = options || {};
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/twilio/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone, code, registrationAllowed }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || '인증에 실패했습니다.');
        return {
          success: false,
          error: data.error || '인증에 실패했습니다.',
        };
      }

      // 서버에서 세션 토큰을 받은 경우 Supabase에 세션 설정
      if (data.session?.access_token && data.session?.refresh_token) {
        try {
          const supabase = getSupabase();
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          });

          if (sessionError) {
            console.error('[Auth] 세션 설정 실패:', sessionError);
            setError('세션 설정에 실패했습니다. 다시 시도해주세요.');
            return {
              success: false,
              error: '세션 설정 실패: ' + sessionError.message,
            };
          }

          // 세션 설정 후 사용자 확인
          const { data: userData, error: userError } = await supabase.auth.getUser();
          if (userError || !userData.user) {
            console.error('[Auth] 사용자 확인 실패:', userError);
            setError('인증 확인에 실패했습니다. 다시 시도해주세요.');
            return {
              success: false,
              error: '인증 확인 실패',
            };
          }

          console.log('[Auth] Supabase 세션 설정 완료, 사용자:', userData.user.id);
        } catch (err) {
          console.error('[Auth] 세션 설정 중 오류:', err);
          setError('세션 설정 중 오류가 발생했습니다.');
          return {
            success: false,
            error: '세션 설정 중 오류',
          };
        }
      }

      return {
        success: true,
        message: data.message,
        user: data.user,
        session: data.session,
      };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '네트워크 오류가 발생했습니다.';
      setError(errorMessage);

      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 에러 초기화
   */
  const clearError = () => {
    setError(null);
  };

  return {
    sendOTP,
    verifyOTP,
    isLoading,
    error,
    clearError,
  };
}

"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TwilioOTPLogin } from "@/components/auth/TwilioOTPLogin";
import { ReferralCodeInput } from "@/components/customer/ReferralCodeInput";
import { createReferral } from "@/lib/api/referrals";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AlertTriangle } from "lucide-react";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [referrerId, setReferrerId] = useState<string | null>(null);
  const [registrationAllowed, setRegistrationAllowed] = useState<boolean | null>(null);

  // URL에서 에러 파라미터 확인 (OAuth 콜백 에러)
  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }
  }, [searchParams]);

  // 회원가입 허용 상태 확인
  useEffect(() => {
    async function checkRegistrationStatus() {
      try {
        const res = await fetch('/api/settings/status');
        const data = await res.json();
        setRegistrationAllowed(data.allowRegistration);
      } catch (error) {
        console.error('Failed to check registration status:', error);
        setRegistrationAllowed(true); // 오류 시 기본값 true
      }
    }
    checkRegistrationStatus();
  }, []);

  // 이미 로그인된 사용자는 즉시 홈으로 리다이렉트
  // isLoading 상태와 관계없이 isAuthenticated가 true이면 바로 리다이렉트
  if (isAuthenticated) {
    if (typeof window !== 'undefined') {
      window.location.href = "/";
    }
    return (
      <div className="flex items-center justify-center px-4 py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600"></div>
      </div>
    );
  }

  // 로딩 중이거나 회원가입 상태 확인 중인 경우 로딩 표시
  if (isLoading || registrationAllowed === null) {
    return (
      <div className="flex items-center justify-center px-4 py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600"></div>
      </div>
    );
  }

  const handleLoginSuccess = async (user: { id: string; phone: string }) => {
    try {
      // 세션이 완전히 설정될 때까지 잠시 대기
      await new Promise(resolve => setTimeout(resolve, 100));

      // Supabase에서 현재 사용자 확인
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      if (!currentUser) {
        console.warn('[Login] 세션 설정 후에도 사용자 없음');
        setError('로그인 처리 중 문제가 발생했습니다. 다시 시도해주세요.');
        return;
      }

      // Check if profile already exists
      const { data: existing } = await supabase
        .from("profiles")
        .select("id, phone")
        .eq("id", currentUser.id)
        .single();

      const isNewUser = !existing;

      if (!existing) {
        await supabase.from("profiles").insert({
          id: currentUser.id,
          phone: user.phone,
          role: "user",
          auth_provider: 'phone',
        });

        // If new user and has referrer, create referral relationship
        if (isNewUser && referrerId) {
          try {
            await createReferral(referrerId, currentUser.id);
          } catch (err) {
            console.error("Failed to create referral:", err);
            // Don't block login on referral failure
          }
        }
      } else if (!existing.phone && user.phone) {
        // 전화번호가 없는 기존 프로필인 경우 업데이트
        await supabase.from("profiles").update({
          phone: user.phone,
          auth_provider: 'phone',
        }).eq("id", currentUser.id);
      }

      // Navigate to home with full page refresh to ensure auth state is updated
      // window.location.href를 사용하여 전체 페이지 새로고침
      // 이렇게 하면 서버에서 쿠키 기반 세션을 다시 검증하고 올바른 상태로 렌더링됨
      window.location.href = "/";
    } catch (err) {
      console.error("Profile creation error:", err);
      setError("프로필 생성 중 오류가 발생했습니다.");
    }
  };

  const handleLoginError = (errorMessage: string) => {
    setError(errorMessage);
  };

  return (
    <div className="flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">환영합니다</CardTitle>
          <CardDescription>
            간편하게 로그인하세요
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* URL 에러 표시 */}
          {error && (
            <p className="text-sm text-destructive text-center" role="alert">
              {error}
            </p>
          )}

          {/* 회원가입 차단 안내 */}
          {!registrationAllowed && (
            <Alert className="bg-amber-50 border-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                현재 신규 회원가입이 일시 중단되었습니다.
                기존 회원만 로그인할 수 있습니다.
              </AlertDescription>
            </Alert>
          )}

          {/* Referral Code Input - 회원가입 허용 시에만 표시 */}
          {registrationAllowed && (
            <ReferralCodeInput
              onCodeValidated={setReferrerId}
              disabled={false}
            />
          )}

          {/* Twilio OTP Login Component */}
          <TwilioOTPLogin
            onSuccess={handleLoginSuccess}
            onError={handleLoginError}
            registrationAllowed={registrationAllowed}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center px-4 py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600"></div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}

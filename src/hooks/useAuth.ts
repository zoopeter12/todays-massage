'use client';

import { useEffect, useState, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { Profile } from '@/types/supabase';

interface UseAuthReturn {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Failed to fetch profile:', error.message);
      setProfile(null);
      return;
    }

    setProfile(data as Profile);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    async function getInitialSession() {
      try {
        const { data: { user: currentUser }, error } = await supabase.auth.getUser();

        // 컴포넌트가 언마운트되었거나 요청이 취소된 경우 무시
        if (!isMounted || abortController.signal.aborted) return;

        if (error || !currentUser) {
          setUser(null);
          setProfile(null);
          return;
        }

        setUser(currentUser);
        await fetchProfile(currentUser.id);
      } catch (err) {
        // AbortError는 정상적인 cleanup이므로 무시
        if (err instanceof Error && err.name === 'AbortError') return;
        console.error('[Auth] getInitialSession error:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // 컴포넌트가 언마운트된 경우 무시
        if (!isMounted) return;

        console.log('[Auth] onAuthStateChange:', event, session?.user?.id);
        const currentUser = session?.user ?? null;

        if (currentUser) {
          // 사용자가 있으면 프로필 로드 완료까지 로딩 상태 유지
          setIsLoading(true);
          setUser(currentUser);
          try {
            await fetchProfile(currentUser.id);
          } catch (err) {
            if (err instanceof Error && err.name === 'AbortError') return;
            console.error('[Auth] fetchProfile error:', err);
          }
          if (isMounted) {
            setIsLoading(false);
          }
        } else {
          setUser(null);
          setProfile(null);
          setIsLoading(false);
        }
      }
    );

    // 페이지 포커스 시 인증 상태 새로고침 - 디바운스 적용
    let visibilityTimeout: NodeJS.Timeout | null = null;
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && isMounted) {
        // 디바운스: 빠른 탭 전환 시 중복 요청 방지
        if (visibilityTimeout) clearTimeout(visibilityTimeout);
        visibilityTimeout = setTimeout(async () => {
          if (!isMounted) return;
          try {
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            if (!isMounted) return;

            // user 상태를 직접 참조하지 않고 currentUser만으로 판단
            if (currentUser) {
              setUser(currentUser);
              await fetchProfile(currentUser.id);
            } else {
              setUser(null);
              setProfile(null);
            }
          } catch (err) {
            if (err instanceof Error && err.name === 'AbortError') return;
            console.error('[Auth] visibilityChange error:', err);
          }
        }, 100);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      abortController.abort();
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (visibilityTimeout) clearTimeout(visibilityTimeout);
    };
  }, [fetchProfile]); // user 의존성 제거 - 무한 루프 방지

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }, []);

  return {
    user,
    profile,
    isLoading,
    isAuthenticated: !!user,
    logout,
  };
}

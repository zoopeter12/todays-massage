'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import {
  Gift,
  Coins,
  Ticket,
  AlertCircle,
  Clock,
  Sparkles,
  Trophy,
  History,
  ChevronRight,
  X,
} from 'lucide-react';
import {
  fetchRouletteRewards,
  checkRouletteEligibility,
  spinRoulette,
  fetchRouletteHistory,
} from '@/lib/api/roulette';
import { useAuth } from '@/hooks/useAuth';
import type { RouletteReward, SpinResult } from '@/types/roulette';

const ROULETTE_SIZE = 320;
const SPIN_DURATION = 5000; // 5초

export default function RoulettePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isSpinning, setIsSpinning] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [spinResult, setSpinResult] = useState<SpinResult | null>(null);
  const [rotation, setRotation] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const controls = useAnimation();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 보상 목록 조회
  const { data: rewards = [], isLoading: rewardsLoading } = useQuery({
    queryKey: ['rouletteRewards'],
    queryFn: fetchRouletteRewards,
  });

  // 참여 가능 여부 조회
  const { data: eligibility, isLoading: eligibilityLoading } = useQuery({
    queryKey: ['rouletteEligibility', user?.id],
    queryFn: () => checkRouletteEligibility(user!.id),
    enabled: !!user,
    refetchInterval: 60000, // 1분마다 갱신
  });

  // 참여 기록 조회
  const { data: historyData } = useQuery({
    queryKey: ['rouletteHistory', user?.id],
    queryFn: () => fetchRouletteHistory(user!.id),
    enabled: !!user && showHistory,
  });

  // 룰렛 돌리기
  const spinMutation = useMutation({
    mutationFn: () => spinRoulette(user!.id),
    onMutate: () => {
      setIsSpinning(true);
      setShowResult(false);
    },
    onSuccess: async (result) => {
      setSpinResult(result);

      if (result.success && result.reward) {
        // 당첨된 보상의 인덱스 찾기
        const rewardIndex = rewards.findIndex((r) => r.id === result.reward!.id);
        if (rewardIndex !== -1) {
          // 보상 위치로 회전 (여러 바퀴 회전 후 해당 위치에 멈춤)
          const segmentAngle = 360 / rewards.length;
          const targetAngle = segmentAngle * rewardIndex + segmentAngle / 2;
          const totalRotation = 360 * 5 + (360 - targetAngle); // 5바퀴 + 목표 위치

          await controls.start({
            rotate: rotation + totalRotation,
            transition: {
              duration: SPIN_DURATION / 1000,
              ease: [0.17, 0.67, 0.12, 0.99], // 자연스러운 감속
            },
          });

          setRotation(rotation + totalRotation);
        }
      }

      setTimeout(() => {
        setIsSpinning(false);
        setShowResult(true);
        // 쿼리 갱신
        queryClient.invalidateQueries({ queryKey: ['rouletteEligibility'] });
        queryClient.invalidateQueries({ queryKey: ['pointBalance'] });
        queryClient.invalidateQueries({ queryKey: ['rouletteHistory'] });
      }, SPIN_DURATION);
    },
    onError: () => {
      setIsSpinning(false);
      setSpinResult({
        success: false,
        reward: null,
        message: '오류가 발생했습니다. 다시 시도해주세요.',
      });
      setShowResult(true);
    },
  });

  const handleSpin = useCallback(() => {
    if (isSpinning || !eligibility?.canSpin) return;
    spinMutation.mutate();
  }, [isSpinning, eligibility, spinMutation]);

  // 로딩 상태
  if (rewardsLoading || eligibilityLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600"></div>
      </div>
    );
  }

  // 로그인 필요
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <AlertCircle className="w-16 h-16 mx-auto text-amber-500" />
          <h2 className="text-xl font-bold">로그인이 필요합니다</h2>
          <p className="text-gray-600">룰렛 이벤트에 참여하려면 로그인해주세요.</p>
        </div>
      </div>
    );
  }

  // 보상이 없을 때
  if (rewards.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <Gift className="w-16 h-16 mx-auto text-gray-400" />
          <h2 className="text-xl font-bold">진행 중인 이벤트가 없습니다</h2>
          <p className="text-gray-600">곧 새로운 이벤트로 찾아뵙겠습니다!</p>
        </div>
      </div>
    );
  }

  const segmentAngle = 360 / rewards.length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-purple-800 to-indigo-900 pb-20">
      {/* 별 배경 효과 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.2, 1, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="relative max-w-lg mx-auto px-4 py-8 space-y-8">
        {/* 헤더 */}
        <div className="text-center space-y-2">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-white flex items-center justify-center gap-2"
          >
            <Sparkles className="w-8 h-8 text-yellow-400" />
            행운의 룰렛
            <Sparkles className="w-8 h-8 text-yellow-400" />
          </motion.h1>
          <p className="text-purple-200">매일 1회 무료! 행운을 시험해보세요</p>
        </div>

        {/* 참여 정보 카드 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20"
        >
          <div className="grid grid-cols-3 divide-x divide-white/20 text-center">
            <div className="px-2">
              <div className="text-2xl font-bold text-white">
                {eligibility?.todaySpinCount || 0}/5
              </div>
              <div className="text-xs text-purple-200">오늘 참여</div>
            </div>
            <div className="px-2">
              <div className="text-2xl font-bold text-yellow-400">
                {eligibility?.freeSpinAvailable ? '가능' : '사용'}
              </div>
              <div className="text-xs text-purple-200">무료 참여</div>
            </div>
            <div className="px-2">
              <div className="text-2xl font-bold text-white flex items-center justify-center gap-1">
                <Coins className="w-5 h-5 text-amber-400" />
                {(eligibility?.userPoints ?? 0).toLocaleString()}
              </div>
              <div className="text-xs text-purple-200">보유 포인트</div>
            </div>
          </div>
        </motion.div>

        {/* 룰렛 */}
        <div className="relative flex items-center justify-center">
          {/* 포인터 */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20">
            <div className="w-0 h-0 border-l-[15px] border-r-[15px] border-t-[25px] border-l-transparent border-r-transparent border-t-yellow-400 filter drop-shadow-lg"></div>
          </div>

          {/* 룰렛 휠 */}
          <div className="relative" style={{ width: ROULETTE_SIZE, height: ROULETTE_SIZE }}>
            {/* 외곽 장식 */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: 'conic-gradient(from 0deg, #fbbf24, #f59e0b, #fbbf24, #f59e0b, #fbbf24, #f59e0b, #fbbf24, #f59e0b)',
                padding: 8,
              }}
            >
              <div className="w-full h-full rounded-full bg-purple-900"></div>
            </div>

            {/* 메인 룰렛 */}
            <motion.div
              animate={controls}
              className="absolute inset-2 rounded-full overflow-hidden shadow-2xl"
              style={{
                background: `conic-gradient(${rewards
                  .map(
                    (r, i) =>
                      `${r.color} ${segmentAngle * i}deg ${segmentAngle * (i + 1)}deg`
                  )
                  .join(', ')})`,
              }}
            >
              {/* 세그먼트 라벨 */}
              {rewards.map((reward, index) => {
                const angle = segmentAngle * index + segmentAngle / 2;
                const labelRadius = ROULETTE_SIZE / 2 - 50;

                return (
                  <div
                    key={reward.id}
                    className="absolute left-1/2 top-1/2 text-center"
                    style={{
                      transform: `rotate(${angle}deg) translateY(-${labelRadius}px)`,
                      transformOrigin: '0 0',
                    }}
                  >
                    <div
                      className="flex flex-col items-center text-white font-bold text-xs"
                      style={{ transform: `rotate(${90}deg)` }}
                    >
                      {reward.reward_type === 'points' && (
                        <Coins className="w-5 h-5 mb-1 text-yellow-300" />
                      )}
                      {reward.reward_type === 'coupon' && (
                        <Ticket className="w-5 h-5 mb-1 text-pink-300" />
                      )}
                      {reward.reward_type === 'nothing' && (
                        <X className="w-5 h-5 mb-1 text-gray-300" />
                      )}
                      <span className="drop-shadow-md whitespace-nowrap text-[10px]">
                        {reward.name}
                      </span>
                    </div>
                  </div>
                );
              })}
            </motion.div>

            {/* 중앙 버튼 */}
            <button
              onClick={handleSpin}
              disabled={isSpinning || !eligibility?.canSpin}
              className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                w-20 h-20 rounded-full font-bold text-white text-lg
                transition-all duration-200 z-10
                ${
                  isSpinning
                    ? 'bg-gray-500 cursor-not-allowed'
                    : eligibility?.canSpin
                    ? 'bg-gradient-to-br from-red-500 to-red-700 hover:from-red-400 hover:to-red-600 active:scale-95 shadow-lg hover:shadow-red-500/50'
                    : 'bg-gray-500 cursor-not-allowed'
                }`}
            >
              {isSpinning ? (
                <div className="animate-spin">
                  <Sparkles className="w-8 h-8 mx-auto" />
                </div>
              ) : (
                'SPIN'
              )}
            </button>
          </div>
        </div>

        {/* 참여 버튼 영역 */}
        <div className="space-y-3">
          {eligibility?.freeSpinAvailable ? (
            <button
              onClick={handleSpin}
              disabled={isSpinning}
              className={`w-full py-4 rounded-2xl font-bold text-lg transition-all duration-200
                ${
                  isSpinning
                    ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                    : 'bg-gradient-to-r from-yellow-400 to-amber-500 text-purple-900 hover:from-yellow-300 hover:to-amber-400 active:scale-[0.98] shadow-lg shadow-amber-500/30'
                }`}
            >
              <span className="flex items-center justify-center gap-2">
                <Gift className="w-6 h-6" />
                무료 참여하기
              </span>
            </button>
          ) : (
            <button
              onClick={handleSpin}
              disabled={
                isSpinning ||
                !eligibility?.canSpin ||
                (eligibility?.userPoints || 0) < (eligibility?.pointCost || 0)
              }
              className={`w-full py-4 rounded-2xl font-bold text-lg transition-all duration-200
                ${
                  isSpinning || !eligibility?.canSpin
                    ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-400 hover:to-pink-400 active:scale-[0.98] shadow-lg shadow-purple-500/30'
                }`}
            >
              <span className="flex items-center justify-center gap-2">
                <Coins className="w-6 h-6" />
                {eligibility?.pointCost.toLocaleString()}P로 추가 참여
              </span>
            </button>
          )}

          {!eligibility?.canSpin && (eligibility?.todaySpinCount ?? 0) >= 5 && (
            <div className="flex items-center justify-center gap-2 text-amber-300 text-sm">
              <Clock className="w-4 h-4" />
              <span>오늘 참여 횟수를 모두 사용했습니다</span>
            </div>
          )}
        </div>

        {/* 보상 목록 */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
          <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            보상 목록
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {rewards.map((reward) => (
              <div
                key={reward.id}
                className="flex items-center gap-2 p-2 rounded-xl bg-white/5"
                style={{ borderLeft: `4px solid ${reward.color}` }}
              >
                {reward.reward_type === 'points' && (
                  <Coins className="w-4 h-4 text-amber-400" />
                )}
                {reward.reward_type === 'coupon' && (
                  <Ticket className="w-4 h-4 text-pink-400" />
                )}
                {reward.reward_type === 'nothing' && (
                  <X className="w-4 h-4 text-gray-400" />
                )}
                <span className="text-sm text-white">{reward.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 참여 기록 버튼 */}
        <button
          onClick={() => setShowHistory(true)}
          className="w-full py-3 rounded-xl bg-white/10 text-white font-medium
            hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
        >
          <History className="w-5 h-5" />
          참여 기록 보기
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 결과 모달 */}
      <AnimatePresence>
        {showResult && spinResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowResult(false)}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-sm rounded-3xl p-8 text-center space-y-6
                ${
                  spinResult.success && spinResult.reward?.reward_type !== 'nothing'
                    ? 'bg-gradient-to-br from-yellow-400 via-amber-400 to-orange-500'
                    : 'bg-gradient-to-br from-gray-700 to-gray-800'
                }`}
            >
              {spinResult.success && spinResult.reward?.reward_type !== 'nothing' ? (
                <>
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 0.5, repeat: 3 }}
                  >
                    <Trophy className="w-20 h-20 mx-auto text-white drop-shadow-lg" />
                  </motion.div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-white">축하합니다!</h2>
                    <p className="text-white/90 text-lg">{spinResult.reward?.name}</p>
                    {spinResult.reward?.reward_type === 'points' && (
                      <p className="text-white font-bold text-3xl">
                        +{spinResult.reward.reward_value.toLocaleString()}P
                      </p>
                    )}
                    {spinResult.couponGranted && (
                      <p className="text-white/80 text-sm">쿠폰이 지급되었습니다!</p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-gray-400">
                    <Gift className="w-20 h-20 mx-auto opacity-50" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-white">아쉬워요!</h2>
                    <p className="text-gray-300">다음에 다시 도전해보세요!</p>
                  </div>
                </>
              )}

              {spinResult.newPointBalance !== undefined && (
                <div className="pt-4 border-t border-white/20">
                  <p className="text-sm text-white/80">현재 보유 포인트</p>
                  <p className="text-xl font-bold text-white">
                    {spinResult.newPointBalance.toLocaleString()}P
                  </p>
                </div>
              )}

              <button
                onClick={() => setShowResult(false)}
                className="w-full py-3 rounded-xl bg-white/20 text-white font-semibold
                  hover:bg-white/30 transition-colors"
              >
                확인
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 참여 기록 모달 */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end z-50"
            onClick={() => setShowHistory(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-h-[70vh] bg-white rounded-t-3xl overflow-hidden"
            >
              <div className="sticky top-0 bg-white border-b px-4 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">참여 기록</h2>
                <button
                  onClick={() => setShowHistory(false)}
                  className="p-2 rounded-full hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-y-auto max-h-[calc(70vh-60px)] p-4 space-y-3">
                {historyData?.data && historyData.data.length > 0 ? (
                  historyData.data.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        {item.reward_type === 'points' && (
                          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                            <Coins className="w-5 h-5 text-amber-600" />
                          </div>
                        )}
                        {item.reward_type === 'coupon' && (
                          <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center">
                            <Ticket className="w-5 h-5 text-pink-600" />
                          </div>
                        )}
                        {item.reward_type === 'nothing' && (
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <X className="w-5 h-5 text-gray-500" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{item.reward_name}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(item.created_at).toLocaleDateString('ko-KR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                      {item.cost_points > 0 && (
                        <span className="text-sm text-gray-500">
                          -{item.cost_points}P
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-gray-500">
                    <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>아직 참여 기록이 없습니다</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

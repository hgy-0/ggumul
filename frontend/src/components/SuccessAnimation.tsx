import { useEffect, useState } from 'react';
import { haptic } from '@/utils/haptic';

interface SuccessAnimationProps {
  streak: number;
}

// Confetti 파티클 개수
const CONFETTI_COUNT = 30;

/**
 * 성공 시 축하 애니메이션 컴포넌트.
 * CSS confetti 파티클 효과 + Streak +1 큰 숫자 표시.
 */
export default function SuccessAnimation({ streak }: SuccessAnimationProps) {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // 성공 햅틱 피드백 즉시 실행
    haptic.success();

    // 약간의 딜레이 후 콘텐츠 표시 (confetti가 먼저 시작되도록)
    const timer = setTimeout(() => setShowContent(true), 200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[60vh]">
      {/* Confetti 파티클 */}
      <div className="confetti-container">
        {Array.from({ length: CONFETTI_COUNT }, (_, i) => (
          <div
            key={i}
            className="confetti-piece"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 0.5}s`,
              animationDuration: `${2 + Math.random() * 1.5}s`,
              width: `${6 + Math.random() * 8}px`,
              height: `${6 + Math.random() * 8}px`,
            }}
          />
        ))}
      </div>

      {/* 성공 콘텐츠 */}
      {showContent && (
        <div className="animate-success-bounce text-center z-10">
          {/* 체크마크 */}
          <div className="mb-6">
            <svg
              width="80"
              height="80"
              viewBox="0 0 80 80"
              className="mx-auto"
            >
              <circle
                cx="40"
                cy="40"
                r="36"
                fill="none"
                stroke="#10B981"
                strokeWidth="4"
                className="animate-fade-in"
              />
              <path
                d="M24 40 L34 50 L56 28"
                fill="none"
                stroke="#10B981"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="success-check"
              />
            </svg>
          </div>

          {/* Streak 숫자 */}
          <p className="text-timer-xl gradient-text-primary mb-2">
            {streak}
          </p>
          <p className="text-headline text-neutral-100 mb-2">
            {streak === 1 ? '첫 걸음!' : `${streak}일째 연속 기록`}
          </p>
          <p className="text-body text-neutral-400">
            {streak >= 30
              ? `상위 5%에요! ${streak}일 연속 기록`
              : streak >= 14
              ? `상위 10%에요! ${streak}일 연속 기록`
              : streak >= 7
              ? `상위 20%에요! 일주일 연속 달성`
              : streak >= 3
              ? `좋아요! 3일만 더 가면 습관이 돼요`
              : '좋은 시작이에요!'}
          </p>
        </div>
      )}
    </div>
  );
}

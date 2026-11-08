interface StreakBadgeProps {
  streak: number;
}

/**
 * Streak 뱃지 컴포넌트.
 * 단계별 시각 강도가 달라진다.
 */
export default function StreakBadge({ streak }: StreakBadgeProps) {
  if (streak === 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-surface text-muted border border-border">
        아직 시작 전
      </span>
    );
  }

  // 30일 이상: 최고 강조 (성공 톤)
  if (streak >= 30) {
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-success-500/15 text-success-500 border border-success-500/30 animate-streak-fire">
        🔥 {streak}일째
      </span>
    );
  }

  // 7일 이상: 인디고 강조
  if (streak >= 7) {
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-primary-500/15 text-primary-500 border border-primary-500/30 animate-streak-fire">
        🔥 {streak}일째
      </span>
    );
  }

  // 기본
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-surface text-text-secondary border border-border">
      🔥 {streak}일째
    </span>
  );
}

import { useGoalStore } from '@/stores/goalStore';

/**
 * Streak Widget for Header
 * 상단 헤더에 표시되는 전체 Streak 현황
 * Duolingo의 Streak 카운터에서 영감을 받음
 */
export default function StreakWidget() {
  const { goals } = useGoalStore();

  // 활성 Streak가 있는 목표들
  const activeStreaks = goals.filter(g => g.current_streak > 0);
  const maxStreak = Math.max(...activeStreaks.map(g => g.current_streak), 0);

  // Streak가 없으면 표시하지 않음
  if (activeStreaks.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20">
      {/* 불꽃 아이콘 */}
      <div className="flex items-center gap-1">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          className="text-primary-400"
        >
          <path
            d="M12 2C12 2 7 6 7 12C7 15.31 9.69 18 13 18C16.31 18 19 15.31 19 12C19 9 17 7 17 7C17 7 17 9 15 9C15 9 15 4 12 2Z"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="text-sm font-bold text-primary-300">
          {maxStreak}
        </span>
      </div>

      {/* 구분선 */}
      {activeStreaks.length > 1 && (
        <>
          <div className="w-px h-4 bg-primary-500/30" />
          <span className="text-xs text-primary-400/80">
            {activeStreaks.length}개 진행 중
          </span>
        </>
      )}
    </div>
  );
}

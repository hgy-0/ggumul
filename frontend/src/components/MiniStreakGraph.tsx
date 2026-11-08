import type { DailyAttemptStat } from '@/api/goals';

interface MiniStreakGraphProps {
  dailyStats: DailyAttemptStat[];
}

/**
 * 깃허브 잔디 스타일의 미니 7일 그래프
 * - 시도 안 함: 투명한 회색 border
 * - 면제(쉬는 날): 연한 파랑
 * - 시도했지만 실패: 연한 빨강
 * - 성공: primary 색상
 */
export default function MiniStreakGraph({ dailyStats }: MiniStreakGraphProps) {
  return (
    <div className="flex items-center gap-1">
      {dailyStats.map((stat, index) => {
        // 상태 결정
        let cellClass = '';
        if (!stat.attempted) {
          // 시도 안 함 - 빈 칸
          cellClass = 'bg-border/30 border border-border/50';
        } else if (stat.exempt) {
          // 면제(쉬는 날) - 연한 파랑
          cellClass = 'bg-primary-500/30 border border-primary-500/40';
        } else if (stat.success) {
          // 성공 - primary 색상
          cellClass = 'bg-primary-500';
        } else {
          // 실패 - 연한 빨강
          cellClass = 'bg-danger-500/40';
        }

        return (
          <div
            key={index}
            className={`w-3 h-3 rounded-sm ${cellClass} transition-all`}
            title={stat.date}
          />
        );
      })}
    </div>
  );
}

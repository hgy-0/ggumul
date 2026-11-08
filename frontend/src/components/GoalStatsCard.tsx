import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getGoalStats, type GoalStats } from '@/api/goals';
import MiniStreakGraph from './MiniStreakGraph';

interface GoalStatsCardProps {
  goalId: number;
  goalName: string;
}

/**
 * 목표별 통계 카드
 * - 현재 streak / 최고 streak
 * - 성공률 / 시도 횟수
 * - 7일 미니 그래프
 */
export default function GoalStatsCard({ goalId, goalName }: GoalStatsCardProps) {
  const navigate = useNavigate();
  const [stats, setStats] = useState<GoalStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [goalId]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await getGoalStats(goalId);
      setStats(data);
    } catch (err) {
      console.error('Failed to load goal stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-surface rounded-xl p-3 border border-border animate-pulse">
        <div className="h-3 bg-bg rounded w-24 mb-2"></div>
        <div className="h-6 bg-bg rounded w-16"></div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <button
      onClick={() => navigate(`/goals/${goalId}/insights`)}
      className="w-full bg-surface rounded-xl p-3 border border-border hover:border-primary-500/30 transition-all cursor-pointer text-left active:scale-[0.98]"
    >
      {/* 상단: 이름 + 7일 그래프 */}
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <h3 className="text-sm font-semibold text-text truncate flex-1">
          {goalName}
        </h3>
        <MiniStreakGraph dailyStats={stats.daily_stats} />
      </div>

      {/* 하단: Streak와 성공률 2열 */}
      <div className="flex items-center justify-between gap-4">
        {/* 좌측: Streak */}
        <div>
          <div className="flex items-baseline gap-1.5 mb-0.5">
            <span className="text-2xl font-bold text-primary-500">
              {stats.current_streak}
            </span>
            <span className="text-xs text-muted">일 연속</span>
          </div>
          <div className="text-xs text-muted">
            최고기록 {stats.best_streak}일
          </div>
        </div>

        {/* 우측: 성공률 */}
        <div className="text-right">
          {stats.total_attempts > 0 ? (
            <>
              <div className="flex items-baseline gap-1 justify-end mb-0.5">
                <span className="text-xs text-muted">성공률</span>
                <span className="text-base font-semibold text-text">
                  {Math.round(stats.success_rate * 100)}%
                </span>
              </div>
              <div className="text-xs text-muted">
                {stats.total_successes}/{stats.total_attempts} 성공
              </div>
            </>
          ) : (
            <div className="text-xs text-muted">아직 시도 없음</div>
          )}
        </div>
      </div>
    </button>
  );
}

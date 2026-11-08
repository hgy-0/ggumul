import { useEffect, useState } from 'react';
import { getTodayStats, getMyStats } from '@/api/stats';
import { useGoalStore } from '@/stores/goalStore';
import WeeklyBarChart from './WeeklyBarChart';
import GoalStatsCard from './GoalStatsCard';

interface TodayStats {
  date: string;
  total_successes: number;
  total_attempts: number;
  success_rate: number;
  unique_devices: number;
}

interface DailyStatItem {
  date: string;
  attempts: number;
  successes: number;
}

interface MyStats {
  device_id: string;
  period_days: number;
  total_attempts: number;
  total_successes: number;
  success_rate: number;
  average_success_rate: number;
  daily_stats: DailyStatItem[];  // 🆕 추가
  comparison: {
    difference: number;
    percentage_better: number;
  };
}

export default function StatsDashboard() {
  const [todayStats, setTodayStats] = useState<TodayStats | null>(null);
  const [myStats, setMyStats] = useState<MyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { goals } = useGoalStore();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const [today, my] = await Promise.all([getTodayStats(), getMyStats()]);
      setTodayStats(today);
      setMyStats(my);
    } catch (err) {
      console.error('Failed to load stats:', err);
      setError('통계를 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const getEncouragementMessage = () => {
    if (!myStats) return '';

    const myRate = myStats.success_rate;
    const avgRate = myStats.average_success_rate;
    const diff = myStats.comparison.percentage_better;
    const attempts = myStats.total_attempts;
    const successes = myStats.total_successes;

    // 둘 다 100%인 경우
    if (myRate >= 1.0 && avgRate >= 1.0) {
      return '🎉 완벽해요! 모두가 함께 최고의 성과를 내고 있어요!';
    }

    // 내가 100%인 경우
    if (myRate >= 1.0) {
      return `🏆 ${attempts}번 모두 성공! 완벽한 한 주였어요!`;
    }

    // 평균이 0%인 경우 (아무도 시도 안함)
    if (avgRate === 0 && myRate > 0) {
      return `🚀 이번 주 ${successes}번 성공! 첫 번째 도전자예요!`;
    }

    // 일반적인 경우 - 개인화된 메시지
    if (diff > 20) {
      return `🔥 ${successes}번이나 성공했어요! 정말 잘하고 있어요!`;
    }
    if (diff > 0) {
      return `💪 ${successes}번 성공! 평균보다 높아요. 멋져요!`;
    }
    if (diff > -10) {
      return `⚡ ${successes}번 성공했어요. 조금만 더 하면 평균을 넘어요!`;
    }
    if (successes > 0) {
      return `🌱 ${successes}번 성공! 천천히 해도 괜찮아요. 성장 중이에요!`;
    }
    return '🌱 이번 주는 쉬어가는 시간이었네요. 괜찮아요!';
  };

  if (loading) {
    return (
      <div className="bg-surface rounded-2xl p-6 mb-6 animate-pulse shadow-sm border border-border">
        <div className="h-6 bg-bg rounded w-32 mb-4"></div>
        <div className="h-20 bg-bg rounded mb-4"></div>
        <div className="h-16 bg-bg rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-danger-500/10 border border-danger-500/20 rounded-2xl p-5 mb-6 text-center shadow-sm">
        <p className="text-sm text-danger-500 mb-3">{error}</p>
        <button
          onClick={loadStats}
          className="px-4 py-2 rounded-xl bg-surface text-text text-sm hover:bg-bg transition-colors border border-border"
        >
          다시 불러오기
        </button>
      </div>
    );
  }

  if (!todayStats || !myStats) return null;

  return (
    <>
      {/* 전체 통계 */}
      <div className="bg-surface backdrop-blur-sm rounded-2xl p-6 mb-6 border border-border shadow-sm">
        <h2 className="text-lg font-bold text-text mb-4">📈 최근 7일 성과</h2>

      {myStats.total_attempts > 0 ? (
        <>
          {/* 모바일: 세로 배치 / 데스크톱: 좌우 분할 (화면 클수록 그래프 비중 증가) */}
          <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr] md:grid-cols-[5fr_2fr] lg:grid-cols-[3fr_1fr] gap-6 mb-6">
            {/* 좌측: 막대 그래프 영역 */}
            <div className="overflow-hidden">
              <WeeklyBarChart dailyStats={myStats.daily_stats} />
            </div>

            {/* 우측: 지표 카드 영역 */}
            <div className="flex flex-col gap-4">
              {/* 성공률 카드 */}
              <div className="bg-bg/50 rounded-xl p-4 border border-border">
                <div className="text-sm text-muted mb-1">
                  {myStats.total_successes}번 성공 / {myStats.total_attempts}번 시도
                </div>
                <div className="text-4xl sm:text-5xl font-bold text-primary-500">
                  {Math.round(myStats.success_rate * 100)}%
                </div>
              </div>

              {/* 평균 비교 - 따뜻한 표현 */}
              {myStats.average_success_rate > 0 && (
                <div className="space-y-2">
                  <div className="py-2 px-3 rounded-lg bg-bg/30">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted">전체 평균</span>
                      <span className="text-sm font-semibold text-text-secondary">
                        {Math.round(myStats.average_success_rate * 100)}%
                      </span>
                    </div>
                    {myStats.comparison.difference !== 0 && (
                      <div className="text-xs">
                        {myStats.comparison.difference > 0 ? (
                          <span className="text-primary-500 font-medium">
                            평균보다 {Math.abs(Math.round(myStats.comparison.percentage_better))}% 높아요 ✨
                          </span>
                        ) : myStats.comparison.difference > -10 ? (
                          <span className="text-text-secondary">
                            평균까지 {Math.abs(Math.round(myStats.comparison.percentage_better))}% 남았어요
                          </span>
                        ) : (
                          <span className="text-muted">
                            지금은 성장 중이에요 🌱
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 격려 메시지 */}
              <div className="p-3 bg-gradient-to-r from-primary-500/10 to-primary-600/5 border border-primary-500/20 rounded-lg">
                <p className="text-sm font-medium text-text text-center">
                  {getEncouragementMessage()}
                </p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-8 text-muted">
          최근 7일간 시도한 기록이 없어요
        </div>
      )}

      {/* 오늘 전체 통계 - 작게, 맨 아래 */}
      <div className="mt-6 pt-4 border-t border-border">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">오늘 전체</span>
          <span className="text-text-secondary font-medium">
            {todayStats.total_successes}명 시작 · {todayStats.unique_devices}명 참여중
          </span>
        </div>
      </div>
      </div>

      {/* 목표별 통계 */}
      {goals.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-text mb-4">🎯 목표별 현황</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {goals.map((goal) => (
              <GoalStatsCard
                key={goal.id}
                goalId={goal.id}
                goalName={goal.name}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}

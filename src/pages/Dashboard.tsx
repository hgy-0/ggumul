import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useGoalStore } from '@/stores/goalStore';
import GoalCard from '@/components/GoalCard';
import { isOnboardingDone } from '@/pages/Onboarding';
import { getUnreadCheers, markCheersAsRead, type Cheer } from '@/api/friends';
import { haptic } from '@/utils/haptic';

/**
 * 대시보드 (홈) 페이지.
 * 등록된 목표 목록을 표시하고, 목표가 없으면 빈 상태 화면을 보여준다.
 */
export default function Dashboard() {
  const { goals, loading, error, fetchGoals } = useGoalStore();
  const [cheers, setCheers] = useState<Cheer[]>([]);

  useEffect(() => {
    fetchGoals();
    getUnreadCheers().then(setCheers).catch(() => {});
  }, [fetchGoals]);

  const handleDismissCheers = async () => {
    haptic.light();
    const ids = cheers.map((c) => c.id);
    setCheers([]);
    await markCheersAsRead(ids).catch(() => {});
  };

  // 첫 방문 시 온보딩으로 리다이렉트
  if (!isOnboardingDone()) {
    return <Navigate to="/onboarding" replace />;
  }

  // 오늘 완료한 목표 수
  const completedToday = goals.filter((g) => g.today_success).length;

  return (
    <div className="relative min-h-[70vh]">
      {/* 응원 배너 */}
      {cheers.length > 0 && (
        <div className="mb-4 p-4 rounded-2xl bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-500/10 dark:to-primary-600/5 border border-primary-200 dark:border-primary-500/20 animate-slide-up">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{cheers[0].emoji}</span>
              <p className="text-sm font-medium text-text">
                {cheers.length === 1
                  ? `${cheers[0].from_nickname || '친구'}님이 응원을 보냈어요!`
                  : `${cheers[0].from_nickname || '친구'}님 외 ${cheers.length - 1}명이 응원을 보냈어요!`}
              </p>
            </div>
            <button
              onClick={handleDismissCheers}
              className="px-3 py-1.5 rounded-lg bg-primary-500/10 hover:bg-primary-500/20 text-xs font-medium text-primary-600 dark:text-primary-400 transition-colors"
            >
              확인
            </button>
          </div>
        </div>
      )}

      {/* 로딩 상태 */}
      {loading && goals.length === 0 && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 rounded-2xl bg-surface/50 animate-pulse shadow-sm border border-border" />
          ))}
        </div>
      )}

      {/* 에러 상태 */}
      {error && (
        <div className="rounded-2xl bg-danger-500/10 border border-danger-500/20 p-5 text-center shadow-sm">
          <p className="text-sm text-danger-500 mb-3">{error}</p>
          <button
            onClick={fetchGoals}
            className="px-4 py-2 rounded-xl bg-surface text-text text-sm hover:bg-bg transition-colors border border-border"
          >
            다시 불러오기
          </button>
        </div>
      )}

      {/* 빈 상태 */}
      {!loading && !error && goals.length === 0 && (
        <div className="flex flex-col items-center justify-center min-h-[65vh] text-center px-4">
          {/* 일러스트 */}
          <div className="relative mb-8">
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-primary-500/20 to-primary-600/5 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500/30 to-primary-600/10 flex items-center justify-center">
                <span className="text-5xl">🚀</span>
              </div>
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary-500/20 animate-ping" />
          </div>

          <h2 className="text-2xl font-bold text-text mb-3">
            아직 목표가 없어요
          </h2>
          <p className="text-base text-muted mb-8 leading-relaxed">
            작은 행동 하나면 충분해요<br />
            지금 바로 등록해보세요
          </p>
          <Link
            to="/goals/new"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-primary-500 hover:bg-primary-600 text-white font-semibold transition-all active:scale-95 shadow-lg"
          >
            목표 등록하기
          </Link>
        </div>
      )}

      {/* 목표 목록 */}
      {goals.length > 0 && (
        <div className="pb-20">
          {/* 상단 헤드라인 */}
          <div className="mb-8">
            {/* 메인 메시지 - 크고 굵게 */}
            <h1 className="text-3xl font-extrabold text-text mb-3 leading-tight">
              {completedToday > 0
                ? `오늘 ${completedToday}개 완료! 🎉`
                : goals.some(g => g.current_streak > 0)
                ? '연속 기록 이어가기'
                : '오늘의 시작'}
            </h1>

            {/* 보조 메시지 - 작고 가볍게 */}
            <p className="text-base text-muted leading-relaxed">
              {completedToday > 0
                ? `계속 이어가세요! ${goals.length - completedToday}개 남았어요`
                : '작은 행동 하나면 충분해요'}
            </p>
          </div>

          {/* 1순위 목표 안내 - 분리된 섹션으로 */}
          {(() => {
            const topPriorityGoal = goals.find(g => g.is_top_priority && !g.today_success);
            return topPriorityGoal ? (
              <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-500/10 dark:to-primary-600/5 border border-primary-200 dark:border-primary-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wide">추천</span>
                </div>
                <p className="text-sm text-text font-medium">
                  <span className="text-primary-700 dark:text-primary-300 font-bold">{topPriorityGoal.name}</span>부터 시작해보세요
                </p>
              </div>
            ) : null;
          })()}

          {/* 목표 목록 */}
          <div className="space-y-3 mb-6">
            {goals.map((goal, i) => (
              <div
                key={goal.id}
                className="animate-slide-up"
                style={{ animationDelay: `${Math.min(i * 60, 300)}ms` }}
              >
                <GoalCard goal={goal} />
              </div>
            ))}
          </div>

          {/* 하단 동기부여 - 부드럽게 */}
          {completedToday === goals.length ? (
            <div className="text-center py-4">
              <p className="text-sm text-muted">
                오늘 목표를 모두 달성했어요! <Link to="/stats" className="text-primary-500 hover:text-primary-600 font-medium transition-colors">통계</Link>에서 확인해보세요 ✨
              </p>
            </div>
          ) : completedToday > 0 && (
            <div className="bg-surface/50 rounded-xl p-4 border border-border">
              <p className="text-sm text-muted text-center">
                좋아요! {goals.length - completedToday}개 남았어요 💪
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

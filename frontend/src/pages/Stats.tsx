import { Link } from 'react-router-dom';
import { useGoalStore } from '@/stores/goalStore';
import { useEffect } from 'react';
import StatsDashboard from '@/components/StatsDashboard';
import FriendsList from '@/components/FriendsList';

/**
 * 통계 페이지
 * 전체 통계 대시보드 + 친구 현황을 표시
 */
export default function Stats() {
  const { goals, fetchGoals } = useGoalStore();

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  // 오늘 아직 안한 목표가 있는지
  const hasIncompleteToday = goals.some(g => !g.today_success);

  return (
    <div className="pb-20 space-y-8">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-text mb-2">
          나의 통계
        </h1>
        <p className="text-sm text-muted">
          목표별 성공률과 친구들 현황을 확인하세요
        </p>
      </div>

      {/* 내 통계 대시보드 */}
      <div>
        <h2 className="text-lg font-semibold text-text mb-4">📊 내 성과</h2>
        <StatsDashboard />
      </div>

      {/* CTA 섹션 - 부드럽게 */}
      {hasIncompleteToday && (
        <div className="bg-surface/50 rounded-2xl p-5 border border-border">
          <p className="text-sm text-muted mb-3">
            통계를 확인했으니 <Link to="/" className="text-primary-500 hover:text-primary-600 font-medium transition-colors">오늘 목표</Link>를 실천해볼까요?
          </p>
        </div>
      )}

      {/* 친구들 현황 */}
      <div>
        <h2 className="text-lg font-semibold text-text mb-4">👥 친구들 현황</h2>
        <FriendsList />
      </div>
    </div>
  );
}

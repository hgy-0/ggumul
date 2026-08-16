import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getInsights } from '@/api/insights';
import { getGoal } from '@/api/goals';
import InsightChart from '@/components/InsightChart';
import StreakBadge from '@/components/StreakBadge';
import type { InsightData, Goal } from '@/types';

/**
 * 인사이트 페이지.
 * 특정 목표의 성공률, Streak, 실패 이유, 요일별 통계, 팁을 표시한다.
 */
export default function Insights() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const goalId = Number(id);

  const [goal, setGoal] = useState<Goal | null>(null);
  const [data, setData] = useState<InsightData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [goalData, insightData] = await Promise.all([
          getGoal(goalId),
          getInsights(goalId),
        ]);
        setGoal(goalData);
        setData(insightData);
      } catch {
        setError('데이터를 불러오지 못했어요');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [goalId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-20 w-full" />
        <div className="skeleton h-40 w-full" />
        <div className="skeleton h-40 w-full" />
      </div>
    );
  }

  if (error || !data || !goal) {
    return (
      <div className="card p-6 text-center">
        <p className="text-caption text-muted mb-3">
          {error || '아직 데이터가 없어요'}
        </p>
        <button onClick={() => navigate('/')} className="btn-secondary btn-sm">
          돌아가기
        </button>
      </div>
    );
  }

  // 성공률 원형 표시 계산 (백엔드가 0~100 범위로 반환)
  const successPercent = Math.round(data.success_rate);
  const circumference = 2 * Math.PI * 45;
  const successOffset = circumference * (1 - data.success_rate / 100);

  return (
    <div className="space-y-6 animate-slide-up">
      {/* 헤더 */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="btn-ghost btn-sm mb-3 -ml-2"
        >
          ← 뒤로
        </button>
        <h2 className="text-headline text-text">{goal.name}</h2>
        <p className="text-caption text-muted">전체 기간 통계</p>
      </div>

      {/* Streak 카드 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4 text-center">
          <p className="text-micro text-muted mb-2">지금 연속</p>
          <StreakBadge streak={goal.current_streak} />
        </div>
        <div className="card p-4 text-center">
          <p className="text-micro text-muted mb-2">최고 기록</p>
          <span className="text-title text-primary-500">
            🏆 {goal.best_streak}일
          </span>
        </div>
      </div>

      {/* 성공률 */}
      <div className="card p-6 flex items-center gap-6">
        {/* 원형 성공률 표시 */}
        <div className="relative flex-shrink-0">
          <svg width="100" height="100" viewBox="0 0 100 100">
            {/* 배경 원 */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              className="stroke-border"
              strokeWidth="6"
            />
            {/* 성공률 원 */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              className="stroke-success-500"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={successOffset}
              transform="rotate(-90 50 50)"
              style={{ transition: 'stroke-dashoffset 1s ease-out' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-title text-success-500">{successPercent}%</span>
          </div>
        </div>

        <div>
          <p className="text-body text-text mb-1">
            총 <strong>{data.total_attempts}</strong>회 시도
          </p>
          <p className="text-caption text-muted">
            {data.success_count}회 성공
          </p>
        </div>
      </div>

      {/* 실패 이유별 차트 */}
      <InsightChart
        title="왜 못했을까?"
        data={data.failure_by_reason}
        colorClass="gradient-danger"
      />

      {/* 요일별 실패 차트 */}
      <InsightChart
        title="요일별 패턴"
        data={data.failure_by_day_of_week}
        colorClass="gradient-primary"
      />

      {/* 면제 통계 차트 */}
      {data.exempt_count > 0 && (
        <InsightChart
          title="면제 사유"
          data={data.exempt_by_reason}
          colorClass="gradient-primary"
        />
      )}

      {/* 팁 */}
      {data.tips.length > 0 && (
        <div className="card p-4">
          <h4 className="text-caption text-muted mb-3">이렇게 해보세요</h4>
          <ul className="space-y-2">
            {data.tips.map((tip, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-caption text-text-secondary"
              >
                <span className="text-primary-500 flex-shrink-0">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 하단 여백 */}
      <div className="h-4" />
    </div>
  );
}

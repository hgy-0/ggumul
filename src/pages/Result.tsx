import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { createAttempt, useRevivalCard } from '@/api/attempts';
import { getGoal } from '@/api/goals';
import { useGoalStore } from '@/stores/goalStore';
import { getTodayString } from '@/utils/dateUtils';
import SuccessAnimation from '@/components/SuccessAnimation';
import FailureModal from '@/components/FailureModal';
import RevivalModal from '@/components/RevivalModal';
import type { Goal, FailureReason } from '@/types';

/**
 * 결과 페이지.
 * ?success=true  → 성공 애니메이션 + Streak 표시
 * ?success=false → 실패 모달 (부활 카드 보유 시 부활 모달도 표시)
 */
export default function Result() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const goalId = Number(id);
  const isSuccess = searchParams.get('success') === 'true';

  const { fetchGoals } = useGoalStore();

  const [goal, setGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);
  const [recorded, setRecorded] = useState(false);
  const [showRevivalModal, setShowRevivalModal] = useState(false);
  const [showFailureModal, setShowFailureModal] = useState(false);

  // 목표 데이터 로드
  useEffect(() => {
    const load = async () => {
      try {
        const data = await getGoal(goalId);
        setGoal(data);
      } catch {
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [goalId, navigate]);

  // 성공 시 자동 기록
  useEffect(() => {
    if (!isSuccess || recorded || !goal) return;

    const record = async () => {
      try {
        await createAttempt(goalId, {
          attempted_date: getTodayString(),
          success: true,
        });
        setRecorded(true);
        await fetchGoals();
        // 최신 목표 데이터 다시 로드 (streak 업데이트 반영)
        const updated = await getGoal(goalId);
        setGoal(updated);
      } catch (err: unknown) {
        // 409 = 이미 기록된 경우 — 정상 처리로 간주
        const isConflict =
          err instanceof Error && 'response' in err &&
          (err as { response?: { status?: number } }).response?.status === 409;
        if (isConflict) {
          setRecorded(true);
          const updated = await getGoal(goalId);
          setGoal(updated);
        }
      }
    };
    record();
  }, [isSuccess, recorded, goal, goalId, fetchGoals]);

  // 실패 시 모달 표시
  useEffect(() => {
    if (isSuccess || !goal) return;
    setShowFailureModal(true);
  }, [isSuccess, goal]);

  // 실패 기록 핸들러
  const handleFailureSubmit = useCallback(
    async (reason: FailureReason) => {
      if (!goal) return;

      try {
        await createAttempt(goalId, {
          attempted_date: getTodayString(),
          success: false,
          failure_reason: reason,
        });
        setShowFailureModal(false);

        // 부활 카드 보유 시 부활 모달 표시
        if (goal.revival_cards > 0) {
          setShowRevivalModal(true);
        } else {
          await fetchGoals();
          navigate('/');
        }
      } catch (err) {
        console.error('[Result] 실패 기록 중 오류:', err);
      }
    },
    [goal, goalId, fetchGoals, navigate],
  );

  // 부활 카드 사용 핸들러
  const handleUseRevival = useCallback(async () => {
    try {
      await useRevivalCard(goalId, getTodayString());
      setShowRevivalModal(false);
      await fetchGoals();
      navigate('/');
    } catch (err) {
      console.error('[Result] 부활 카드 사용 중 오류:', err);
    }
  }, [goalId, fetchGoals, navigate]);

  // 부활 카드 미사용 핸들러
  const handleSkipRevival = useCallback(async () => {
    setShowRevivalModal(false);
    await fetchGoals();
    navigate('/');
  }, [fetchGoals, navigate]);

  if (loading || !goal) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="skeleton h-40 w-40 rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-[80vh]">
      {/* 성공 화면 */}
      {isSuccess && (
        <>
          <SuccessAnimation streak={goal.current_streak + (recorded ? 0 : 1)} />
          <div className="text-center mt-8">
            <button
              onClick={() => navigate('/')}
              className="btn-primary btn-lg"
            >
              홈으로
            </button>
          </div>
        </>
      )}

      {/* 실패 모달 */}
      {showFailureModal && (
        <FailureModal
          onSubmit={handleFailureSubmit}
          onClose={() => {
            setShowFailureModal(false);
            navigate('/');
          }}
        />
      )}

      {/* 부활 카드 모달 */}
      {showRevivalModal && (
        <RevivalModal
          remainingCards={goal.revival_cards}
          onUse={handleUseRevival}
          onSkip={handleSkipRevival}
        />
      )}
    </div>
  );
}

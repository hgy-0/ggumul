import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGoalStore } from '@/stores/goalStore';
import { usePushSubscription } from '@/hooks/usePushSubscription';
import type { GoalCreateUpdate } from '@/types';
import { getGoal } from '@/api/goals';
import { ALL_DAYS } from '@/constants/date';
import NotificationSettings from '@/components/NotificationSettings';
import { saveNotificationSchedules, deleteNotificationSchedules } from '@/utils/notificationSchedule';
import { getFCMToken } from '@/utils/fcm';

interface ScheduleEntry {
  hour: number;
  minute: number;
  days: number[];
}

/**
 * 새 목표 등록 / 기존 목표 편집 페이지.
 */
export default function GoalForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const { addGoal, updateGoal, deleteGoal } = useGoalStore();
  const { subscribe: subscribePush } = usePushSubscription();

  // 폼 상태
  const [name, setName] = useState('');
  const [firstAction, setFirstAction] = useState('');
  const [countdownMinutes, setCountdownMinutes] = useState(5);
  const [enableNotification, setEnableNotification] = useState(false);
  const [notificationDays, setNotificationDays] = useState<number[]>([...ALL_DAYS]);
  const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [error, setError] = useState<string | null>(null);
  const [createdGoalId, setCreatedGoalId] = useState<number | null>(null);

  // 편집 모드일 때 기존 데이터 로드
  useEffect(() => {
    if (!isEdit || !id) return;

    const loadGoal = async () => {
      try {
        const goal = await getGoal(Number(id));
        setName(goal.name);
        setFirstAction(goal.first_action);
        setCountdownMinutes(Math.round(goal.countdown_seconds / 60));
        if (goal.notification_schedules && goal.notification_schedules.length > 0) {
          setEnableNotification(true);
          // 첫 스케줄의 요일을 공통 요일로 사용
          setNotificationDays(goal.notification_schedules[0].days);
          setSchedules(
            goal.notification_schedules.map((ns) => ({
              hour: ns.hour,
              minute: ns.minute,
              days: ns.days,
            })),
          );
        }
      } catch {
        navigate('/');
      } finally {
        setInitialLoading(false);
      }
    };

    loadGoal();
  }, [id, isEdit, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !firstAction.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const data: GoalCreateUpdate = {
        name: name.trim(),
        first_action: firstAction.trim(),
        countdown_seconds: countdownMinutes * 60,
        notification_schedules: enableNotification
          ? schedules.map((s) => ({ ...s, days: notificationDays }))
          : [],
      };

      let goalId: number;

      if (isEdit && id) {
        await updateGoal(Number(id), data);
        goalId = Number(id);
      } else {
        const newGoal = await addGoal(data);
        goalId = newGoal.id;
      }

      // 알림이 활성화된 경우 Firestore에 스케줄 저장 (실패해도 목표 저장은 유지)
      try {
        if (enableNotification && schedules.length > 0) {
          await getFCMToken();
          await saveNotificationSchedules(
            goalId,
            name.trim(),
            schedules.map((s) => ({ ...s, days: notificationDays }))
          );
        } else {
          await deleteNotificationSchedules(goalId);
        }
      } catch (err) {
        console.error('[GoalForm] 알림 스케줄 저장 실패 (목표는 저장됨):', err);
      }

      if (isEdit) {
        navigate('/');
      } else {
        setCreatedGoalId(goalId);
      }
    } catch {
      setError('저장에 실패했어요. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!window.confirm('이 목표를 삭제할까요?\n기록도 함께 사라져요.')) return;

    setLoading(true);
    setError(null);
    try {
      // 알림 스케줄 삭제
      await deleteNotificationSchedules(Number(id));

      // 목표 삭제
      await deleteGoal(Number(id));

      navigate('/');
    } catch {
      setError('삭제에 실패했어요. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  // 등록 완료 후 즉시 실행 유도 화면
  if (createdGoalId !== null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-slide-up">
        <div className="w-16 h-16 rounded-full bg-primary-500/15 flex items-center justify-center mb-6">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary-500">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-text mb-2">목표가 등록됐어요!</h2>
        <p className="text-sm text-muted mb-8 text-center">
          동기가 가장 높은 지금,<br />바로 시작해볼까요?
        </p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={() => navigate(`/goals/${createdGoalId}/countdown`)}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary-500 to-primary-600 text-white text-lg font-bold transition-all active:scale-95 shadow-lg shadow-primary-500/20"
          >
            지금 바로 시작하기
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 rounded-xl text-muted text-sm hover:text-text transition-colors"
          >
            나중에 할게요
          </button>
        </div>
      </div>
    );
  }

  if (initialLoading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-12 w-full" />
        <div className="skeleton h-12 w-full" />
        <div className="skeleton h-12 w-full" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-slide-up">
      <h2 className="text-headline text-text">
        {isEdit ? '목표 수정' : '목표 등록'}
      </h2>

      {/* 목표명 */}
      <div>
        <label className="block text-caption text-muted mb-2">무엇을 시작하고 싶으세요?</label>
        <input
          type="text"
          className="input"
          placeholder="운동, 독서, 코딩..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={50}
        />
      </div>

      {/* 첫 행동 */}
      <div>
        <label className="block text-caption text-muted mb-2">가장 작은 첫 행동은?</label>
        <input
          type="text"
          className="input"
          placeholder="운동복 꺼내기, 책 펼치기..."
          value={firstAction}
          onChange={(e) => setFirstAction(e.target.value)}
          required
          maxLength={100}
        />
        <p className="text-micro text-muted mt-1.5">
          5분 안에 할 수 있을 만큼 작게 적어주세요
        </p>
      </div>

      {/* 카운트다운 시간 (슬라이더) */}
      <div>
        <label className="block text-caption text-muted mb-2">
          시작까지 <strong className="text-primary-500">{countdownMinutes}분</strong>
        </label>
        <input
          type="range"
          min={1}
          max={10}
          step={1}
          value={countdownMinutes}
          onChange={(e) => setCountdownMinutes(Number(e.target.value))}
          className="w-full accent-primary-500"
        />
        <div className="flex justify-between text-micro text-muted mt-1">
          <span>1분</span>
          <span>10분</span>
        </div>
      </div>

      {/* 알림 설정 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-body text-text">알림 받기</span>
            <p className="text-xs text-muted mt-1">목표 시간에 맞춰 알려드려요</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={enableNotification}
            onClick={() => {
              const next = !enableNotification;
              setEnableNotification(next);
              if (next) subscribePush();
            }}
            className={`relative inline-flex w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-bg ${
              enableNotification ? 'bg-primary-500' : 'bg-border'
            }`}
          >
            <span
              className={`inline-block w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-200 mt-0.5 ${
                enableNotification ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        {enableNotification && (
          <div className="rounded-2xl border border-border bg-surface p-4">
            <NotificationSettings
              notificationDays={notificationDays}
              setNotificationDays={setNotificationDays}
              schedules={schedules}
              setSchedules={setSchedules}
            />
          </div>
        )}
      </div>

      {/* 에러 메시지 */}
      {error && (
        <p className="text-sm text-danger-500 text-center">{error}</p>
      )}

      {/* 액션 버튼 */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="btn-secondary flex-1"
          disabled={loading}
        >
          취소
        </button>
        <button
          type="submit"
          className="btn-primary flex-[2]"
          disabled={loading || !name.trim() || !firstAction.trim()}
        >
          {loading ? '저장 중...' : isEdit ? '저장하기' : '등록하기'}
        </button>
      </div>

      {/* 삭제 버튼 (편집 모드만) */}
      {isEdit && (
        <>
          <div className="border-t border-border mt-6" />
          <button
            type="button"
            onClick={handleDelete}
            className="btn-danger w-full mt-8"
            disabled={loading}
          >
            목표 삭제
          </button>
        </>
      )}
    </form>
  );
}

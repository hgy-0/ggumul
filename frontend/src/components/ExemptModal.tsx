import { useState } from 'react';
import { haptic } from '@/utils/haptic';
import type { ExemptReason } from '@/types';
import { MONTHLY_EXEMPTION_LIMIT } from '@/types';

interface ExemptModalProps {
  onSubmit: (reason: ExemptReason) => void | Promise<void>;
  onClose: () => void;
  remainingCount: number;
  canUse: boolean;
  blockedReason?: string;
}

// 면제 사유 프리셋
const EXEMPT_PRESETS: { value: ExemptReason; label: string; emoji: string }[] = [
  { value: 'sick', label: '아파요', emoji: '🤒' },
  { value: 'travel', label: '여행 중', emoji: '✈️' },
  { value: 'appointment', label: '약속이 있어요', emoji: '👨‍👩‍👧' },
  { value: 'rest', label: '쉬고 싶어요', emoji: '😌' },
  { value: 'other', label: '다른 이유', emoji: '💬' },
];

/**
 * 면제 사유 선택 바텀시트 모달.
 */
export default function ExemptModal({
  onSubmit,
  onClose,
  remainingCount,
  canUse,
  blockedReason,
}: ExemptModalProps) {
  const [selected, setSelected] = useState<ExemptReason | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selected || submitting || !canUse) return;
    setSubmitting(true);
    try {
      await onSubmit(selected);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* 오버레이 */}
      <div className="overlay-dark animate-fade-in" onClick={onClose} />

      {/* 바텀 시트 */}
      <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
        <div className="max-w-md mx-auto bg-surface rounded-t-card-lg p-6 border-t border-border">
          <h3 className="text-title text-text mb-1">
            오늘은 쉬어갈까요? 😌
          </h3>
          <p className="text-caption text-muted mb-5">
            쉬는 것도 괜찮아요. streak은 유지돼요.
          </p>

          {/* 프리셋 버튼들 — 2x2 + 1 그리드 */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            {EXEMPT_PRESETS.slice(0, 4).map((preset) => (
              <button
                key={preset.value}
                onClick={() => {
                  if (!canUse) return;
                  haptic.medium();
                  setSelected(preset.value);
                }}
                disabled={!canUse}
                className={`p-3 rounded-btn text-left transition-all ${
                  !canUse
                    ? 'bg-bg border border-border text-muted opacity-50 cursor-not-allowed'
                    : selected === preset.value
                    ? 'bg-primary-500/20 border-primary-500 border text-primary-300'
                    : 'bg-bg border border-border text-text hover:bg-surface'
                }`}
              >
                <span className="text-body">
                  {preset.emoji} {preset.label}
                </span>
              </button>
            ))}
          </div>
          <div className="mb-4">
            <button
              onClick={() => {
                if (!canUse) return;
                haptic.medium();
                setSelected('other');
              }}
              disabled={!canUse}
              className={`w-full p-3 rounded-btn text-left transition-all ${
                !canUse
                  ? 'bg-bg border border-border text-muted opacity-50 cursor-not-allowed'
                  : selected === 'other'
                  ? 'bg-primary-500/20 border-primary-500 border text-primary-300'
                  : 'bg-bg border border-border text-text hover:bg-surface'
              }`}
            >
              <span className="text-body">💬 다른 이유</span>
            </button>
          </div>

          {/* 남은 횟수 표시 */}
          {canUse ? (
            <p className="text-caption text-muted text-center mb-5">
              이번 달 남은 횟수: <span className="text-text font-semibold">{remainingCount}/{MONTHLY_EXEMPTION_LIMIT}</span>
            </p>
          ) : (
            <div className="mb-5 p-3 rounded-xl bg-danger-500/10 border border-danger-500/20">
              <p className="text-caption text-danger-500 text-center">
                {blockedReason || '면제를 사용할 수 없어요'}
              </p>
            </div>
          )}

          {/* 액션 버튼들 */}
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-secondary flex-1">
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selected || submitting || !canUse}
              className="btn-primary flex-1"
            >
              {submitting ? '처리 중...' : '오늘 쉬어가기'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

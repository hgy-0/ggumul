import { useState } from 'react';
import { haptic } from '@/utils/haptic';
import type { FailureReason } from '@/types';

interface FailureModalProps {
  onSubmit: (reason: FailureReason) => void | Promise<void>;
  onClose: () => void;
}

// 실패 사유 프리셋
const FAILURE_PRESETS: { value: FailureReason; label: string; emoji: string }[] = [
  { value: 'tired', label: '몸이 피곤했어요', emoji: '😫' },
  { value: 'forgot', label: '깜빡했어요', emoji: '🤦' },
  { value: 'no_time', label: '시간이 부족했어요', emoji: '⏰' },
  { value: 'lazy', label: '의욕이 없었어요', emoji: '😴' },
  { value: 'other', label: '다른 이유', emoji: '💬' },
];

/**
 * 실패 기록 바텀 시트 모달.
 */
export default function FailureModal({ onSubmit, onClose }: FailureModalProps) {
  const [selected, setSelected] = useState<FailureReason | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selected || submitting) return;
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
            다음엔 꼭 해낼 수 있어요
          </h3>
          <p className="text-caption text-muted mb-5">
            오늘 무슨 일이 있었는지 기록해두면<br />다음엔 더 잘 준비할 수 있어요
          </p>

          {/* 프리셋 버튼들 */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {FAILURE_PRESETS.map((preset) => (
              <button
                key={preset.value}
                onClick={() => {
                  haptic.medium();
                  setSelected(preset.value);
                }}
                className={`p-3 rounded-btn text-left transition-all ${
                  selected === preset.value
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

          {/* 액션 버튼들 */}
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-secondary flex-1">
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selected || submitting}
              className="btn-primary flex-1"
            >
              {submitting ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

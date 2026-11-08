interface RevivalModalProps {
  remainingCards: number;
  onUse: () => void;
  onSkip: () => void;
}

/**
 * 부활 카드 사용 확인 다이얼로그.
 */
export default function RevivalModal({ remainingCards, onUse, onSkip }: RevivalModalProps) {
  const hasCards = remainingCards > 0;

  return (
    <>
      {/* 오버레이 */}
      <div className="fixed inset-0 z-40 bg-black/50 animate-fade-in" onClick={onSkip} />

      {/* 모달 */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
        <div className="bg-surface border border-border rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center">
          {hasCards ? (
            <>
              <div className="text-5xl mb-4">💎</div>
              <h3 className="text-xl font-bold text-text mb-2">Streak을 이어갈 수 있어요</h3>
              <p className="text-sm text-muted mb-6">
                부활 카드 1장을 사용하면
                <br />
                오늘의 기록이 유지돼요
              </p>

              {/* 남은 카드 수 */}
              <div className="mb-6">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500/10 text-sm text-text">
                  남은 부활 카드 <strong className="text-primary-600">{remainingCards}장</strong>
                </span>
              </div>

              {/* 액션 버튼 */}
              <div className="flex gap-3">
                <button onClick={onSkip} className="flex-1 px-4 py-2.5 rounded-lg bg-bg border border-border text-text text-sm font-medium hover:bg-surface transition-colors">
                  괜찮아요
                </button>
                <button onClick={onUse} className="flex-1 px-4 py-2.5 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-sm font-bold transition-colors">
                  사용할게요
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="text-5xl mb-4">😢</div>
              <h3 className="text-xl font-bold text-text mb-2">부활 카드가 없어요</h3>
              <p className="text-sm text-muted mb-6">
                부활 카드를 모두 사용했어요.
                <br />
                다음에 다시 도전해보세요!
              </p>

              {/* 확인 버튼 */}
              <button onClick={onSkip} className="w-full px-4 py-2.5 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-sm font-bold transition-colors">
                확인
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

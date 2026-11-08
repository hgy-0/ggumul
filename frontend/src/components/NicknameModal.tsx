import { useState } from 'react';
import { updateMyNickname } from '@/api/devices';

interface NicknameModalProps {
  currentNickname: string | null;
  onClose: () => void;
  onSuccess: (newNickname: string) => void;
}

export default function NicknameModal({
  currentNickname,
  onClose,
  onSuccess,
}: NicknameModalProps) {
  const [nickname, setNickname] = useState(currentNickname || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nickname.trim()) {
      setError('닉네임을 입력해주세요.');
      return;
    }

    if (nickname.trim().length > 50) {
      setError('닉네임은 50자 이하로 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await updateMyNickname(nickname.trim());
      onSuccess(result.nickname);
      onClose();
    } catch (err: any) {
      console.error('Failed to update nickname:', err);
      setError(err.response?.data?.detail || '닉네임 설정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* 배경 오버레이 */}
      <div
        className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 모달 */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-surface rounded-2xl p-6 w-full max-w-sm border border-border shadow-xl">
          <h2 className="text-lg font-bold text-text mb-4">닉네임 설정</h2>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm text-muted mb-2">
                친구들에게 보여질 이름을 설정하세요
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="닉네임 입력"
                maxLength={50}
                className="w-full px-4 py-3 rounded-xl bg-bg border border-border text-text placeholder-muted focus:outline-none focus:border-primary-500 transition-colors"
                autoFocus
              />
              <div className="mt-1 text-xs text-muted text-right">
                {nickname.length}/50
              </div>
            </div>

            {error && (
              <div className="mb-4 bg-danger-500/10 border border-danger-500/20 rounded-xl p-3">
                <p className="text-sm text-danger-500 text-center">{error}</p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 rounded-xl bg-bg hover:bg-bg/80 text-text transition-colors border border-border"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={loading || !nickname.trim()}
                className="flex-1 px-4 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-semibold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '저장 중...' : '저장'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

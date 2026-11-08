import { useState } from 'react';
import { acceptInviteCode } from '@/api/friends';

interface FriendAcceptProps {
  onSuccess?: () => void;
}

export default function FriendAccept({ onSuccess }: FriendAcceptProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleAccept = async () => {
    if (!code.trim()) {
      setError('초대 코드를 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await acceptInviteCode(code.trim().toUpperCase());
      setSuccess(true);
      setCode('');
      setTimeout(() => {
        setSuccess(false);
        onSuccess?.();
      }, 2000);
    } catch (err: any) {
      console.error('Failed to accept invite:', err);
      setError(err.response?.data?.detail || '초대 코드를 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAccept();
    }
  };

  return (
    <div className="bg-surface backdrop-blur-sm rounded-2xl p-6 border border-border shadow-sm">
      <h3 className="text-lg font-bold text-text mb-4">🎁 초대 코드 입력</h3>

      {success ? (
        <div className="text-center py-6">
          <div className="text-5xl mb-3">✓</div>
          <p className="text-primary-500 font-semibold">친구가 추가되었습니다!</p>
        </div>
      ) : (
        <div>
          <p className="text-sm text-muted mb-4">
            친구에게 받은 초대 코드를 입력하세요
          </p>

          <div className="space-y-3">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyPress={handleKeyPress}
              placeholder="MOTI-XXXXXX"
              className="w-full px-4 py-3 rounded-xl bg-surface border border-border text-text placeholder-muted focus:outline-none focus:border-primary-500 transition-colors text-center tracking-wider font-mono shadow-sm"
              disabled={loading}
            />

            <button
              onClick={handleAccept}
              disabled={loading || !code.trim()}
              className="w-full px-6 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-semibold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '확인 중...' : '친구 추가'}
            </button>

            {error && (
              <div className="bg-danger-500/10 border border-danger-500/20 rounded-xl p-3">
                <p className="text-sm text-danger-500 text-center">{error}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

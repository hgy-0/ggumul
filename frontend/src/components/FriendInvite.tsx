import { useState } from 'react';
import { createInviteCode, type InviteCodeResponse } from '@/api/friends';

export default function FriendInvite() {
  const [inviteCode, setInviteCode] = useState<InviteCodeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreateInvite = async () => {
    try {
      setLoading(true);
      setError(null);
      const code = await createInviteCode();
      setInviteCode(code);
    } catch (err) {
      console.error('Failed to create invite code:', err);
      setError('초대 코드 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (!inviteCode) return;

    const shareText = `꾸물 앱에서 함께 목표를 달성해요! 초대 코드: ${inviteCode.code}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: '꾸물 친구 초대',
          text: shareText,
          url: inviteCode.share_url,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: 코드 복사
      handleCopyCode();
    }
  };

  return (
    <div className="bg-surface backdrop-blur-sm rounded-2xl p-6 border border-border shadow-sm">
      <h3 className="text-lg font-bold text-text mb-4">👥 친구 초대하기</h3>

      {!inviteCode ? (
        <div className="text-center">
          <p className="text-sm text-muted mb-4">
            친구를 초대하고 함께 목표를 달성해보세요!
          </p>
          <button
            onClick={handleCreateInvite}
            disabled={loading}
            className="w-full px-6 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-semibold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '생성 중...' : '초대 코드 생성'}
          </button>
          {error && (
            <p className="text-sm text-danger-500 mt-3">{error}</p>
          )}
        </div>
      ) : (
        <div>
          <div className="bg-bg/50 rounded-xl p-4 mb-4 border border-border">
            <p className="text-xs text-muted mb-2">초대 코드</p>
            <p className="text-2xl font-bold text-primary-500 tracking-wider mb-2">
              {inviteCode.code}
            </p>
            <p className="text-xs text-muted">
              만료: {new Date(inviteCode.expires_at).toLocaleDateString('ko-KR')}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCopyCode}
              className="flex-1 px-4 py-2.5 rounded-xl bg-surface hover:bg-bg text-text text-sm font-medium transition-colors border border-border"
            >
              {copied ? '✓ 복사됨!' : '코드 복사'}
            </button>
            <button
              onClick={handleShare}
              className="flex-1 px-4 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium transition-colors"
            >
              공유하기
            </button>
          </div>

          <button
            onClick={() => setInviteCode(null)}
            className="w-full mt-3 px-4 py-2 rounded-xl text-muted hover:text-text text-sm transition-colors"
          >
            새 코드 생성
          </button>
        </div>
      )}
    </div>
  );
}

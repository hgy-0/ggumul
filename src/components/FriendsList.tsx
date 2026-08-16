import { useEffect, useState } from 'react';
import { getFriends, removeFriend, sendCheer, type Friend } from '@/api/friends';
import { haptic } from '@/utils/haptic';

const CHEER_EMOJIS = ['👏', '🔥', '💪', '🎉', '❤️'];

export default function FriendsList() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [cheerOpen, setCheerOpen] = useState<string | null>(null);
  const [cheerSent, setCheerSent] = useState<Record<string, string>>({});

  useEffect(() => {
    loadFriends();
  }, []);

  const loadFriends = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getFriends();
      console.log('Friends loaded:', data);
      setFriends(data);
    } catch (err: any) {
      console.error('Failed to load friends:', err);
      const errorMessage = err.response?.data?.detail || err.message || '친구 목록을 불러오는데 실패했습니다.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (friendDeviceId: string) => {
    if (!confirm('정말 이 친구를 삭제하시겠습니까?')) return;

    try {
      await removeFriend(friendDeviceId);
      setFriends(friends.filter((f) => f.device_id !== friendDeviceId));
      setMenuOpen(null);
    } catch (err) {
      console.error('Failed to remove friend:', err);
      alert('친구 삭제에 실패했습니다.');
    }
  };

  const handleCheer = async (friendDeviceId: string, emoji: string) => {
    try {
      haptic.light();
      await sendCheer(friendDeviceId, emoji);
      setCheerSent((prev) => ({ ...prev, [friendDeviceId]: emoji }));
      setCheerOpen(null);
      // 2초 후 전송 표시 초기화
      setTimeout(() => {
        setCheerSent((prev) => {
          const next = { ...prev };
          delete next[friendDeviceId];
          return next;
        });
      }, 2000);
    } catch (err) {
      console.error('Failed to send cheer:', err);
      alert('응원 전송에 실패했습니다.');
    }
  };

  const getFriendStatus = (friend: Friend) => {
    if (friend.today_success) {
      return {
        emoji: '🎉',
        message: '오늘 목표 달성!',
        subMessage: '함께 응원해요',
        color: 'text-success-500',
        bgColor: 'bg-success-500/5'
      };
    }
    if (friend.current_streak > 0) {
      return {
        emoji: '💪',
        message: `${friend.current_streak}일째 이어가는 중`,
        subMessage: '응원해주세요',
        color: 'text-primary-500',
        bgColor: 'bg-primary-500/5'
      };
    }
    return {
      emoji: '😴',
      message: '아직 시작 안 했어요',
      subMessage: '응원하기',
      color: 'text-muted',
      bgColor: 'bg-surface/50'
    };
  };

  if (loading) {
    return (
      <div className="bg-surface rounded-2xl p-6 animate-pulse shadow-sm border border-border">
        <div className="h-6 bg-bg rounded w-32 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-bg rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-danger-500/10 border border-danger-500/20 rounded-2xl p-5 text-center shadow-sm">
        <p className="text-sm text-danger-500 mb-3">{error}</p>
        <button
          onClick={loadFriends}
          className="px-4 py-2 rounded-xl bg-surface text-text text-sm hover:bg-bg transition-colors border border-border"
        >
          다시 불러오기
        </button>
      </div>
    );
  }

  if (friends.length === 0) {
    return (
      <div className="bg-surface rounded-2xl p-6 text-center border border-border shadow-sm">
        <div className="text-5xl mb-3">👥</div>
        <p className="text-muted text-sm">
          아직 친구가 없어요
          <br />
          친구를 초대해보세요!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3" onClick={(e) => {
      // 이모지 선택 영역 바깥 클릭 시 닫기
      if (cheerOpen && !(e.target as HTMLElement).closest('[data-cheer-area]')) {
        setCheerOpen(null);
      }
    }}>
      {friends.map((friend) => {
        const status = getFriendStatus(friend);
        const displayName = friend.nickname || '친구';
        const isMenuOpen = menuOpen === friend.device_id;

        return (
          <div
            key={friend.device_id}
            className={`${status.bgColor} rounded-2xl p-5 border border-border transition-all`}
          >
            {/* 상단: 이름과 메뉴 */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{status.emoji}</span>
                <div>
                  <h3 className="text-base font-semibold text-text">
                    {displayName}
                  </h3>
                  <p className={`text-sm ${status.color} mt-0.5`}>
                    {status.message}
                  </p>
                </div>
              </div>

              {/* Overflow 메뉴 */}
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(isMenuOpen ? null : friend.device_id)}
                  className="p-2 rounded-lg hover:bg-surface/50 transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
                    <circle cx="12" cy="12" r="1"/>
                    <circle cx="12" cy="5" r="1"/>
                    <circle cx="12" cy="19" r="1"/>
                  </svg>
                </button>

                {isMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setMenuOpen(null)}
                    />
                    <div className="absolute right-0 top-10 z-20 w-40 bg-surface border border-border rounded-xl shadow-xl overflow-hidden">
                      <button
                        onClick={() => handleRemove(friend.device_id)}
                        className="w-full px-4 py-3 text-left text-danger-500 hover:bg-danger-500/10 transition-colors text-sm"
                      >
                        친구 삭제
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* 하단: 응원 버튼 */}
            <div className="flex items-center gap-2" data-cheer-area>
              {cheerSent[friend.device_id] ? (
                <div className="flex-1 px-4 py-2 rounded-xl bg-primary-500/10 border border-primary-500/20 text-sm font-medium text-primary-500 text-center transition-all animate-slide-up">
                  {cheerSent[friend.device_id]} 응원을 보냈어요!
                </div>
              ) : cheerOpen === friend.device_id ? (
                <div className="flex-1 flex items-center gap-1 animate-slide-up">
                  {CHEER_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleCheer(friend.device_id, emoji)}
                      className="flex-1 py-2 rounded-xl bg-surface/50 hover:bg-surface border border-border text-xl transition-all active:scale-90"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              ) : (
                <button
                  className="flex-1 px-4 py-2 rounded-xl bg-surface/50 hover:bg-surface border border-border text-sm font-medium text-text transition-all active:scale-95"
                  onClick={() => {
                    haptic.light();
                    setCheerOpen(friend.device_id);
                  }}
                >
                  {status.subMessage}
                </button>
              )}

              {friend.success_rate > 0 && !cheerOpen && !cheerSent[friend.device_id] && (
                <div className="px-3 py-2 rounded-xl bg-surface/30 border border-border text-xs text-muted whitespace-nowrap">
                  성공률 {Math.round(friend.success_rate * 100)}%
                </div>
              )}
            </div>
          </div>
        );
      })}

      {friends.length > 0 && (
        <button
          onClick={loadFriends}
          className="w-full px-4 py-2.5 rounded-xl text-muted hover:text-text text-sm transition-colors hover:bg-surface/30 border border-border"
        >
          새로고침
        </button>
      )}
    </div>
  );
}

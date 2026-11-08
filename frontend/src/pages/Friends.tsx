import FriendInvite from '@/components/FriendInvite';
import FriendAccept from '@/components/FriendAccept';
import FriendsList from '@/components/FriendsList';

/**
 * 친구 관리 페이지.
 * 친구 초대 및 친구 목록 표시.
 */
export default function Friends() {

  const handleFriendAdded = () => {
    // 친구 추가 성공 시 목록 새로고침
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text mb-2">친구</h1>
        <p className="text-sm text-muted">
          친구들과 함께 목표를 달성해보세요
        </p>
      </div>

      <FriendAccept onSuccess={handleFriendAdded} />
      <FriendInvite />
      <FriendsList />
    </div>
  );
}

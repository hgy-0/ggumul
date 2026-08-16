import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db, isFirebaseConfigured, auth } from './firebase';
import type { Friend, InviteCodeResponse, AcceptInviteResponse, Cheer } from '@/api/friends';
import type { Goal } from '@/types';

// 사용자 ID 가져오기 (로그인된 경우 UID, 아니면 기기 ID)
export function getUserId(): string {
  // 로그인된 사용자가 있으면 UID 사용
  if (auth?.currentUser) {
    return auth.currentUser.uid;
  }

  // 로그인 안 됐으면 기기 ID 사용 (하위 호환성)
  const STORAGE_KEY = 'ggumul_device_id';
  let deviceId = localStorage.getItem(STORAGE_KEY);

  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    localStorage.setItem(STORAGE_KEY, deviceId);
  }

  return deviceId;
}

// 하위 호환성을 위한 별칭
export const getOrCreateDeviceId = getUserId;

// Firestore 컬렉션 참조
const COLLECTIONS = {
  DEVICES: 'devices',
  FRIENDSHIPS: 'friendships',
  INVITE_CODES: 'invite_codes',
  CHEERS: 'cheers',
  USER_PROFILES: 'user_profiles',
};

/**
 * 내 사용자 정보 저장/업데이트
 */
export async function syncMyDevice() {
  if (!isFirebaseConfigured() || !db) return;

  const userId = getUserId();
  const nickname = localStorage.getItem('ggumul_nickname');

  // 사용자 정보 구성
  const userData: any = {
    device_id: userId,
    nickname: nickname || null,
    last_active: serverTimestamp(),
  };

  // 로그인된 사용자면 추가 정보 저장
  if (auth?.currentUser) {
    userData.email = auth.currentUser.email;
    userData.display_name = auth.currentUser.displayName;
    userData.photo_url = auth.currentUser.photoURL;
  }

  await setDoc(
    doc(db, COLLECTIONS.DEVICES, userId),
    userData,
    { merge: true }
  );
}

/**
 * 초대 코드 생성
 */
export async function createInviteCode(): Promise<InviteCodeResponse> {
  if (!isFirebaseConfigured() || !db) {
    throw new Error('Firebase가 설정되지 않았습니다.');
  }

  await syncMyDevice();

  const deviceId = getOrCreateDeviceId();
  const code = Math.random().toString(36).slice(2, 10).toUpperCase();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24시간 후

  await setDoc(doc(db, COLLECTIONS.INVITE_CODES, code), {
    code,
    device_id: deviceId,
    expires_at: Timestamp.fromDate(expiresAt),
    created_at: serverTimestamp(),
  });

  return {
    code,
    expires_at: expiresAt.toISOString(),
    share_url: `${window.location.origin}/#/friends?code=${code}`,
  };
}

/**
 * 초대 코드 수락
 */
export async function acceptInviteCode(code: string): Promise<AcceptInviteResponse> {
  if (!isFirebaseConfigured() || !db) {
    throw new Error('Firebase가 설정되지 않았습니다.');
  }

  await syncMyDevice();

  const myDeviceId = getOrCreateDeviceId();

  // 초대 코드 확인
  const inviteDoc = await getDoc(doc(db, COLLECTIONS.INVITE_CODES, code));

  if (!inviteDoc.exists()) {
    throw new Error('유효하지 않은 초대 코드입니다.');
  }

  const inviteData = inviteDoc.data();
  const friendDeviceId = inviteData.device_id;

  // 만료 확인
  const expiresAt = inviteData.expires_at.toDate();
  if (expiresAt < new Date()) {
    throw new Error('만료된 초대 코드입니다.');
  }

  // 자기 자신 추가 방지
  if (friendDeviceId === myDeviceId) {
    throw new Error('자신을 친구로 추가할 수 없습니다.');
  }

  // 이미 친구인지 확인
  const existingFriendship = await getDoc(
    doc(db, COLLECTIONS.FRIENDSHIPS, `${myDeviceId}_${friendDeviceId}`)
  );

  if (existingFriendship.exists()) {
    throw new Error('이미 친구입니다.');
  }

  // 양방향 친구 관계 생성
  const timestamp = serverTimestamp();

  await Promise.all([
    setDoc(doc(db, COLLECTIONS.FRIENDSHIPS, `${myDeviceId}_${friendDeviceId}`), {
      device_id: myDeviceId,
      friend_device_id: friendDeviceId,
      created_at: timestamp,
    }),
    setDoc(doc(db, COLLECTIONS.FRIENDSHIPS, `${friendDeviceId}_${myDeviceId}`), {
      device_id: friendDeviceId,
      friend_device_id: myDeviceId,
      created_at: timestamp,
    }),
  ]);

  return {
    success: true,
    friend_device_id: friendDeviceId,
    message: '친구가 추가되었습니다!',
  };
}

/**
 * 친구 목록 조회
 */
export async function getFriends(): Promise<Friend[]> {
  if (!isFirebaseConfigured() || !db) {
    console.log('[firebaseFriends] Firebase가 설정되지 않아 빈 친구 목록 반환');
    return [];
  }

  try {
    await syncMyDevice();
  } catch (err) {
    console.error('[firebaseFriends] syncMyDevice 실패:', err);
    return [];
  }

  const myDeviceId = getOrCreateDeviceId();

  // 내 친구 관계 조회
  const q = query(
    collection(db, COLLECTIONS.FRIENDSHIPS),
    where('device_id', '==', myDeviceId)
  );

  const querySnapshot = await getDocs(q);
  const friendDeviceIds = querySnapshot.docs.map((doc) => doc.data().friend_device_id);

  if (friendDeviceIds.length === 0) {
    return [];
  }

  // 친구들의 프로필 정보 조회
  const friendsData: Friend[] = [];
  const today = new Date().toDateString();

  for (const friendDeviceId of friendDeviceIds) {
    // user_profiles에서 먼저 조회, 없으면 devices fallback
    const profileDoc = await getDoc(doc(db, COLLECTIONS.USER_PROFILES, friendDeviceId));
    const deviceDoc = await getDoc(doc(db, COLLECTIONS.DEVICES, friendDeviceId));

    if (profileDoc.exists()) {
      const data = profileDoc.data();
      // last_updated가 오늘이 아니면 today 통계 초기화
      const lastUpdated = data.last_updated?.toDate();
      const isToday = lastUpdated && lastUpdated.toDateString() === today;

      friendsData.push({
        device_id: friendDeviceId,
        nickname: data.nickname || data.display_name || null,
        today_success: isToday ? (data.today_success ?? false) : false,
        current_streak: data.current_streak ?? 0,
        success_rate: data.success_rate ?? 0,
        created_at: lastUpdated?.toISOString() || new Date().toISOString(),
      });
    } else if (deviceDoc.exists()) {
      const data = deviceDoc.data();
      friendsData.push({
        device_id: friendDeviceId,
        nickname: data.nickname || data.display_name || null,
        today_success: false,
        current_streak: 0,
        success_rate: 0,
        created_at: data.last_active?.toDate().toISOString() || new Date().toISOString(),
      });
    }
  }

  return friendsData;
}

/**
 * 사용자 공개 프로필 동기화 (친구에게 보이는 통계)
 */
export async function syncUserProfile(goals: Goal[]): Promise<void> {
  if (!isFirebaseConfigured() || !db) return;
  if (!auth?.currentUser) return;

  const uid = auth.currentUser.uid;
  const nickname = localStorage.getItem('ggumul_nickname');

  const todayCompleted = goals.filter((g) => g.today_success).length;
  const todayTotal = goals.length;

  // 최장 연속 기록
  const maxStreak = goals.reduce((max, g) => Math.max(max, g.current_streak), 0);

  await setDoc(doc(db, COLLECTIONS.USER_PROFILES, uid), {
    nickname: nickname || null,
    display_name: auth.currentUser.displayName || null,
    today_success: todayCompleted > 0,
    today_total: todayTotal,
    today_completed: todayCompleted,
    current_streak: maxStreak,
    success_rate: 0,
    last_updated: serverTimestamp(),
  }, { merge: true });
}

/**
 * 친구 삭제
 */
export async function removeFriend(friendDeviceId: string): Promise<{ success: boolean; message: string }> {
  if (!isFirebaseConfigured() || !db) {
    throw new Error('Firebase가 설정되지 않았습니다.');
  }

  const myDeviceId = getOrCreateDeviceId();

  // 양방향 친구 관계 삭제
  await Promise.all([
    deleteDoc(doc(db, COLLECTIONS.FRIENDSHIPS, `${myDeviceId}_${friendDeviceId}`)),
    deleteDoc(doc(db, COLLECTIONS.FRIENDSHIPS, `${friendDeviceId}_${myDeviceId}`)),
  ]);

  return {
    success: true,
    message: '친구가 삭제되었습니다.',
  };
}

/**
 * 응원 보내기
 */
export async function sendCheer(friendDeviceId: string, emoji: string): Promise<void> {
  if (!isFirebaseConfigured() || !db) {
    throw new Error('Firebase가 설정되지 않았습니다.');
  }

  const myDeviceId = getUserId();
  const myNickname = await getMyDisplayName();

  const cheerId = `${myDeviceId}_${friendDeviceId}_${Date.now()}`;

  await setDoc(doc(db, COLLECTIONS.CHEERS, cheerId), {
    from_device_id: myDeviceId,
    to_device_id: friendDeviceId,
    from_nickname: myNickname,
    emoji,
    read: false,
    created_at: serverTimestamp(),
  });
}

/**
 * 내가 받은 읽지 않은 응원 조회
 */
export async function getUnreadCheers(): Promise<Cheer[]> {
  if (!isFirebaseConfigured() || !db) return [];

  const myDeviceId = getUserId();

  const q = query(
    collection(db, COLLECTIONS.CHEERS),
    where('to_device_id', '==', myDeviceId),
    where('read', '==', false),
    orderBy('created_at', 'desc'),
    limit(20)
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      from_device_id: data.from_device_id,
      from_nickname: data.from_nickname || null,
      emoji: data.emoji,
      created_at: data.created_at?.toDate().toISOString() || new Date().toISOString(),
    };
  });
}

/**
 * 응원 읽음 처리
 */
export async function markCheersAsRead(cheerIds: string[]): Promise<void> {
  if (!isFirebaseConfigured() || !db || cheerIds.length === 0) return;

  const batch = writeBatch(db);
  for (const id of cheerIds) {
    batch.update(doc(db, COLLECTIONS.CHEERS, id), { read: true });
  }
  await batch.commit();
}

/**
 * 내 표시 이름 가져오기 (닉네임 > 구글 이름 > '친구')
 */
async function getMyDisplayName(): Promise<string> {
  const nickname = localStorage.getItem('ggumul_nickname');
  if (nickname) return nickname;

  if (auth?.currentUser?.displayName) {
    return auth.currentUser.displayName;
  }

  return '친구';
}

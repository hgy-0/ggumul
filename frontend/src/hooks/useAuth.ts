import { useState, useEffect } from 'react';
import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '@/utils/firebase';
import { migrateLocalStorageToFirestore } from '@/utils/dataService';

/**
 * Firebase Authentication 훅
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured() || !auth) {
      setLoading(false);
      return;
    }

    // 인증 상태 변화 감지
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);

      // 로그인 시 localStorage → Firestore 마이그레이션 (백그라운드)
      if (user) {
        migrateLocalStorageToFirestore().catch((err) => {
          console.error('[Auth] 데이터 마이그레이션 실패:', err);
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    if (!isFirebaseConfigured() || !auth) {
      setError('Firebase가 설정되지 않았습니다.');
      return;
    }

    try {
      setError(null);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      return result.user;
    } catch (err: any) {
      console.error('[Auth] Google 로그인 실패:', err);
      setError(err.message || '로그인에 실패했습니다.');
      throw err;
    }
  };

  const signOut = async () => {
    if (!auth) return;

    try {
      await firebaseSignOut(auth);
    } catch (err: any) {
      console.error('[Auth] 로그아웃 실패:', err);
      setError(err.message || '로그아웃에 실패했습니다.');
    }
  };

  return {
    user,
    loading,
    error,
    signInWithGoogle,
    signOut,
    isAuthenticated: !!user,
  };
}

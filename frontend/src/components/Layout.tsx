import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useThemeStore } from '@/stores/themeStore';
import { useAuth } from '@/hooks/useAuth';
import StreakWidget from './StreakWidget';
import NicknameModal from './NicknameModal';
import { getMyDeviceInfo } from '@/api/devices';

/**
 * 모바일 앱 느낌의 공통 레이아웃.
 * 상단 헤더 + 콘텐츠 영역 + 하단 네비게이션 바.
 */
export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [nicknameModalOpen, setNicknameModalOpen] = useState(false);
  const [nickname, setNickname] = useState<string | null>(null);
  const { theme, toggleTheme } = useThemeStore();
  const { user, signInWithGoogle, signOut, loading: authLoading } = useAuth();
  const isCountdown = location.pathname.includes('/countdown');
  const menuRef = useRef<HTMLDivElement>(null);

  // 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  useEffect(() => {
    loadDeviceInfo();
  }, []);

  const loadDeviceInfo = async () => {
    try {
      const info = await getMyDeviceInfo();
      setNickname(info.nickname);
    } catch (err) {
      console.error('Failed to load device info:', err);
    }
  };

  // 카운트다운 페이지에서는 헤더/네비 숨김 (풀스크린)
  if (isCountdown) {
    return (
      <div className="min-h-screen max-w-md sm:max-w-2xl md:max-w-4xl lg:max-w-6xl mx-auto bg-neutral-950">
        <main className="px-4 py-4">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen max-w-md sm:max-w-2xl md:max-w-4xl lg:max-w-6xl mx-auto bg-bg">
      {/* 상단 헤더 */}
      <header className="safe-top fixed top-0 left-0 right-0 z-30 backdrop-blur-xl bg-bg/80 border-b border-border">
        <div className="max-w-md sm:max-w-2xl md:max-w-4xl lg:max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
          <StreakWidget />
          <h1 className="text-xl font-bold tracking-tight text-text">
            꾸물
          </h1>

          {/* 메뉴 버튼 */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-lg text-muted hover:text-text hover:bg-surface/50 transition-all min-w-[40px] min-h-[40px] flex items-center justify-center"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>

            {/* 드롭다운 메뉴 */}
            {menuOpen && (
              <>
                <div className="absolute right-0 top-12 z-10 w-56 bg-surface border border-border rounded-xl shadow-xl overflow-hidden animate-slide-up">
                  {/* 프로필 섹션 */}
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      setNicknameModalOpen(true);
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-bg transition-colors flex items-start gap-3"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-shrink-0 text-text">
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                    <div className="flex-1 min-w-0">
                      {nickname ? (
                        <>
                          <p className="text-sm font-medium text-text truncate">{nickname}</p>
                          <p className="text-xs text-muted">닉네임 수정</p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-medium text-primary-500">닉네임 설정</p>
                          <p className="text-xs text-muted">친구에게 보여질 이름</p>
                        </>
                      )}
                    </div>
                  </button>

                  <div className="border-t border-border"></div>

                  {/* 테마 토글 */}
                  <button
                    onClick={() => {
                      toggleTheme();
                    }}
                    className="w-full px-4 py-3 text-left text-text hover:bg-bg transition-colors flex items-center gap-3"
                  >
                    {theme === 'light' ? (
                      <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                        </svg>
                        다크 모드
                      </>
                    ) : (
                      <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="5"/>
                          <line x1="12" y1="1" x2="12" y2="3"/>
                          <line x1="12" y1="21" x2="12" y2="23"/>
                          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                          <line x1="1" y1="12" x2="3" y2="12"/>
                          <line x1="21" y1="12" x2="23" y2="12"/>
                          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                        </svg>
                        라이트 모드
                      </>
                    )}
                  </button>

                  <div className="border-t border-border"></div>

                  {/* 로그인/로그아웃 */}
                  {user ? (
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        signOut();
                      }}
                      className="w-full px-4 py-3 text-left text-text hover:bg-bg transition-colors flex items-start gap-3"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-shrink-0">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                        <polyline points="16 17 21 12 16 7"/>
                        <line x1="21" y1="12" x2="9" y2="12"/>
                      </svg>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text truncate">{user.displayName || user.email}</p>
                        <p className="text-xs text-muted">로그아웃</p>
                      </div>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        signInWithGoogle();
                      }}
                      disabled={authLoading}
                      className="w-full px-4 py-3 text-left text-primary-500 hover:bg-primary-500/10 transition-colors flex items-center gap-3 disabled:opacity-50"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                        <polyline points="10 17 15 12 10 7"/>
                        <line x1="15" y1="12" x2="3" y2="12"/>
                      </svg>
                      Google 로그인
                    </button>
                  )}

                  <div className="border-t border-border"></div>

                  {/* 친구 메뉴 */}
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      navigate('/friends');
                    }}
                    className="w-full px-4 py-3 text-left text-text hover:bg-bg transition-colors flex items-center gap-3"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                    친구
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 콘텐츠 영역 */}
      <main className="flex-1 px-5 pt-20 pb-28">
        <Outlet />
      </main>

      {/* 하단 네비게이션 바 */}
      <nav className="safe-bottom fixed bottom-0 left-0 right-0 z-30 backdrop-blur-xl bg-bg/80 border-t border-border">
        <div className="max-w-md sm:max-w-2xl md:max-w-4xl lg:max-w-6xl mx-auto flex items-center justify-around h-16">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'text-primary-500'
                  : 'text-muted hover:text-text'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`p-1.5 rounded-lg transition-all ${isActive ? 'bg-primary-500/10' : ''}`}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                </div>
                <span className="text-[11px] font-medium">홈</span>
              </>
            )}
          </NavLink>

          <NavLink
            to="/stats"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'text-primary-500'
                  : 'text-muted hover:text-text'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`p-1.5 rounded-lg transition-all ${isActive ? 'bg-primary-500/10' : ''}`}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10" />
                    <line x1="12" y1="20" x2="12" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="14" />
                  </svg>
                </div>
                <span className="text-[11px] font-medium">통계</span>
              </>
            )}
          </NavLink>

          <NavLink
            to="/goals/new"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'text-primary-500'
                  : 'text-muted hover:text-text'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`p-1.5 rounded-lg transition-all ${isActive ? 'bg-primary-500/10' : ''}`}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </div>
                <span className="text-[11px] font-medium">추가</span>
              </>
            )}
          </NavLink>
        </div>
      </nav>

      {/* 닉네임 모달 */}
      {nicknameModalOpen && (
        <NicknameModal
          currentNickname={nickname}
          onClose={() => setNicknameModalOpen(false)}
          onSuccess={(newNickname) => {
            setNickname(newNickname);
          }}
        />
      )}
    </div>
  );
}

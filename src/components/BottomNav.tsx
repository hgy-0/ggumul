import { useLocation, useNavigate } from 'react-router-dom';

/**
 * 하단 네비게이션 바
 * 홈 / 통계 / 친구 탭 제공
 */
export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const tabs = [
    {
      path: '/',
      label: '홈',
      icon: (active: boolean) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      ),
    },
    {
      path: '/stats',
      label: '통계',
      icon: (active: boolean) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      ),
    },
    {
      path: '/friends',
      label: '친구',
      icon: (active: boolean) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
    },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-bg/95 backdrop-blur-xl border-t border-border pb-safe">
      <div className="max-w-2xl mx-auto px-4">
        <div className="flex items-center justify-around h-16">
          {tabs.map((tab) => {
            const active = isActive(tab.path);
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className={`flex flex-col items-center justify-center gap-1 px-6 py-2 rounded-lg transition-all min-w-[64px] min-h-[48px] ${
                  active
                    ? 'text-primary-400'
                    : 'text-muted hover:text-text'
                }`}
              >
                {tab.icon(active)}
                <span className="text-xs font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

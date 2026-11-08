import { useState } from 'react';

type Platform = 'mac' | 'windows' | 'ios' | 'android' | 'unknown';

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  if (/Mac/.test(ua)) return 'mac';
  if (/Win/.test(ua)) return 'windows';
  return 'unknown';
}

const GUIDES: Record<Exclude<Platform, 'unknown'>, { title: string; steps: string[] }> = {
  mac: {
    title: 'macOS 알림 설정',
    steps: [
      '시스템 설정 → 알림 으로 이동',
      'Google Chrome (또는 사용 중인 브라우저) 선택',
      '"알림 허용"과 "소리 재생" 모두 켜기',
    ],
  },
  windows: {
    title: 'Windows 알림 설정',
    steps: [
      '설정 → 시스템 → 알림 으로 이동',
      '"알림" 토글이 켜져 있는지 확인',
      '아래 앱 목록에서 Chrome을 찾아 알림 허용',
    ],
  },
  ios: {
    title: 'iOS 알림 설정',
    steps: [
      '이 사이트를 홈 화면에 추가 (공유 → 홈 화면에 추가)',
      '설정 → 알림 → 꾸물 선택',
      '"알림 허용" 켜기',
    ],
  },
  android: {
    title: 'Android 알림 설정',
    steps: [
      '브라우저 주소창 왼쪽 자물쇠 아이콘 탭',
      '"알림"을 "허용"으로 변경',
      '소리가 안 나면: 설정 → 앱 → Chrome → 알림 확인',
    ],
  },
};

/**
 * 알림 활성화 후 OS 설정 가이드를 보여주는 컴포넌트.
 * localStorage에 dismiss 상태를 저장해서 한 번 닫으면 다시 안 보임.
 */
export default function NotificationGuide() {
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem('notification-guide-dismissed') === 'true',
  );

  if (dismissed) return null;

  const platform = detectPlatform();
  if (platform === 'unknown') return null;

  const guide = GUIDES[platform];

  const handleDismiss = () => {
    localStorage.setItem('notification-guide-dismissed', 'true');
    setDismissed(true);
  };

  return (
    <div className="rounded-2xl border border-primary-500/30 bg-primary-500/5 p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <svg className="text-primary-400 shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span className="text-sm font-semibold text-primary-500">{guide.title}</span>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="text-muted hover:text-text transition-colors p-0.5"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      <p className="text-xs text-muted">
        알림이 안 오거나 소리가 안 나면 아래 설정을 확인해주세요.
      </p>
      <ol className="space-y-1.5">
        {guide.steps.map((step, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-text">
            <span className="shrink-0 w-5 h-5 rounded-full bg-primary-500/15 text-primary-500 flex items-center justify-center text-[10px] font-bold mt-0.5">
              {i + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

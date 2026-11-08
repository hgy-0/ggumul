import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import App from './App';
import './index.css';


const Router = import.meta.env.VITE_SINGLE_FILE ? HashRouter : BrowserRouter;

// 기존 사용자는 온보딩 건너뛰기 (이미 데이터가 있는 경우)
if (localStorage.getItem('ggumul_goals') && !localStorage.getItem('ggumul_onboarding_done')) {
  localStorage.setItem('ggumul_onboarding_done', 'true');
}

// 싱글파일 모드에서 샘플 데이터 초기화는 온보딩 이후에만
// (온보딩 완료 후 GoalForm에서 직접 목표를 만드므로 샘플 불필요)

// 서비스 워커 등록 (푸시 알림에 필요)
// 싱글파일 프리뷰에서는 서비스 워커 비활성화
if ('serviceWorker' in navigator && !import.meta.env.VITE_SINGLE_FILE) {
  navigator.serviceWorker
    .register('/push-sw.js', { scope: '/', updateViaCache: 'none' })
    .then((reg) => console.log('[SW] registered:', reg.scope))
    .catch((err) => console.error('[SW] registration failed:', err));

  // 푸시 알림 도착 시 알림음 재생 (앱이 열려있을 때)
  const notificationSound = new Audio('/notification.wav');
  notificationSound.volume = 0.5;

  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'push-received') {
      notificationSound.currentTime = 0;
      notificationSound.play().catch(() => {});
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router>
      <App />
    </Router>
  </React.StrictMode>,
);

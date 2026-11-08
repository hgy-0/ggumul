import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useThemeStore } from '@/stores/themeStore';
import {
  startNotificationScheduler,
  stopNotificationScheduler,
  requestNotificationPermission,
} from '@/utils/localNotifications';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import Stats from '@/pages/Stats';
import GoalForm from '@/pages/GoalForm';
import GoalDetail from '@/pages/GoalDetail';
import Countdown from '@/pages/Countdown';
import Result from '@/pages/Result';
import Insights from '@/pages/Insights';
import Friends from '@/pages/Friends';
import Onboarding from '@/pages/Onboarding';

/**
 * 앱 루트 컴포넌트.
 */
export default function App() {
  const { theme, setTheme } = useThemeStore();

  // 초기 테마 설정
  useEffect(() => {
    setTheme(theme);
  }, [theme, setTheme]);

  // 알림 시스템 초기화
  useEffect(() => {
    const initNotifications = async () => {
      // 로컬 스케줄러 사용 (무료)
      console.log('[App] 로컬 알림 스케줄러 초기화');

      const granted = await requestNotificationPermission();
      if (granted) {
        startNotificationScheduler();
        console.log('[App] 로컬 알림 스케줄러 시작됨');
      } else {
        console.log('[App] 알림 권한이 거부되었습니다.');
      }
    };

    initNotifications();

    return () => {
      stopNotificationScheduler();
    };
  }, []);

  return (
    <Routes>
      <Route path="/onboarding" element={<Onboarding />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/goals/new" element={<GoalForm />} />
        <Route path="/goals/:id/edit" element={<GoalForm />} />
        <Route path="/goals/:id/detail" element={<GoalDetail />} />
        <Route path="/goals/:id/countdown" element={<Countdown />} />
        <Route path="/goals/:id/result" element={<Result />} />
        <Route path="/goals/:id/insights" element={<Insights />} />
        <Route path="/friends" element={<Friends />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

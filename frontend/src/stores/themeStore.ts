import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

/**
 * 테마 상태 관리 스토어
 * localStorage에 자동 저장
 */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'light', // 기본값 라이트모드
      toggleTheme: () =>
        set((state) => {
          const newTheme = state.theme === 'light' ? 'dark' : 'light';
          // HTML 태그에 클래스 적용
          if (typeof document !== 'undefined') {
            document.documentElement.classList.remove('light', 'dark');
            document.documentElement.classList.add(newTheme);
          }
          return { theme: newTheme };
        }),
      setTheme: (theme) =>
        set(() => {
          // HTML 태그에 클래스 적용
          if (typeof document !== 'undefined') {
            document.documentElement.classList.remove('light', 'dark');
            document.documentElement.classList.add(theme);
          }
          return { theme };
        }),
    }),
    {
      name: 'theme-storage',
    }
  )
);

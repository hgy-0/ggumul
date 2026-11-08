/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      /* ───────────────────────────────────────────────
       * 1. COLOR PALETTE
       * ─────────────────────────────────────────────── */
      colors: {
        /* Primary — 차분한 동기부여 · 집중 · 신뢰 (인디고/블루) */
        primary: {
          50:  "#EEF2FF",
          100: "#E0E7FF",
          200: "#C7D2FE",
          300: "#A5B4FC",
          400: "#818CF8",
          500: "#6366F1",   // 기본값
          600: "#4F46E5",
          700: "#4338CA",
          800: "#3730A3",
          900: "#312E81",
          950: "#1E1B4B",
        },

        /* Success — 성공 · Streak 유지 · 완료 (에메랄드) */
        success: {
          50:  "#ECFDF5",
          100: "#D1FAE5",
          200: "#A7F3D0",
          300: "#6EE7B7",
          400: "#34D399",
          500: "#10B981",   // 기본값
          600: "#059669",
          700: "#047857",
          800: "#065F46",
          900: "#064E3B",
          950: "#022C22",
        },

        /* Danger — 차분한 피드백 · 리마인더 (슬레이트/블루그레이) */
        danger: {
          50:  "#F8FAFC",
          100: "#F1F5F9",
          200: "#E2E8F0",
          300: "#CBD5E1",
          400: "#94A3B8",
          500: "#64748B",   // 기본값
          600: "#475569",
          700: "#334155",
          800: "#1E293B",
          900: "#0F172A",
          950: "#020617",
        },

        /* Neutral — 라이트/다크 모드 대응 */
        neutral: {
          50:  "#FAFAFA",   // 라이트: 밝은 배경
          100: "#F5F5F5",
          200: "#E5E5E5",
          300: "#D4D4D4",
          400: "#A3A3A3",
          500: "#737373",
          600: "#525252",
          700: "#404040",
          800: "#262626",
          900: "#171717",   // 다크: 어두운 배경
          950: "#0A0A0A",
        },
        // 테마 색상
        bg: "rgb(var(--color-bg) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        text: "rgb(var(--color-text) / <alpha-value>)",
        "text-secondary": "rgb(var(--color-text-secondary) / <alpha-value>)",
        muted: "rgb(var(--color-muted) / <alpha-value>)",
        border: "rgb(var(--color-border) / <alpha-value>)",
      },

      /* ───────────────────────────────────────────────
       * 2. TYPOGRAPHY
       * ─────────────────────────────────────────────── */
      fontFamily: {
        sans: [
          "Pretendard",
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
          "Apple Color Emoji",
          "Segoe UI Emoji",
        ],
        mono: [
          "JetBrains Mono",
          "Fira Code",
          "monospace",
        ],
      },

      fontSize: {
        "timer-xl": ["4rem",   { lineHeight: "1",   letterSpacing: "-0.04em", fontWeight: "800" }],
        "timer-lg": ["3rem",   { lineHeight: "1",   letterSpacing: "-0.03em", fontWeight: "700" }],
        "timer-md": ["2rem",   { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "700" }],
        "headline": ["1.75rem",{ lineHeight: "1.2", letterSpacing: "-0.02em", fontWeight: "700" }],
        "title":    ["1.25rem",{ lineHeight: "1.3", letterSpacing: "-0.01em", fontWeight: "600" }],
        "body":     ["1rem",   { lineHeight: "1.5", fontWeight: "400" }],
        "caption":  ["0.875rem",{ lineHeight: "1.4", fontWeight: "400" }],
        "micro":    ["0.75rem",{ lineHeight: "1.3", fontWeight: "500" }],
      },

      /* ───────────────────────────────────────────────
       * 3. BORDER RADIUS — 둥근 카드 느낌
       * ─────────────────────────────────────────────── */
      borderRadius: {
        "card":  "1rem",      // 16px — 기본 카드
        "card-lg": "1.25rem", // 20px — 큰 카드
        "btn":   "0.75rem",   // 12px — 버튼
        "badge": "9999px",    // pill 형태
      },

      /* ───────────────────────────────────────────────
       * 4. BOX SHADOW — 카드용 부드러운 그림자
       * ─────────────────────────────────────────────── */
      boxShadow: {
        "sm":         "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        "DEFAULT":    "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)",
        "md":         "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)",
        "lg":         "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)",
        "card":       "0 2px 8px 0 rgba(0, 0, 0, 0.08)",
        "card-hover": "0 4px 16px 0 rgba(0, 0, 0, 0.12)",
        "card-lg":    "0 8px 24px 0 rgba(0, 0, 0, 0.15)",
        "glow-primary": "0 0 20px 4px rgba(99, 102, 241, 0.25)",
        "glow-success": "0 0 20px 4px rgba(16, 185, 129, 0.25)",
        "glow-danger":  "0 0 20px 4px rgba(100, 116, 139, 0.20)",
        "inner-glow":   "inset 0 0 16px 2px rgba(99, 102, 241, 0.10)",
      },

      /* ───────────────────────────────────────────────
       * 5. ANIMATIONS
       * ─────────────────────────────────────────────── */
      keyframes: {
        /* 타이머 pulse */
        "timer-pulse": {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%":      { transform: "scale(1.04)", opacity: "0.85" },
        },
        /* 긴급 glow — 차분한 인디고 톤 */
        "urgency-glow": {
          "0%, 100%": { boxShadow: "0 0 8px 2px rgba(99, 102, 241, 0.15)" },
          "50%":      { boxShadow: "0 0 24px 8px rgba(99, 102, 241, 0.35)" },
        },
        /* 성공 bounce */
        "success-bounce": {
          "0%":   { transform: "scale(0.3)", opacity: "0" },
          "50%":  { transform: "scale(1.08)" },
          "70%":  { transform: "scale(0.95)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        /* 슬라이드 업 */
        "slide-up": {
          "0%":   { transform: "translateY(24px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        /* fade in */
        "fade-in": {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        /* confetti 파티클 */
        "confetti-fall": {
          "0%":   { transform: "translateY(-100vh) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateY(100vh) rotate(720deg)", opacity: "0" },
        },
        /* streak glow — 부드러운 빛남 */
        "streak-fire": {
          "0%, 100%": { transform: "scaleY(1)", filter: "brightness(1)" },
          "50%":      { transform: "scaleY(1.15)", filter: "brightness(1.2)" },
        },
        /* shake — 부드러운 주의 환기 */
        "shake": {
          "0%, 100%":          { transform: "translateX(0)" },
          "10%, 30%, 50%, 70%, 90%": { transform: "translateX(-3px)" },
          "20%, 40%, 60%, 80%":      { transform: "translateX(3px)" },
        },
      },

      animation: {
        "timer-pulse":    "timer-pulse 2s ease-in-out infinite",
        "urgency-glow":   "urgency-glow 1.5s ease-in-out infinite",
        "success-bounce":  "success-bounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)", // Apple HIG 500ms
        "slide-up":       "slide-up 0.3s ease-out", // Apple HIG 300ms
        "fade-in":        "fade-in 0.2s ease-out",  // Apple HIG 200ms
        "confetti-fall":  "confetti-fall 2.5s ease-in forwards",
        "streak-fire":    "streak-fire 1s ease-in-out infinite",
        "shake":          "shake 0.5s ease-in-out", // Apple HIG 500ms
      },

      /* ───────────────────────────────────────────────
       * 6. BACKDROP BLUR
       * ─────────────────────────────────────────────── */
      backdropBlur: {
        xs: "2px",
      },

      /* ───────────────────────────────────────────────
       * 7. TRANSITION
       * ─────────────────────────────────────────────── */
      transitionDuration: {
        DEFAULT: "200ms",
        fast: "100ms",
        slow: "400ms",
      },
    },
  },
  plugins: [],
};

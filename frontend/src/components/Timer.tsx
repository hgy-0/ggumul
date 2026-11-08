import { formatTime } from '@/utils/dateUtils';

interface TimerProps {
  remaining: number;
  total: number;
  actionText: string;
}

/**
 * SVG 원형 프로그레스 링 타이머.
 * 더 두꺼운 링 + 글로우 효과 + 부드러운 그라데이션.
 */
export default function Timer({ remaining, total, actionText }: TimerProps) {
  const progress = total > 0 ? remaining / total : 0;

  // 색상 결정 — 차분한 톤
  const getColor = () => {
    if (progress > 0.5) return { stroke: '#10B981', glow: 'rgba(16, 185, 129, 0.3)', text: 'text-success-400', bg: 'from-success-500/5' };
    if (progress > 0.2) return { stroke: '#818CF8', glow: 'rgba(129, 140, 248, 0.3)', text: 'text-primary-400', bg: 'from-primary-500/5' };
    return { stroke: '#6366F1', glow: 'rgba(99, 102, 241, 0.4)', text: 'text-primary-300', bg: 'from-primary-500/5' };
  };

  const color = getColor();
  const isUrgent = remaining <= 30;
  const isCritical = remaining <= 10;

  const size = 280;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="flex flex-col items-center justify-center gap-8">
      {/* 원형 타이머 */}
      <div className={`relative ${isUrgent ? 'animate-timer-pulse' : ''}`}>
        {/* 배경 글로우 */}
        <div
          className="absolute inset-0 rounded-full blur-3xl opacity-40 transition-all duration-1000"
          style={{ backgroundColor: color.glow }}
        />

        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="relative transform -rotate-90 drop-shadow-lg"
        >
          {/* 배경 링 */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#262626"
            strokeWidth={strokeWidth}
          />
          {/* 프로그레스 링 */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color.stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{
              transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease',
              filter: `drop-shadow(0 0 8px ${color.glow})`,
            }}
          />
        </svg>

        {/* 중앙 시간 표시 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={`font-mono font-extrabold tracking-tight ${color.text} ${
              isCritical ? 'animate-urgency-glow text-6xl' : 'text-6xl'
            }`}
          >
            {formatTime(remaining)}
          </span>
          <span className="text-xs text-neutral-600 mt-1 tracking-wider uppercase">
            남은 시간
          </span>
        </div>
      </div>

      {/* 첫 행동 카드 */}
      <div className="w-full max-w-xs rounded-2xl bg-neutral-800/50 border border-neutral-700/50 p-5 text-center">
        <p className="text-xs text-neutral-500 uppercase tracking-wider mb-2">이것부터 해보세요</p>
        <p className="text-lg font-semibold text-neutral-100 leading-relaxed">
          {actionText}
        </p>
      </div>
    </div>
  );
}

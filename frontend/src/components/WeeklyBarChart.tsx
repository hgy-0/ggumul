interface DailyStatItem {
  date: string;
  attempts: number;
  successes: number;
}

interface WeeklyBarChartProps {
  dailyStats: DailyStatItem[];
}

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

/**
 * 최근 7일 스토리 중심 그래프
 * - 오늘 강조, 한눈에 이해되는 시각화
 */
export default function WeeklyBarChart({ dailyStats }: WeeklyBarChartProps) {
  // 스토리 계산
  const successDays = dailyStats.filter(d => d.attempts > 0 && d.successes === d.attempts).length;
  const totalAttemptDays = dailyStats.filter(d => d.attempts > 0).length;
  const today = dailyStats[dailyStats.length - 1];
  const isToday = (date: string) => date === today?.date;

  // 스토리 메시지
  const getStoryMessage = () => {
    if (successDays === 7) return '완벽한 한 주였어요! 🎉';
    if (successDays >= 5) return `이번 주 ${successDays}일 성공! 거의 다 왔어요 💪`;
    if (successDays >= 3) return `이번 주 ${successDays}일 성공했어요 ✨`;
    if (successDays >= 1) return `${successDays}일 성공! 계속 이어가보세요 🌱`;
    if (totalAttemptDays > 0) return '시도했다는 것만으로도 대단해요';
    return '이번 주 시작해볼까요?';
  };

  const maxAttempts = Math.max(...dailyStats.map(d => d.attempts), 1);

  return (
    <div className="space-y-4 overflow-hidden">
      {/* 스토리 메시지 */}
      <div className="text-center">
        <p className="text-sm font-medium text-text">
          {getStoryMessage()}
        </p>
      </div>

      {/* 그래프 */}
      <div className="flex items-end justify-between gap-2 h-24">
        {dailyStats.map((stat) => {
          const date = new Date(stat.date);
          const weekday = WEEKDAY_LABELS[date.getDay()];
          const isTodayBar = isToday(stat.date);

          // 실제 비율 계산
          const hasAttempts = stat.attempts > 0;
          const successRate = hasAttempts ? stat.successes / stat.attempts : 0;

          // 높이 (최소 8px, 최대 80px)
          const MIN_HEIGHT = 8;
          const MAX_HEIGHT = 80;
          const heightPx = hasAttempts
            ? Math.max((stat.attempts / maxAttempts) * MAX_HEIGHT, MIN_HEIGHT)
            : 0;

          return (
            <div key={stat.date} className="flex-1 flex flex-col items-center gap-2">
              {/* 막대 */}
              <div className="w-full flex flex-col justify-end" style={{ height: '80px' }}>
                {hasAttempts ? (
                  <div className="w-full relative rounded-t-lg overflow-hidden bg-border/30" style={{ height: `${heightPx}px` }}>
                    {/* 성공 비율 */}
                    <div
                      className="absolute bottom-0 w-full bg-primary-500 transition-all"
                      style={{ height: `${successRate * 100}%` }}
                    />
                    {/* 숫자 표시 */}
                    {stat.attempts > 1 && (
                      <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow">
                        {stat.successes}/{stat.attempts}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-1 bg-border/50 rounded" />
                )}
              </div>

              {/* 요일 */}
              <div className={`text-xs font-medium ${isTodayBar ? 'text-primary-500' : 'text-muted'}`}>
                {isTodayBar ? '오늘' : weekday}
              </div>
            </div>
          );
        })}
      </div>

      {/* 범례 */}
      <div className="flex items-center justify-center gap-4 text-xs text-muted">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 bg-primary-500 rounded-sm" />
          <span>성공</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 bg-border/30 rounded-sm" />
          <span>시도</span>
        </div>
      </div>
    </div>
  );
}

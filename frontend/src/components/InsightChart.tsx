interface InsightChartProps {
  /** 차트 제목 */
  title: string;
  /** key: 라벨, value: 횟수 */
  data: Record<string, number>;
  /** 바 색상 클래스 (기본: gradient-primary) */
  colorClass?: string;
}

// 실패 이유 한국어 라벨 매핑
const REASON_LABELS: Record<string, string> = {
  tired: '피곤',
  forgot: '깜빡',
  no_time: '시간 부족',
  lazy: '의욕 없음',
  other: '기타',
};

// 요일 한국어 라벨 매핑 (영어 키 → 한국어)
const DAY_NAME_LABELS: Record<string, string> = {
  monday: '월',
  tuesday: '화',
  wednesday: '수',
  thursday: '목',
  friday: '금',
  saturday: '토',
  sunday: '일',
  mon: '월',
  tue: '화',
  wed: '수',
  thu: '목',
  fri: '금',
  sat: '토',
  sun: '일',
};

/**
 * 가로 막대 그래프 컴포넌트.
 * CSS로 구현하며, 외부 차트 라이브러리를 사용하지 않는다.
 */
export default function InsightChart({ title, data, colorClass = 'gradient-primary' }: InsightChartProps) {
  const entries = Object.entries(data);
  const maxValue = Math.max(...entries.map(([, v]) => v), 1);

  if (entries.length === 0) {
    return (
      <div className="card p-4">
        <h4 className="text-caption text-neutral-400 mb-3">{title}</h4>
        <p className="text-caption text-neutral-500">아직 기록이 없어요</p>
      </div>
    );
  }

  return (
    <div className="card p-4">
      <h4 className="text-caption text-neutral-400 mb-4">{title}</h4>

      <div className="space-y-3">
        {entries.map(([key, value]) => {
          const label = REASON_LABELS[key] || DAY_NAME_LABELS[key] || key;
          const percentage = (value / maxValue) * 100;

          return (
            <div key={key}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-micro text-neutral-300">{label}</span>
                <span className="text-micro text-neutral-400">{value}회</span>
              </div>
              <div className="progress-bar">
                <div
                  className={`progress-bar-fill ${colorClass}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

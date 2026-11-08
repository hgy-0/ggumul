/**
 * 오늘 날짜를 'YYYY-MM-DD' 형식의 로컬 타임존 문자열로 반환한다.
 */
export function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 초 단위 시간을 'M:SS' 형식 문자열로 변환한다.
 * 예: 272 → '4:32'
 */
export function formatTime(seconds: number): string {
  if (seconds < 0) seconds = 0;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

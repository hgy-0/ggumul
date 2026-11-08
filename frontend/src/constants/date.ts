/** 요일 라벨 (월~일) */
export const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'] as const;

/** 전체 요일 인덱스 (0=월 ~ 6=일) */
export const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6] as const;

/** 평일 인덱스 */
export const WEEKDAYS = [0, 1, 2, 3, 4] as const;

/** 주말 인덱스 */
export const WEEKEND = [5, 6] as const;

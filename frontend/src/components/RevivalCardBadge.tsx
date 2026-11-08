interface RevivalCardBadgeProps {
  count: number;
}

/**
 * 부활 카드 잔여 수 표시.
 */
export default function RevivalCardBadge({ count }: RevivalCardBadgeProps) {
  if (count === 0) {
    return <span className="text-neutral-600">0장</span>;
  }

  return (
    <span className="inline-flex items-center gap-1 text-primary-400">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" className="opacity-80">
        <path d="M7 1l1.8 3.6L13 5.3l-3 2.9.7 4.1L7 10.3 3.3 12.3l.7-4.1-3-2.9 4.2-.7L7 1z"/>
      </svg>
      {count}장
    </span>
  );
}

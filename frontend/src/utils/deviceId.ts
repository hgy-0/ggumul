const DEVICE_ID_KEY = 'motivation_device_id';

/**
 * localStorage에서 device_id를 가져오거나, 없으면 새로 생성하여 저장한다.
 * UUID v4 형식의 고유 식별자를 사용한다.
 */
export function getDeviceId(): string {
  const stored = localStorage.getItem(DEVICE_ID_KEY);
  if (stored) return stored;

  const newId = crypto.randomUUID();
  try {
    localStorage.setItem(DEVICE_ID_KEY, newId);
  } catch {
    // QuotaExceededError 등 — 저장 실패해도 생성된 ID 반환
  }
  return newId;
}

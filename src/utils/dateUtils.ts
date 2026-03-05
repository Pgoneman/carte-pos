/**
 * KST(UTC+9) 기준 오늘 자정을 UTC ISO 문자열로 반환
 * 예: KST 2026-03-03 00:00:00 → UTC 2026-03-02T15:00:00.000Z
 */
export function getTodayUtcIsoStart(): string {
  const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
  const now = new Date();
  const kstNow = new Date(now.getTime() + KST_OFFSET_MS);
  kstNow.setUTCHours(0, 0, 0, 0);
  return new Date(kstNow.getTime() - KST_OFFSET_MS).toISOString();
}

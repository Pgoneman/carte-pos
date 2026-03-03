# Phase 2 & 최신 작업 수행 결과 정리

현재 단계까지의 아키텍처 개선(Phase 2) 및 프론트엔드 기능 안정화/완성 현황입니다.

## 1. Phase 2: 상태 관리 및 백엔드 로직 리팩토링 (Codex 메인)
기존에 거대했던 단일 `posStore.ts`를 역할별로 분할(Zustand Slices 패턴)하여 유지보수성을 극대화했습니다. 
- **Store Slices 분리**: `uiSlice`, `tableSlice`, `menuSlice`, `orderSlice`, `kitchenSlice`, `syncSlice` 등 기능별 스토어 모듈화
- **Type 정의 중앙화**: 각 파일에 흩어져 있던 인터페이스(Table, OrderItem 등)를 `src/types/index.ts`로 모아서 통합 관리
- **에러 핸들링 보강**: Supabase 기반의 CRUD 호출 로직에 대해 일관적인 `try-catch` 블록 및 화면 토스트(`showToast`) 알림 추가
- **Realtime Sync 구조화**: 웹소켓 실시간 이벤트 구독을 위한 기초 로직 작성

## 2. Phase 3 & 에지 케이스 픽스 (Gemini 메인)
UI 컴포넌트의 렌더링 성능을 개선하고, `edge_case_report.md` 기반의 치명적인 UI 결함을 수정했습니다.
- **Custom Hooks 추출**: `Header.tsx`의 실시간 시계(`useClock`), 컴포넌트 내부 경과 시간 타이머 로직(`useElapsedTime`) 분리
- **중복 전송(Double Submit) 방지**: `OrderPanel.tsx`에서 주문 중(`loading`)일 때 주문 전송 버튼 비활성화 구현
- **사이드바 닫기 버그 수정**: 설정(`/settings`) 진입 후 사이드바를 수동으로 닫을 때 강제 종료 상태(`forceSettingsClosed`)를 두어 정상 스와이프 차단되는 현상 제거
- **예약(Reservation) 상태 연동 완성**: 
  - `Reservation` 관련 Type 추가 (`types/reservation.ts`)
  - `reservationSlice` 신규 생성 및 예약 로드(`select`), 추가(`insert`) 로직 구현
  - `ReservationModal` 폼 상태 연동 (고객명, 연락처 파싱 및 제출 가능하도록 구현)
  - `ReservationCalendar`의 내부 상태를 글로벌 Store 상태로 변경 완료

---

## 3. Claude 코드 리뷰 결과 (2026-03-03)

### 🔴 버그 — 즉시 수정

#### [B-1 / B-2] `slices/types.ts` — import가 파일 중간에 위치 + ReservationSlice 위치 불일치

`ReservationSlice` import가 파일 53번째 줄(다른 인터페이스 선언 뒤)에 위치.
ESLint `import/order` 규칙 위반이며, 다른 6개 슬라이스 인터페이스가 모두 `types.ts` 내부에 직접 정의된 것과 달리 `ReservationSlice`만 `reservationSlice.ts`에서 가져오는 패턴 불일치.

→ **수정**: `ReservationSlice` 인터페이스를 `types.ts` 내부로 이동, 외부 import 제거.
→ **수정**: `reservationSlice.ts`는 반대로 `./types`에서 `ReservationSlice`를 import.

#### [B-3] `syncSlice.ts` — subscribe 콜백 내 동기 `removeChannel` 호출

```ts
// CHANNEL_ERROR / TIMED_OUT / CLOSED 처리 블록
clearRealtimeChannel();  // ← 채널 status 콜백 안에서 동일 채널에 동기 removeChannel 호출
```

Supabase 채널 status 콜백 실행 도중 `supabase.removeChannel()`을 동기 호출하면
라이브러리 내부 채널 맵 순회 중 재진입이 발생할 수 있음. undefined behavior 영역.

→ **수정**: `setTimeout(clearRealtimeChannel, 0)` 으로 다음 이벤트 루프 태스크로 분리.

---

### 🟡 개선 권장 (수정 불필요 — 향후 고려)

| # | 파일 | 내용 |
|---|------|------|
| W-1 | `reservationSlice.ts` | `fetchReservations` 날짜 필터 없음 → 과거 예약 전체 조회. MVP는 허용 |
| W-2 | `reservationSlice.ts` | `createReservation` 초기 상태 `'confirmed'` 하드코딩. 플로우 변경 시 수정 |
| W-3 | `orderSlice.ts` | `submitOrder` 성공 시 수동 fetch + Realtime 자동 fetch = 2회 발생. 기능 이상 없음 |
| W-4 | `syncSlice.ts` | 재연결 성공(`SUBSCRIBED`) 시 사용자 알림 toast 없음 |

---

### ✅ 잘 구현된 부분

- 지수 백오프(`2^n × 1s`, 최대 30s) + `isManuallyStopped` 플래그로 의도치 않은 재연결 방지
- `rollbackCreatedOrder`: `order_items → orders` FK 의존 순서 준수
- `getTodayUtcIsoStart`: KST 오프셋 주석 포함, `completeAllOrders`에도 동일 필터 적용
- `createReservation` `boolean` 반환 → 호출부에서 성공 여부 분기 가능

---

## 4. 수정 내역 (Claude 직접 적용)

| ID | 파일 | 수정 내용 |
|----|------|-----------|
| B-1, B-2 | `slices/types.ts` | `ReservationSlice` 인터페이스 파일 내부로 이동, 외부 import 제거 |
| B-2 | `slices/reservationSlice.ts` | `ReservationSlice` 인터페이스 제거, `./types`에서 import |
| B-3 | `slices/syncSlice.ts` | `clearRealtimeChannel()` → `setTimeout(clearRealtimeChannel, 0)` |

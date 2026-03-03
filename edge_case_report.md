# 에지 케이스 리포트

> 작성 일자: 2026-03-03
> 대상: Codex(백엔드) · Gemini(프론트엔드) 병렬 작업 시 놓치기 쉬운 케이스 정리

---

## 1. Realtime WebSocket — TIMED_OUT / CLOSED 미처리

### 현황

`syncSlice.ts`의 subscribe 콜백은 `SUBSCRIBED`와 `CHANNEL_ERROR` 두 상태만 처리합니다.

```ts
// syncSlice.ts:44-54 (현재)
.subscribe((status) => {
  if (status === 'SUBSCRIBED') {
    set({ realtimeConnected: true });
    return;
  }
  if (status === 'CHANNEL_ERROR') {
    set({ realtimeConnected: false });
    get().showToast('실시간 동기화 연결에 실패했습니다.');
  }
  // ⚠ 'TIMED_OUT', 'CLOSED' 는 아무것도 하지 않음
});
```

### 문제

| 상태 | 발생 시점 | 현재 결과 |
|------|-----------|-----------|
| `TIMED_OUT` | 네트워크 불안정, Supabase 서버 과부하 | `realtimeConnected` 그대로 `true` 유지 → UI는 연결된 척 |
| `CLOSED` | 브라우저 절전 복귀, 탭 백그라운드 후 복귀 | 동일 |

실제로는 소켓이 끊어졌는데 `realtimeConnected = true` 를 표시하고, 다른 기기의 주문 변경이 이 클라이언트에 전달되지 않습니다.

### 대비책

```ts
.subscribe((status) => {
  if (status === 'SUBSCRIBED') {
    set({ realtimeConnected: true });
    return;
  }
  if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
    set({ realtimeConnected: false });
    // 기존 채널 정리 후 재연결
    void supabase.removeChannel(realtimeChannel!);
    realtimeChannel = null;
    // 지수 백오프 재연결 (단순 예시: 3초 후 1회 재시도)
    setTimeout(() => get().startRealtimeSync(), 3000);
  }
});
```

---

## 2. KST vs UTC 날짜 필터 불일치

### 현황

`kitchenSlice.ts`의 `getTodayUtcIsoStart()`는 UTC 자정 기준으로 오늘 주문을 필터링합니다.

```ts
// kitchenSlice.ts:40-44
function getTodayUtcIsoStart(): string {
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);   // UTC 00:00
  return now.toISOString();
}
```

### 문제

한국은 UTC+9입니다. **KST 00:00 ~ 08:59 사이에 발생한 주문**은 UTC 기준 "전날"에 속합니다.

| KST 시각 | UTC 시각 | `getTodayUtcIsoStart()` 필터 | 결과 |
|----------|----------|------------------------------|------|
| 01:00 KST | 전날 16:00 UTC | 오늘 00:00 UTC | ❌ 조회 안 됨 |
| 09:00 KST | 당일 00:00 UTC | 오늘 00:00 UTC | ✅ 조회됨 |

새벽 영업 시간(01:00~08:59 KST)에 받은 주문이 주방 화면에서 사라집니다.

### 대비책

```ts
function getTodayKstIsoStart(): string {
  const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
  const now = new Date();
  const kstNow = new Date(now.getTime() + KST_OFFSET_MS);
  // KST 기준 당일 00:00 을 UTC로 변환
  kstNow.setUTCHours(0, 0, 0, 0);
  return new Date(kstNow.getTime() - KST_OFFSET_MS).toISOString();
}
```

또는 Supabase 프로젝트 타임존을 `Asia/Seoul`로 설정하고 DB 함수로 필터링하는 방식도 고려할 수 있습니다.

---

## 3. submitOrder 부분 실패 — 고아(Orphaned) 레코드

### 현황

`orderSlice.ts`의 `submitOrder`는 3단계 순차 write를 수행합니다.

```
1. orders INSERT          → order.id 확보
2. order_items INSERT     → order.id 참조
3. tables UPDATE          → 테이블 누적 금액 갱신
```

### 문제

2단계 또는 3단계가 실패하면 현재 코드는 `showToast` 후 `return` 합니다.
이때 1단계에서 이미 `orders` 행이 DB에 생성된 상태입니다.

| 실패 단계 | DB 상태 | 현상 |
|-----------|---------|------|
| `order_items` INSERT 실패 | `orders` 행만 존재 (items 없음) | 주방 화면에 빈 주문 카드 표시 |
| `tables` UPDATE 실패 | `orders` + `order_items` 존재, 테이블 금액 미반영 | 결제 금액 오계산 |

### 대비책

**단기**: 실패 시 생성된 `orders` 행을 명시적으로 삭제(롤백)합니다.

```ts
const { data: order, error: orderError } = await supabase
  .from('orders').insert(...).select().single();
if (orderError) { ... return; }

const { error: itemError } = await supabase
  .from('order_items').insert(orderItemsPayload);
if (itemError) {
  // 부분 롤백
  await supabase.from('orders').delete().eq('id', insertedOrder.id);
  get().showToast('주문 항목 저장에 실패했습니다.');
  return;
}
```

**장기**: Supabase Database Function(RPC)으로 트랜잭션을 서버 단에서 원자적으로 처리합니다.

```sql
CREATE OR REPLACE FUNCTION submit_order(...) RETURNS void AS $$
BEGIN
  INSERT INTO orders ...;
  INSERT INTO order_items ...;
  UPDATE tables ...;
END;
$$ LANGUAGE plpgsql;
```

---

## 4. submitOrder 실행 중 이중 제출(Double Submit)

### 현황

`submitOrder`에 전역 `loading` 플래그가 있지만, 주문 버튼 클릭 시 이 `loading`을 체크하는 가드가 없습니다. 빠른 더블클릭 또는 네트워크 지연 중 재클릭 시 동일 주문이 2번 DB에 삽입됩니다.

### 대비책

```ts
// orderSlice 또는 OrderPanel 컴포넌트에서
if (get().loading) return;
set({ loading: true });
// ... 로직 ...
set({ loading: false });
```

또는 버튼에 `disabled={loading}` 처리 + 낙관적 UI 패턴 적용.

---

## 5. App.tsx 사이드바 닫기 불가 버그 (`/settings` 라우트)

### 현황

현재 `App.tsx`는 사이드바 열림 상태를 다음과 같이 계산합니다.

```tsx
const isSettingsRoute = location.pathname === '/settings';
// ...
<ManagementDashboard
  isOpen={isSidebarOpen || isSettingsRoute}
  onClose={() => setIsSidebarOpen(false)}
/>
```

### 문제

사용자가 `/settings` 경로에 있을 때 사이드바 X 버튼을 클릭하면:
1. `setIsSidebarOpen(false)` 호출 → `isSidebarOpen = false`
2. 하지만 `isSettingsRoute`는 여전히 `true`
3. `isOpen = false || true = true` → **사이드바가 닫히지 않음**

### 대비책

`isSettingsRoute` 기반 자동 오픈은 유지하되, 닫기 시 `/` 로 네비게이트하거나, 별도 "사용자가 수동으로 닫음" 상태를 추가합니다.

```tsx
// 방법 A: 닫기 시 홈으로 이동
import { useNavigate } from 'react-router-dom';
const navigate = useNavigate();

<ManagementDashboard
  isOpen={isSidebarOpen || isSettingsRoute}
  onClose={() => {
    setIsSidebarOpen(false);
    if (isSettingsRoute) navigate('/');
  }}
/>
```

```tsx
// 방법 B: 수동 닫힘 상태 플래그
const [forceClosed, setForceClosed] = useState(false);

// 라우트 변경 시 forceClosed 초기화
useEffect(() => { setForceClosed(false); }, [location.pathname]);

<ManagementDashboard
  isOpen={!forceClosed && (isSidebarOpen || isSettingsRoute)}
  onClose={() => { setIsSidebarOpen(false); setForceClosed(true); }}
/>
```

---

## 6. completeAllOrders — 날짜·테이블 범위 제한 없음

### 현황

```ts
// kitchenSlice.ts
await supabase
  .from('orders')
  .update({ status: 'completed' })
  .in('status', ['pending', 'cooking', 'ready', 'served']);
  // ⚠ 날짜 필터, 테이블 필터 없음
```

### 문제

과거 날짜에 `pending` 또는 `cooking` 상태로 남아있는 주문이 있으면 (네트워크 오류 등으로 미처리된 오래된 데이터) 모두 `completed`로 변경됩니다. 운영 중에는 잘못된 데이터가 실수로 완료 처리될 수 있습니다.

### 대비책

오늘 날짜(KST 기준) 필터를 추가합니다.

```ts
await supabase
  .from('orders')
  .update({ status: 'completed' })
  .in('status', ['pending', 'cooking', 'ready', 'served'])
  .gte('created_at', getTodayKstIsoStart()); // 2번 항목의 KST 필터 재사용
```

---

## 7. menus 테이블 — Realtime 구독 누락

### 현황

`syncSlice.ts`는 `orders`와 `tables` 테이블만 구독합니다. `menus` 변경은 구독하지 않습니다.

### 문제

한 기기에서 Excel로 메뉴를 업로드(`MenuUpload` 컴포넌트)하면, 다른 기기의 `OrderPanel`에는 새 메뉴가 자동으로 반영되지 않습니다. 직원이 수동으로 새로고침해야 합니다.

### 대비책

```ts
// syncSlice.ts — menus 테이블 구독 추가
.on(
  'postgres_changes',
  { event: '*', schema: 'public', table: 'menus' },
  () => void get().fetchMenus()
)
```

또는 메뉴는 변경 빈도가 낮으므로, 메뉴 업로드 완료 시 toast에 "다른 기기에서 새로고침이 필요합니다"라는 안내를 추가하는 것도 현실적인 대안입니다.

---

## 8. syncSlice 모듈 레벨 싱글턴 — HMR 누수

### 현황

```ts
// syncSlice.ts
let realtimeChannel: RealtimeChannel | null = null;
let refreshTimer: ReturnType<typeof setTimeout> | null = null;
```

모듈 스코프에 선언된 변수는 Vite HMR이 모듈을 재실행해도 초기화되지 않습니다.

### 문제

개발 중 `syncSlice.ts`를 수정·저장하면 HMR이 모듈을 다시 로드합니다.
이때 기존 `realtimeChannel`은 `null`로 재초기화되지만, Supabase 서버 측에서는 여전히 연결이 살아있어 **이벤트가 중복 수신**될 수 있습니다.
또한 `if (realtimeChannel) return;` 가드가 우회되어 채널이 중복 생성될 수 있습니다.

### 대비책

`stopRealtimeSync`를 HMR 정리 훅에 등록합니다.

```ts
// main.tsx
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    usePosStore.getState().stopRealtimeSync();
  });
}
```

---

## 우선순위 요약

| # | 케이스 | 심각도 | 영향 범위 |
|---|--------|--------|-----------|
| 1 | Realtime TIMED_OUT/CLOSED 미처리 | 🔴 높음 | 멀티 기기 동기화 전체 |
| 2 | KST vs UTC 날짜 필터 | 🔴 높음 | 새벽 영업 주방 화면 |
| 3 | submitOrder 부분 실패 고아 레코드 | 🔴 높음 | 주방 화면, 결제 금액 |
| 4 | 이중 제출 | 🟡 중간 | 주문 중복 |
| 5 | /settings 사이드바 닫기 불가 | 🟡 중간 | UX |
| 6 | completeAllOrders 범위 무제한 | 🟡 중간 | 과거 데이터 오염 |
| 7 | menus Realtime 누락 | 🟢 낮음 | 메뉴 실시간 동기화 |
| 8 | HMR 채널 누수 | 🟢 낮음 | 개발 환경 한정 |

# Claude 프로젝트 분석 보고서

> 분석 일자: 2026-03-03
> 대상: AYCE 한식 BBQ POS 시스템 목업 (`Toss Mock Up`)

---

## 프로젝트 요약

**스택**: React 19 + TypeScript + Vite + Tailwind CSS v4 + Zustand + Supabase
**목적**: AYCE(무한리필) 한식 BBQ 레스토랑용 POS 목업/프로토타입
**전반적 구조**: 잘 잡혀 있음 — pages → components → stores 분리, 라우팅 정리, 책임 분리 명확

---

## 개선 항목

### 🔴 높은 우선순위

#### 1. 디버그 로그 방치

`posStore.ts` 프로덕션 코드 곳곳에 `console.log`가 남아 있음.

| 위치 | 내용 |
|------|------|
| `posStore.ts:154` | `console.log('메뉴 데이터:', data)` |
| `posStore.ts:243` | `console.log('🔍 fetchTableOrders:', tableId)` |
| `posStore.ts:271` | `console.log('📦 조회 결과:', data)` |
| `posStore.ts:295` | `console.log('✅ 파싱된 항목:', allItems)` |

배포 전 전부 제거 또는 개발 환경에서만 출력되도록 처리 필요.

---

#### 2. `nul` 파일 존재

`Toss Mock Up/nul` — Windows에서 `echo > nul` 같은 명령을 잘못 실행해 생긴 빈 파일.
의미 없는 파일이므로 삭제 필요.

---

#### 3. 에러 핸들링 불일치

함수마다 에러 처리 유무가 다름. 통일 필요.

| 함수 | 에러 처리 |
|------|-----------|
| `fetchTables` | ❌ 없음 |
| `fetchKitchenOrders` | ❌ 없음 |
| `fetchMenus` | ✅ 있음 |
| `fetchTableOrders` | ✅ 있음 |
| `submitOrder` | ❌ 없음 (insert 실패 시 조용히 중단) |
| `processPayment` | ❌ 없음 |

---

### 🟡 중간 우선순위

#### 4. `any` 타입 남용

타입 안정성이 낮아 런타임 에러 원인 추적이 어려워짐.

| 위치 | 코드 |
|------|------|
| `posStore.ts:78` | `function mapTableRow(row: any)` |
| `posStore.ts:157` | `.filter((m: any) => ...)` |
| `posStore.ts:229` | `const updates: any = { ... }` |
| `posStore.ts:276` | `data.forEach((order: any) => ...)` |

Supabase의 `Database` 타입을 생성(`generate_typescript_types`)하거나 직접 Row 타입을 정의하면 대부분 해결 가능.

---

#### 5. `types/index.ts` 미활용

`src/types/index.ts`는 `export {};` 한 줄만 있고, 실제 공용 타입(`Table`, `Menu`, `OrderItem`, `KitchenOrder`)이 모두 `posStore.ts` 내부에 섞여 있음.

타입을 `types/index.ts`로 분리하면 재사용성과 유지보수성이 높아짐.

```ts
// 현재: posStore.ts 안에 모두 정의
export interface Table { ... }
export interface OrderItem { ... }
export interface KitchenOrder { ... }
export interface Menu { ... }

// 권장: types/index.ts로 이동 후 posStore.ts에서 import
import type { Table, OrderItem, KitchenOrder, Menu } from '../types';
```

---

#### 6. 실시간 업데이트 미구현 (수동 폴링)

현재는 모든 작업 후 `fetchTables()` + `fetchKitchenOrders()`를 수동 호출.
멀티 기기 환경(주방 디스플레이 + 카운터)에서 다른 기기의 변경사항이 자동 반영되지 않음.

Supabase Realtime subscription으로 교체하면 자동 동기화 가능.

```ts
// 예시
supabase
  .channel('orders')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
    get().fetchKitchenOrders();
  })
  .subscribe();
```

---

#### 7. `revertOrderStatus` 기본값 고정

`posStore.ts:347` — `toStatus = 'ready'`로 하드코딩.
이전 상태를 자동 추적하는 로직이 없어서, 호출 시 명시적으로 `toStatus`를 넘기지 않으면 항상 `'ready'`로 돌아감.
상태 전이 이력을 관리하거나, 호출 측에서 항상 명시하도록 기본값 제거 권장.

---

### 🟢 낮은 우선순위 (품질 개선)

#### 8. 예약 기능 Supabase 미연동

`ReservationCalendar` / `ReservationModal`이 UI만 구현되어 있고 실제 예약 데이터의 DB 저장 및 조회 로직이 없음.
`reservations` 테이블 설계 및 store 액션 추가 필요.

---

#### 9. `hooks/` 폴더 비어있음

`DESIGN.md`에 명시된 폴더이지만 구현 파일이 없음.
반복되는 로직을 custom hook으로 분리하면 코드 중복이 줄어듦.

| 후보 hook | 역할 |
|-----------|------|
| `useElapsedTime(startTime)` | 테이블 경과 시간 계산 (현재 여러 컴포넌트에 분산) |
| `useClock()` | Header 실시간 시계 (현재 Header 내부에 직접 구현) |
| `useKitchenOrderBadge()` | 주방 주문 미처리 건수 계산 |

---

#### 10. `kitchenOrders` 쿼리 범위 과대

`posStore.ts:302` — `completed`, `cancelled` 포함 전체 상태를 가져옴.
영업 시간이 지날수록 불필요한 데이터가 누적됨.

날짜 필터 추가 권장:
```ts
.gte('created_at', new Date().toISOString().split('T')[0]) // 오늘 날짜만
```

---

#### 11. `mapTableRow`의 불필요한 패턴

`posStore.ts:84`:
```ts
// 현재 (의미 없음 — undefined ?? undefined === undefined)
guests: row.guests ?? undefined,

// 개선
guests: row.guests,
```

---

## 우선순위 정리

| 순위 | 항목 | 예상 공수 |
|------|------|-----------|
| 1 | `console.log` 제거 | 5분 |
| 2 | `nul` 파일 삭제 | 1분 |
| 3 | 에러 핸들링 통일 | 30분 |
| 4 | 타입 분리 (`types/index.ts` 활용) | 1시간 |
| 5 | Supabase Realtime 연동 | 2~3시간 |
| 6 | 예약 DB 연동 | 반나절 |
| 7 | Custom hooks 분리 | 1~2시간 |
| 8 | `kitchenOrders` 날짜 필터 추가 | 10분 |

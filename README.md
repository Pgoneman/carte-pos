# AYCE 한식 BBQ POS 시스템

> **무한리필(AYCE) 한식 바베큐 레스토랑**을 위한 웹 기반 POS 목업/프로토타입입니다.
> 테이블 관리, 주문 입력, 주방 현황, 포장·배달·대기, 예약 캘린더를 단일 SPA로 제공합니다.

---

## 기술 스택

| 레이어 | 기술 | 버전 |
|--------|------|------|
| UI 프레임워크 | React | 19 |
| 언어 | TypeScript | ~5.9 |
| 빌드 도구 | Vite | 7 |
| 스타일 | Tailwind CSS (v4, `@tailwindcss/vite`) | 4 |
| 라우팅 | react-router-dom | 7 |
| 전역 상태 | Zustand | 5 |
| 백엔드 / DB | Supabase (PostgreSQL + Realtime) | 2 |
| 애니메이션 | framer-motion | 12 |
| 아이콘 | lucide-react | latest |
| Excel 파싱 | xlsx | 0.18 |

---

## 폴더 구조

```
src/
├── pages/                        # 라우트 진입점 (thin wrapper)
│   ├── TablePage.tsx
│   ├── OrderPage.tsx
│   ├── StatusPage.tsx
│   ├── TakeoutPage.tsx
│   ├── ReservationPage.tsx
│   └── SettingsPage.tsx
│
├── components/
│   ├── common/                   # Header, Navigation, Toast, PageTransition
│   ├── table/                    # TableOverview, TableNumberpad
│   ├── order/                    # OrderPanel
│   ├── status/                   # OrderStatusList (주방 디스플레이)
│   ├── takeout/                  # TakeoutDashboard + TakeoutContent
│   ├── reservation/              # ReservationCalendar, ReservationModal
│   └── settings/                 # ManagementDashboard (사이드바), MenuUpload
│
├── stores/
│   ├── posStore.ts               # Zustand 스토어 조합 진입점
│   └── slices/
│       ├── types.ts              # 슬라이스 인터페이스 + PosStore 합성 타입
│       ├── uiSlice.ts            # loading, toast
│       ├── tableSlice.ts         # 테이블 CRUD
│       ├── menuSlice.ts          # 메뉴 fetch + 카테고리
│       ├── orderSlice.ts         # 주문 생성·수정·결제
│       ├── kitchenSlice.ts       # 주방 주문 상태 전이
│       └── syncSlice.ts          # Supabase Realtime 구독 관리
│
├── types/
│   └── index.ts                  # 공용 도메인 타입 (Table, Menu, OrderItem, KitchenOrder)
│
├── lib/
│   └── supabase.ts               # Supabase 클라이언트 초기화
│
├── services/
│   └── menuService.ts            # Excel 메뉴 Supabase 업로드
│
└── utils/
    └── excelParser.ts            # xlsx 파싱 유틸
```

---

## 라우팅

| 경로 | 화면 | 비고 |
|------|------|------|
| `/` | 테이블 현황 | 기본홀 / 포장·배달·대기 탭 |
| `/order` | 주문 입력 | 테이블 미선택 상태 |
| `/order/:tableId` | 주문 입력 | 특정 테이블 지정 |
| `/status` | 주방 현황 | 진행·준비완료·서빙완료·취소 탭 |
| `/takeout` | 포장·배달·대기 | |
| `/reservation` | 예약 캘린더 | |
| `/settings` | 설정 안내 | 실제 UI는 ManagementDashboard 사이드바 |

**상단 네비는 `App.tsx`에서 단 한 번만 렌더합니다.** 각 페이지 컴포넌트에 네비를 중복해서 추가하지 않습니다.

---

## 아키텍처: Zustand Slice 패턴

### 왜 Slice 패턴인가

단일 `posStore.ts`에 모든 로직이 집중되면 파일이 커지고 관심사가 섞입니다. Zustand의 `StateCreator` 타입을 활용해 **도메인별 슬라이스**로 분리하고, 진입점(`posStore.ts`)에서 스프레드로 조합합니다.

```
PosStore (합성 타입)
 = UiSlice          ← loading, toast
 + TableSlice       ← tables, selectedTableId, CRUD
 + MenuSlice        ← menus, categories, selectedCategory
 + OrderSlice       ← currentOrder, submitOrder, processPayment
 + KitchenSlice     ← kitchenOrders, 상태 전이
 + SyncSlice        ← realtimeConnected, startRealtimeSync, stopRealtimeSync
```

```ts
// stores/posStore.ts
export const usePosStore = create<PosStore>()((...args) => ({
  ...createUiSlice(...args),
  ...createTableSlice(...args),
  ...createMenuSlice(...args),
  ...createOrderSlice(...args),
  ...createKitchenSlice(...args),
  ...createSyncSlice(...args),
}));
```

### 슬라이스 간 통신

각 슬라이스는 `get()`을 통해 전체 스토어에 접근할 수 있습니다.

```ts
// orderSlice.ts — 주문 완료 후 UiSlice의 toast 호출
get().showToast('주문이 전송되었습니다');

// syncSlice.ts — Realtime 이벤트 수신 시 TableSlice·KitchenSlice 재조회
void get().fetchTables();
void get().fetchKitchenOrders();
```

### 타입 위치 규칙

| 파일 | 역할 |
|------|------|
| `src/types/index.ts` | 도메인 타입 (`Table`, `Menu`, `OrderItem`, `KitchenOrder`) |
| `src/stores/slices/types.ts` | 슬라이스 인터페이스 + `PosStore` 합성 타입 |
| 각 슬라이스 파일 내부 | Supabase Row 타입 등 해당 슬라이스에만 필요한 내부 타입 |

새 도메인 타입 추가 시 반드시 `src/types/index.ts`에 정의하세요.

---

## 아키텍처: Supabase Realtime

### 동작 원리

```
┌─────────────────────────────────────────────────────┐
│                     Browser                          │
│                                                      │
│  App.tsx                                             │
│  ├── useEffect → startRealtimeSync()  (마운트 시)    │
│  └── cleanup  → stopRealtimeSync()   (언마운트 시)   │
│                                                      │
│  syncSlice.ts                                        │
│  ├── supabase.channel('pos-realtime-sync')           │
│  │   ├── subscribe: orders  (* 이벤트)               │
│  │   └── subscribe: tables  (* 이벤트)               │
│  │                                                   │
│  │   이벤트 수신 → queueRefresh()  (200ms 디바운스)  │
│  │       ├── fetchTables()                           │
│  │       ├── fetchKitchenOrders()                    │
│  │       └── fetchTableOrders(selectedTableId)?      │
│  │                                                   │
│  └── realtimeConnected: boolean (연결 상태 표시용)   │
└───────────────────────┬─────────────────────────────┘
                        │ WebSocket
┌───────────────────────▼─────────────────────────────┐
│                   Supabase                           │
│   orders 변경 → postgres_changes 이벤트 발행         │
│   tables 변경 → postgres_changes 이벤트 발행         │
└─────────────────────────────────────────────────────┘
```

### 디바운스가 필요한 이유

`submitOrder` 실행 시 `orders` 1건 + `tables` 1건 변경이 연속 발생합니다.
디바운스 없으면 `fetchTables` + `fetchKitchenOrders`가 각각 2회씩 호출됩니다.
`REFRESH_DEBOUNCE_MS = 200ms`로 이를 1회로 묶어 처리합니다.

### Realtime 구독 상태 흐름

```
startRealtimeSync()
       ↓
subscribe 콜백 수신
       ├── 'SUBSCRIBED'    → realtimeConnected = true
       ├── 'CHANNEL_ERROR' → realtimeConnected = false + toast 알림
       ├── 'TIMED_OUT'     → ⚠ 현재 미처리 (edge_case_report.md 참고)
       └── 'CLOSED'        → ⚠ 현재 미처리 (edge_case_report.md 참고)
```

---

## Supabase DB 스키마

```sql
tables        (id, name, type, status, guests, start_time, total_amount)
menus         (id, name, category_name, price, is_active)
orders        (id, table_id, status, total_amount, created_at)
order_items   (id, order_id, menu_id, name, price, quantity)
payments      (id, table_id, amount, method, created_at)
```

### 주문 상태 전이

```
pending → cooking → ready → served → completed
                  ↑__________________________↓  revertOrderStatus()
cancelled  (별도 취소 경로)
```

---

## 환경 변수

`.env` 파일을 루트에 생성하세요:

```env
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

> **주의**: `.env` 파일에 실제 키가 포함됩니다. `.gitignore`에 반드시 포함되어 있는지 확인하세요.

---

## 시작하기

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 미리보기
npm run preview

# 린트
npm run lint
```

---

## 개발 규칙

1. **상단 네비 중복 금지** — `Header` / `Navigation`은 `App.tsx`에서만 렌더합니다.
2. **관리 UI는 사이드바** — 설정·관리 기능은 `/settings` 페이지가 아닌 `ManagementDashboard` 드로어에서 제공합니다.
3. **도메인 타입은 `types/index.ts`에** — 슬라이스 파일 내부에 새 도메인 타입을 정의하지 않습니다.
4. **슬라이스 인터페이스는 `slices/types.ts`에** — 새 슬라이스 추가 시 `PosStore` 합성 타입에도 반영합니다.
5. **에러는 toast로** — 사용자에게 영향을 주는 모든 async 실패는 `showToast`로 알립니다.
6. **Realtime은 단일 채널** — `syncSlice`의 `pos-realtime-sync` 채널 하나만 사용합니다. 컴포넌트 단위로 별도 채널을 만들지 않습니다.

---

## 참고 문서

- [DESIGN.md](./DESIGN.md) — UI/UX 설계 원칙 및 컴포넌트 규격
- [claude_analysis.md](./claude_analysis.md) — 코드 품질 분석 및 개선 항목
- [edge_case_report.md](./edge_case_report.md) — 에지 케이스 및 대비책

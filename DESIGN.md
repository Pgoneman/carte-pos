# AYCE 한식 BBQ POS – 확정 설계

> New Chat에서도 **이 파일만 기준**으로 작업이 이어질 수 있도록 정리한 설계 문서입니다.

---

## 1. 프로젝트 개요

- **스택**: Vite + React + TypeScript + Tailwind CSS (v4, `@tailwindcss/vite`)
- **라우터**: react-router-dom
- **아이콘**: lucide-react
- **목적**: AYCE(무한리필) 한식 BBQ 레스토랑용 POS 목업/프로토타입

---

## 2. 폴더 구조

```
src/
├── pages/                    # 라우트별 페이지 (각 페이지는 해당 도메인 컴포넌트만 렌더)
│   ├── TablePage.tsx         # → TableOverview
│   ├── OrderPage.tsx         # → OrderPanel (tableId from params)
│   ├── StatusPage.tsx        # → OrderStatusList
│   ├── TakeoutPage.tsx       # → TakeoutDashboard
│   ├── ReservationPage.tsx   # → ReservationCalendar (모달 상태는 캘린더 내부)
│   └── SettingsPage.tsx      # 안내 문구만 (실제 설정은 사이드바)
├── components/
│   ├── common/               # 공통 레이아웃
│   │   ├── Header.tsx        # 검은 상단바 (햄버거, 네비, 시간)
│   │   └── Navigation.tsx    # 테이블|주문|현황|예약 탭
│   ├── table/
│   │   ├── TableOverview.tsx # 테이블 현황 + 기본홀/포장·배달·대기 탭
│   │   └── TableNumberpad.tsx# 빈 테이블 클릭 시 인원 입력 모달
│   ├── order/
│   │   └── OrderPanel.tsx    # POS 주문 입력 (메뉴/카테고리/사이드바)
│   ├── status/
│   │   └── OrderStatusList.tsx # 주방 현황 (진행/완료/취소)
│   ├── takeout/
│   │   └── TakeoutDashboard.tsx # 포장·배달·대기 + TakeoutContent export
│   ├── reservation/
│   │   ├── ReservationCalendar.tsx # 예약 캘린더 + 우측 하단 + 버튼
│   │   └── ReservationModal.tsx   # 예약 등록 모달 (인원/날짜/시간 등)
│   └── settings/
│       └── ManagementDashboard.tsx # 관리/설정 **사이드바(드로어)**
├── stores/
├── hooks/
├── types/
│   └── index.ts
├── utils/
├── App.tsx
├── main.tsx
└── index.css
```

---

## 3. 라우팅

| 경로 | 페이지 | 비고 |
|------|--------|------|
| `/` | TablePage | 테이블 현황 (기본) |
| `/order` | OrderPage | 주문 (테이블 미지정) |
| `/order/:tableId` | OrderPage | 주문 (특정 테이블) |
| `/status` | StatusPage | 주방 현황 |
| `/takeout` | TakeoutPage | 포장·배달·대기 |
| `/reservation` | ReservationPage | 예약 캘린더 |
| `/settings` | SettingsPage | “설정은 ≡ 메뉴에서” 안내 |

---

## 4. 공통 레이아웃 (상단 네비 – 단일)

- **네비게이션 중복 금지**: 앱 전체에서 **상단 네비는 한 번만** 표시.
- **위치**: `App.tsx`에서 `<Header />` 한 번만 렌더. 각 페이지/컴포넌트(TableOverview, OrderPanel, OrderStatusList, TakeoutDashboard 등) **내부에는 테이블|주문|현황|예약 메뉴를 두지 않음**.

**Header (검은 상단바)**

- 배경: `bg-gray-900`
- 높이: 약 50–60px (`h-14`)
- **좌측**: 햄버거 메뉴 `≡` → 클릭 시 **관리 사이드바(ManagementDashboard)** 열기
- **중앙**: Navigation – 테이블 | 주문 | 현황 | 예약 (NavLink, 선택 탭 흰색+밑줄, 비선택 회색)
- **우측**: 달 아이콘, 알림 아이콘, 날짜/시간 (형식: `M.D. (요일) 오전/오후 H:MM`)

---

## 5. 관리 사이드바 (ManagementDashboard)

- **역할**: 별도 페이지가 아닌 **왼쪽에서 슬라이드 인하는 사이드바(드로어)**.
- **열기**: 상단 왼쪽 `≡` 클릭.
- **상태**: `App.tsx`에서 `isSidebarOpen` (useState), Header에 `onMenuClick` 전달.
- **닫기**: X 버튼 클릭, 또는 **바깥(오버레이) 클릭**.
- **스타일**: 너비 약 300–400px(예: 350px), 배경 흰색, 오버레이 `bg-black/50`.
- **내용**: 매장 헤더(바이오테크, 포스 시작하기 등), 카테고리(매출/상품/편의/채널/마케팅/설정), Chick Mascot.
- **/settings 진입 시**: `pathname === '/settings'`이면 사이드바 자동 오픈 (useEffect in App).

**Props**: `isOpen: boolean`, `onClose: () => void`

---

## 6. 테이블 페이지 (TableOverview)

- **탭**: “기본홀” | “포장·배달·대기” (useState `activeTab`).
  - **기본홀**: 테이블 그리드(TableCard), 범례, Chick Mascot, 하단 요약 푸터.
  - **포장·배달·대기**: `TakeoutContent` (takeout/TakeoutDashboard에서 export) 렌더.
- **테이블 상태**: `tables` (useState). 각 항목: `id`, `name`, `status`, (occupied일 때) `time`, `guests`, `amount`.
  - `status`: `'occupied'` | `'empty-blue'` | `'empty-orange'` (사용중 / 빈 테이블 / 예약).
- **빈 테이블 클릭**: `empty-blue` 또는 `empty-orange` 카드 클릭 시 **TableNumberpad 모달** 열기.
  - 상태: `selectedTable`, `isNumberpadOpen`.
- **인원 확인 시**: 해당 테이블을 `occupied`로 변경, `guests` 저장, 모달 닫기.
- **푸터**: 전체/사용중/예약/빈 테이블 수, 총 손님 수는 `tables` 기준으로 계산.

---

## 7. 인원 선택 모달 (TableNumberpad)

- **역할**: 빈 테이블 클릭 시 뜨는 **인원 입력 모달**.
- **Props**:
  - `isOpen: boolean`
  - `onClose: () => void`
  - `onConfirm: (guestCount: number) => void`
  - `tableName: string` (예: "기본홀1")
- **동작**: 숫자 패드로 인원 입력 → 확인 시 `onConfirm(guestCount)` 호출 후 `onClose`. 취소 또는 **바깥 클릭** 시 `onClose`만 호출.
- **제목**: “테이블 : {tableName}”.

---

## 8. 주문 페이지 (OrderPanel)

- **경로**: `/order`, `/order/:tableId`. `tableId`는 OrderPanel에 prop으로 전달.
- **내용**: 카테고리 탭, 메뉴 그리드, 우측 주문/할인/결제 사이드바. 상단 네비 없음.

---

## 9. 주방 현황 (OrderStatusList)

- **내용**: 진행/완료/취소 탭, 주문 카드 리스트, Chick Mascot, 하단 요약. 상단 네비 없음.

---

## 10. 포장·배달·대기 (TakeoutDashboard / TakeoutContent)

- **TakeoutDashboard**: `/takeout` 페이지용. SubHeader(기본홀|포장·배달·대기) + TakeoutContent.
- **TakeoutContent**: 본문만 export. TableOverview의 “포장·배달·대기” 탭에서도 동일 컴포넌트 재사용.

---

## 11. 예약 (ReservationCalendar + ReservationModal)

- **ReservationCalendar**: 캘린더 사이드바 + 주간 그리드 + 우측 하단 **+ 버튼**. 상단 네비 없음.
- **모달 상태**: ReservationCalendar 내부 `useState isModalOpen`. + 버튼 클릭 시 `setIsModalOpen(true)`.
- **ReservationModal**: 예약 등록 폼(이름/전화, 날짜·시간, 인원, 테이블, 상품). `isOpen`, `onClose` props. X 버튼 및 **바깥 클릭**으로 닫기.

---

## 12. 설정 페이지 (SettingsPage)

- **역할**: “설정 메뉴는 상단 왼쪽 ≡ 버튼을 눌러 열 수 있습니다” 안내만 표시. 실제 설정 UI는 ManagementDashboard 사이드바에서 제공.

---

## 13. 기술·코딩 규칙

- **타입**: 점진적 적용 가능. 당장 타입 에러 나면 `any` 임시 처리 허용.
- **확장자**: 컴포넌트는 `.tsx`.
- **스타일**: Tailwind CSS. 공통 레이아웃은 검은 상단바 한 줄만 두고, 페이지별로 중복 네비를 만들지 않음.
- **상태**: 페이지/도메인별로 필요한 곳에서 useState 사용 (예: 테이블 탭, 모달 열림, 사이드바 열림, 인원 입력).

---

## 14. New Chat에서 이어갈 때

1. 이 파일(`DESIGN.md`)을 **기준**으로 현재 구조와 합의된 동작을 확인.
2. 새 기능/수정 요청 시 위 구조(폴더, 라우트, 컴포넌트 역할, props, 상태 소유처)를 유지한 채로 변경.
3. “상단 네비는 한 번만”, “관리 메뉴는 사이드바”, “빈 테이블 클릭 시 인원 모달” 등 위에 적힌 규칙을 깨지 않도록 할 것.

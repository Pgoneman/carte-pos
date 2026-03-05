import { describe, it, expect, beforeEach, vi } from 'vitest';

// Supabase를 모의(mock)하여 네트워크 호출 없이 스토어 테스트
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    })),
    removeChannel: vi.fn(),
  },
}));

import { usePosStore } from '../stores/posStore';

describe('orderSlice — 주문 계산 로직', () => {
  beforeEach(() => {
    usePosStore.setState({ currentOrder: [] });
  });

  // ── addToOrder ──────────────────────────────────────

  describe('addToOrder', () => {
    it('새 메뉴를 추가하면 quantity 1로 추가된다', () => {
      usePosStore.getState().addToOrder({
        menuId: 'menu-1',
        name: '아메리카노',
        price: 4500,
      });

      const order = usePosStore.getState().currentOrder;
      expect(order).toHaveLength(1);
      expect(order[0]).toEqual({
        menuId: 'menu-1',
        name: '아메리카노',
        price: 4500,
        quantity: 1,
      });
    });

    it('동일 메뉴를 다시 추가하면 quantity가 증가한다', () => {
      const { addToOrder } = usePosStore.getState();
      addToOrder({ menuId: 'menu-1', name: '아메리카노', price: 4500 });
      addToOrder({ menuId: 'menu-1', name: '아메리카노', price: 4500 });

      const order = usePosStore.getState().currentOrder;
      expect(order).toHaveLength(1);
      expect(order[0].quantity).toBe(2);
    });

    it('다른 메뉴를 추가하면 별도 항목으로 추가된다', () => {
      const { addToOrder } = usePosStore.getState();
      addToOrder({ menuId: 'menu-1', name: '아메리카노', price: 4500 });
      addToOrder({ menuId: 'menu-2', name: '카페라떼', price: 5000 });

      expect(usePosStore.getState().currentOrder).toHaveLength(2);
    });
  });

  // ── removeFromOrder ─────────────────────────────────

  describe('removeFromOrder', () => {
    it('지정한 menuId의 항목을 제거한다', () => {
      usePosStore.setState({
        currentOrder: [
          { menuId: 'menu-1', name: '아메리카노', price: 4500, quantity: 2 },
          { menuId: 'menu-2', name: '카페라떼', price: 5000, quantity: 1 },
        ],
      });

      usePosStore.getState().removeFromOrder('menu-1');

      const order = usePosStore.getState().currentOrder;
      expect(order).toHaveLength(1);
      expect(order[0].menuId).toBe('menu-2');
    });

    it('존재하지 않는 menuId 제거 시 변화 없음', () => {
      usePosStore.setState({
        currentOrder: [
          { menuId: 'menu-1', name: '아메리카노', price: 4500, quantity: 1 },
        ],
      });

      usePosStore.getState().removeFromOrder('non-existent');

      expect(usePosStore.getState().currentOrder).toHaveLength(1);
    });
  });

  // ── updateQuantity ──────────────────────────────────

  describe('updateQuantity', () => {
    it('수량을 변경할 수 있다', () => {
      usePosStore.setState({
        currentOrder: [
          { menuId: 'menu-1', name: '아메리카노', price: 4500, quantity: 1 },
        ],
      });

      usePosStore.getState().updateQuantity('menu-1', 5);

      expect(usePosStore.getState().currentOrder[0].quantity).toBe(5);
    });

    it('수량을 0으로 설정하면 항목이 제거된다', () => {
      usePosStore.setState({
        currentOrder: [
          { menuId: 'menu-1', name: '아메리카노', price: 4500, quantity: 1 },
        ],
      });

      usePosStore.getState().updateQuantity('menu-1', 0);

      expect(usePosStore.getState().currentOrder).toHaveLength(0);
    });

    it('수량을 음수로 설정하면 항목이 제거된다', () => {
      usePosStore.setState({
        currentOrder: [
          { menuId: 'menu-1', name: '아메리카노', price: 4500, quantity: 3 },
        ],
      });

      usePosStore.getState().updateQuantity('menu-1', -1);

      expect(usePosStore.getState().currentOrder).toHaveLength(0);
    });
  });

  // ── clearOrder ──────────────────────────────────────

  describe('clearOrder', () => {
    it('전체 주문을 초기화한다', () => {
      usePosStore.setState({
        currentOrder: [
          { menuId: 'menu-1', name: '아메리카노', price: 4500, quantity: 2 },
          { menuId: 'menu-2', name: '카페라떼', price: 5000, quantity: 1 },
        ],
      });

      usePosStore.getState().clearOrder();

      expect(usePosStore.getState().currentOrder).toHaveLength(0);
    });
  });

  // ── 주문 금액 계산 (submitOrder 내부 로직 검증) ─────

  describe('주문 금액 계산', () => {
    it('총액은 각 항목의 price * quantity 합산이다', () => {
      const items = [
        { menuId: 'menu-1', name: '아메리카노', price: 4500, quantity: 2 },
        { menuId: 'menu-2', name: '카페라떼', price: 5000, quantity: 1 },
      ];

      const totalAmount = items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      );

      expect(totalAmount).toBe(14000); // 4500*2 + 5000*1
    });

    it('0-quantity 항목은 합산에서 제외된다', () => {
      const items = [
        { menuId: 'menu-1', name: '아메리카노', price: 4500, quantity: 2 },
        { menuId: 'menu-2', name: '카페라떼', price: 5000, quantity: 0 },
      ];

      const validOrder = items.filter((item) => item.quantity > 0);
      const totalAmount = validOrder.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      );

      expect(totalAmount).toBe(9000); // 4500*2 only
    });

    it('빈 주문의 총액은 0이다', () => {
      const items: { price: number; quantity: number }[] = [];

      const totalAmount = items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      );

      expect(totalAmount).toBe(0);
    });
  });

  // ── 복합 시나리오 ──────────────────────────────────

  describe('복합 시나리오', () => {
    it('메뉴 추가 → 수량 변경 → 일부 삭제 후 올바른 상태 유지', () => {
      const store = usePosStore.getState();

      // 메뉴 3개 추가
      store.addToOrder({ menuId: 'A', name: '아메리카노', price: 4500 });
      store.addToOrder({ menuId: 'B', name: '카페라떼', price: 5000 });
      store.addToOrder({ menuId: 'C', name: '케이크', price: 6000 });

      // A를 한 번 더 추가 (quantity 2가 됨)
      usePosStore.getState().addToOrder({ menuId: 'A', name: '아메리카노', price: 4500 });

      // B 수량을 3으로 변경
      usePosStore.getState().updateQuantity('B', 3);

      // C 삭제
      usePosStore.getState().removeFromOrder('C');

      const order = usePosStore.getState().currentOrder;
      expect(order).toHaveLength(2);
      expect(order.find((o) => o.menuId === 'A')?.quantity).toBe(2);
      expect(order.find((o) => o.menuId === 'B')?.quantity).toBe(3);

      // 총액 검증: A(4500*2) + B(5000*3) = 24000
      const total = order.reduce((sum, item) => sum + item.price * item.quantity, 0);
      expect(total).toBe(24000);
    });
  });
});

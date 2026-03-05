import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { usePosStore } from '../stores/posStore';

interface AycePassState {
  hasPass: boolean;
  isLoading: boolean;
}

/**
 * 현재 테이블에 AYCE 이용권이 있는지 감지.
 * 소스 2가지:
 *  1. currentOrder (장바구니) — 이용권을 담는 순간 반영
 *  2. 과거 주문 (DB) — 이미 제출된 주문에 이용권이 있는지
 *
 * isLoading이 true일 때는 DB 확인 중이므로 모달 표시를 보류해야 함.
 */
export function useHasAycePass(refreshKey: number): AycePassState {
  const currentOrder = usePosStore((s) => s.currentOrder);
  const menus = usePosStore((s) => s.menus);
  const selectedTableId = usePosStore((s) => s.selectedTableId);
  const realtimeTick = usePosStore((s) => s.realtimeRefreshTick);

  const allMenus = useMemo(() => Object.values(menus).flat(), [menus]);

  // 1. 장바구니에 이용권이 있는지
  const cartHasPass = useMemo(() => {
    return currentOrder.some((item) => {
      const menu = allMenus.find((m) => m.id === item.menuId);
      return menu?.isAycePass === true;
    });
  }, [currentOrder, allMenus]);

  // 2. 과거 주문에 이용권이 있는지
  const [dbHasPass, setDbHasPass] = useState(false);
  const [dbLoading, setDbLoading] = useState(true);

  useEffect(() => {
    if (!selectedTableId || allMenus.length === 0) {
      setDbHasPass(false);
      setDbLoading(false);
      return;
    }

    setDbLoading(true);
    const fetchPassFromOrders = async () => {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('order_items(name)')
          .eq('table_id', selectedTableId)
          .in('status', ['pending', 'cooking', 'ready', 'served']);

        if (error || !data) {
          setDbHasPass(false);
          return;
        }

        const passMenuNames = allMenus
          .filter((m) => m.isAycePass)
          .map((m) => m.name);

        const found = (data as unknown as { order_items: { name: string }[] }[]).some(
          (order) =>
            (order.order_items ?? []).some((item) =>
              passMenuNames.includes(item.name)
            )
        );
        setDbHasPass(found);
      } finally {
        setDbLoading(false);
      }
    };

    fetchPassFromOrders();
  }, [selectedTableId, refreshKey, realtimeTick, allMenus]);

  return {
    hasPass: cartHasPass || dbHasPass,
    isLoading: dbLoading && !cartHasPass, // 장바구니에 이미 있으면 로딩 불필요
  };
}

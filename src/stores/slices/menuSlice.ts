import type { StateCreator } from 'zustand';
import { supabase } from '../../lib/supabase';
import type { Menu } from '../../types';
import type { MenuSlice, PosStore } from './types';

type MenuRow = Menu & {
  is_active?: boolean | null;
};

export const createMenuSlice: StateCreator<PosStore, [], [], MenuSlice> = (set, get) => ({
  menus: {},
  categories: [],
  selectedCategory: null,

  fetchMenus: async () => {
    try {
      const { data, error } = await supabase
        .from('menus')
        .select('*')
        .order('category_name')
        .order('name');

      if (error) {
        console.error('fetchMenus failed:', error);
        get().showToast('메뉴 정보를 불러오지 못했습니다.');
        return;
      }

      const list = ((data ?? []) as unknown as MenuRow[]).filter(
        (menu) => menu.is_active !== false
      );

      const grouped = list.reduce<Record<string, Menu[]>>((acc, menu) => {
        const category = menu.category_name || '기타';
        if (!acc[category]) acc[category] = [];
        acc[category].push({
          id: String(menu.id),
          name: menu.name,
          category_name: category,
          price: menu.price,
        });
        return acc;
      }, {});

      const categoryList = Object.keys(grouped);
      set({
        menus: grouped,
        categories: categoryList,
        selectedCategory: categoryList[0] || null,
      });
    } catch (error) {
      console.error('fetchMenus failed:', error);
      get().showToast('메뉴 정보를 불러오지 못했습니다.');
    }
  },

  selectCategory: (category) => set({ selectedCategory: category }),
});

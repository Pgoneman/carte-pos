import type { StateCreator } from 'zustand';
import { supabase } from '../../lib/supabase';
import type { Menu } from '../../types';
import type { MenuSlice, PosStore } from './types';

type MenuDbRow = {
  id: string | number;
  name?: string | null;
  name_ko?: string | null;
  category_name?: string | null;
  price?: number | null;
  is_active?: boolean | null;
  is_ayce?: boolean | null;
  is_ayce_pass?: boolean | null;
  description?: string | null;
  img?: string | null;
  cal?: number | null;
  popular?: boolean | null;
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

      const list = ((data ?? []) as unknown as MenuDbRow[]).filter(
        (menu) => menu.is_active !== false
      );

      const grouped = list.reduce<Record<string, Menu[]>>((acc, menu) => {
        const category = menu.category_name || '기타';
        if (!acc[category]) acc[category] = [];
        acc[category].push({
          id: String(menu.id),
          name: menu.name ?? '',
          nameKo: menu.name_ko ?? undefined,
          categoryName: category,
          price: menu.price ?? 0,
          isAyce: menu.is_ayce ?? false,
          isAycePass: menu.is_ayce_pass ?? false,
          description: menu.description ?? undefined,
          cal: menu.cal ?? undefined,
          img: menu.img ?? undefined,
          popular: menu.popular ?? false,
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

import { useMemo } from 'react';
import { usePosStore } from '../../stores/posStore';
import type { Menu } from '../../types';

interface AyceCourseModalProps {
  onClose: () => void;
}

export default function AyceCourseModal({ onClose }: AyceCourseModalProps) {
  const menus = usePosStore((s) => s.menus);
  const addToOrder = usePosStore((s) => s.addToOrder);

  const passMenus = useMemo(() => {
    return Object.values(menus)
      .flat()
      .filter((m) => m.isAycePass);
  }, [menus]);

  const handleSelect = (menu: Menu) => {
    addToOrder({ menuId: menu.id, name: menu.name, price: menu.price });
    onClose();
  };

  const formatPrice = (won: number) =>
    `₩${won.toLocaleString()}`;

  if (passMenus.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay — not dismissable by clicking */}
      <div className="absolute inset-0 bg-black/60" />

      <div className="relative bg-white rounded-2xl w-full max-w-sm mx-4 overflow-hidden shadow-xl">
        {/* Header */}
        <div className="bg-gradient-to-br from-brand-light to-[#FFE8DF] p-6 text-center">
          <span className="text-5xl">🔥</span>
          <h2 className="font-display text-xl text-brand-dark mt-2">Choose Your Course</h2>
          <p className="text-sm text-brand-muted mt-1 font-body">
            Select an AYCE pass for unlimited meat & seafood
          </p>
        </div>

        <div className="p-5 space-y-3">
          {passMenus.map((menu) => (
            <button
              key={menu.id}
              type="button"
              onClick={() => handleSelect(menu)}
              className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-gray-100 hover:border-brand-red hover:bg-brand-cream/50 transition-colors text-left"
            >
              <span className="text-3xl">{menu.img || '🎫'}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-brand-dark">{menu.name}</p>
                {menu.description && (
                  <p className="text-xs text-brand-muted mt-0.5">{menu.description}</p>
                )}
              </div>
              <span className="text-sm font-bold text-brand-red shrink-0">
                {formatPrice(menu.price)}
              </span>
            </button>
          ))}

          {/* Skip button */}
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-xl text-sm font-medium text-brand-muted hover:text-brand-warm hover:bg-brand-cream transition-colors"
          >
            Skip — Order a la carte
          </button>
        </div>
      </div>
    </div>
  );
}

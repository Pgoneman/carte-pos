import type { Menu } from '../../types';

interface CustomerMenuCardProps {
  menu: Menu;
  hasAycePass: boolean;
  onClick: () => void;
}

export default function CustomerMenuCard({ menu, hasAycePass, onClick }: CustomerMenuCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow text-left w-full"
    >
      {/* Emoji image area */}
      <div className="bg-gradient-to-br from-brand-light to-[#FFE8DF] h-28 flex items-center justify-center relative">
        <span className="text-5xl">{menu.img || '🍽️'}</span>
        {menu.popular && (
          <span className="absolute top-2 right-2 bg-brand-red text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
            HOT
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="font-semibold text-sm text-brand-dark leading-tight">
          {menu.name}
          {menu.nameKo && menu.nameKo !== menu.name && (
            <span className="text-brand-muted font-normal"> ({menu.nameKo})</span>
          )}
        </p>
        {menu.description && (
          <p className="text-xs text-brand-muted mt-0.5 line-clamp-1">{menu.description}</p>
        )}
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm font-bold text-brand-red">
            {hasAycePass && menu.isAyce ? 'Included' : `$${(menu.price / 1000).toFixed(0)}`}
          </span>
          {menu.cal != null && (
            <span className="text-[10px] text-brand-muted">{menu.cal} cal</span>
          )}
        </div>
      </div>
    </button>
  );
}

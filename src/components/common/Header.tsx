import Navigation from './Navigation';
import { useClock } from '../../hooks/useClock';



type HeaderProps = {
  onMenuClick?: () => void;
};

export default function Header({ onMenuClick }: HeaderProps) {
  const dateTime = useClock();

  return (
    <header className="flex items-center justify-between h-14 min-h-[50px] max-h-[60px] bg-gray-900 px-4 text-white select-none">
      <button
        type="button"
        onClick={onMenuClick}
        className="flex items-center justify-center w-10 h-10 text-xl text-white hover:text-gray-200 rounded-md transition-colors"
        aria-label="메뉴"
      >
        ≡
      </button>

      <Navigation />

      <div className="flex items-center gap-4">
        <span
          className="text-lg leading-none cursor-pointer hover:opacity-80"
          aria-hidden
        >
          🌙
        </span>
        <button
          type="button"
          className="relative p-1 text-lg leading-none hover:opacity-80"
          aria-label="알림"
        >
          🔔
        </button>
        <div className="text-right leading-tight text-sm font-medium">
          {dateTime}
        </div>
      </div>
    </header>
  );
}

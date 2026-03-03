import { usePosStore } from '../../stores/posStore';

export default function Toast() {
  const toastMessage = usePosStore((s) => s.toastMessage);
  if (!toastMessage) return null;
  return (
    <div
      className="fixed top-16 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded-lg shadow-lg"
      role="alert"
    >
      {toastMessage}
    </div>
  );
}

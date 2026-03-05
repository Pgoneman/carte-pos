import { useState } from 'react';
import { usePosStore } from '../../stores/posStore';

export default function DebugOverlay() {
  const [open, setOpen] = useState(false);

  const currentOrder = usePosStore((s) => s.currentOrder);
  const serverOrders = usePosStore((s) => s.serverOrders);
  const selectedTableId = usePosStore((s) => s.selectedTableId);
  const realtimeConnected = usePosStore((s) => s.realtimeConnected);
  const realtimeRefreshTick = usePosStore((s) => s.realtimeRefreshTick);
  const loading = usePosStore((s) => s.loading);

  if (import.meta.env.PROD) return null;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-2 right-2 z-[9999] bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-40 hover:opacity-100"
      >
        DBG
      </button>
    );
  }

  return (
    <div className="fixed bottom-2 right-2 z-[9999] bg-gray-900 text-green-300 text-[10px] font-mono p-3 rounded-lg shadow-xl max-w-xs max-h-80 overflow-auto">
      <div className="flex justify-between items-center mb-2">
        <span className="text-white font-bold text-xs">Debug</span>
        <button type="button" onClick={() => setOpen(false)} className="text-gray-400 hover:text-white">
          X
        </button>
      </div>

      <div className="space-y-1">
        <div>
          <span className="text-gray-400">realtime:</span>{' '}
          <span className={realtimeConnected ? 'text-green-400' : 'text-red-400'}>
            {realtimeConnected ? 'connected' : 'disconnected'}
          </span>
        </div>
        <div>
          <span className="text-gray-400">refreshTick:</span> {realtimeRefreshTick}
        </div>
        <div>
          <span className="text-gray-400">tableId:</span> {selectedTableId ?? 'null'}
        </div>
        <div>
          <span className="text-gray-400">loading:</span> {String(loading)}
        </div>
        <div className="border-t border-gray-700 pt-1 mt-1">
          <span className="text-yellow-300">currentOrder ({currentOrder.length}):</span>
          {currentOrder.map((item, idx) => (
            <div key={idx} className="pl-2 text-gray-300">
              {item.name} x{item.quantity} @{item.price}
            </div>
          ))}
        </div>
        <div className="border-t border-gray-700 pt-1 mt-1">
          <span className="text-cyan-300">serverOrders ({serverOrders.length}):</span>
          {serverOrders.map((item, idx) => (
            <div key={idx} className="pl-2 text-gray-300">
              {item.name} x{item.quantity} @{item.price}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface OrderSuccessModalProps {
  onNewOrder: () => void;
}

export default function OrderSuccessModal({ onNewOrder }: OrderSuccessModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative bg-white rounded-2xl w-full max-w-sm mx-4 p-8 text-center shadow-xl">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="font-display text-2xl text-brand-dark mb-2">Order Placed!</h2>
        <p className="text-brand-muted text-sm mb-1">Your order has been sent to the kitchen.</p>
        <p className="text-brand-muted text-sm mb-6">Estimated wait: ~15 min</p>
        <button
          type="button"
          onClick={onNewOrder}
          className="w-full py-3 rounded-xl text-sm font-bold text-white bg-brand-red hover:bg-brand-red-light transition-colors"
        >
          New Order
        </button>
      </div>
    </div>
  );
}

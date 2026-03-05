import { useState, useEffect } from 'react';

type PaymentMethod = 'card' | 'easy_pay' | 'transfer';
type Step = 'method' | 'confirm' | 'processing' | 'complete';

interface TossPaymentModalProps {
  totalAmount: number;
  tableName: string;
  onClose: () => void;
  onPaymentComplete: (method: PaymentMethod) => void;
}

const TOSS_BLUE = '#0064FF';

const METHOD_OPTIONS: { value: PaymentMethod; label: string; icon: string }[] = [
  { value: 'card', label: '카드 결제', icon: '💳' },
  { value: 'easy_pay', label: '간편결제', icon: '📱' },
  { value: 'transfer', label: '계좌이체', icon: '🏦' },
];

export default function TossPaymentModal({
  totalAmount,
  tableName,
  onClose,
  onPaymentComplete,
}: TossPaymentModalProps) {
  const [step, setStep] = useState<Step>('method');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('card');
  const [dutchPay, setDutchPay] = useState(false);
  const [people, setPeople] = useState(2);

  const perPerson = dutchPay ? Math.ceil(totalAmount / people) : totalAmount;

  const formatPrice = (won: number) => `$${(won / 1000).toFixed(0)}`;

  const handlePay = () => {
    setStep('processing');
  };

  // Processing simulation — 2~3 second delay
  useEffect(() => {
    if (step !== 'processing') return;
    const delay = 2000 + Math.random() * 1000;
    const timer = setTimeout(() => {
      setStep('complete');
    }, delay);
    return () => clearTimeout(timer);
  }, [step]);

  // Complete — notify parent after brief display
  useEffect(() => {
    if (step !== 'complete') return;
    const timer = setTimeout(() => {
      onPaymentComplete(selectedMethod);
    }, 1500);
    return () => clearTimeout(timer);
  }, [step, selectedMethod, onPaymentComplete]);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
        {/* Header */}
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{ backgroundColor: TOSS_BLUE }}
        >
          <h2 className="text-white font-bold text-lg">결제하기</h2>
          {step === 'method' && (
            <button
              type="button"
              onClick={onClose}
              className="text-white/80 hover:text-white text-xl leading-none"
            >
              ✕
            </button>
          )}
        </div>

        <div className="p-6">
          {/* Step 1: 결제수단 선택 */}
          {step === 'method' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500 text-center">
                Table #{tableName}
              </p>
              <div className="space-y-2">
                {METHOD_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSelectedMethod(opt.value)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-colors ${
                      selectedMethod === opt.value
                        ? 'border-[#0064FF] bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-xl">{opt.icon}</span>
                    <span className="font-medium text-sm">{opt.label}</span>
                    {selectedMethod === opt.value && (
                      <span className="ml-auto text-[#0064FF] font-bold">✓</span>
                    )}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setStep('confirm')}
                className="w-full py-3 rounded-xl text-white font-bold text-sm transition-colors"
                style={{ backgroundColor: TOSS_BLUE }}
              >
                다음
              </button>
            </div>
          )}

          {/* Step 2: 금액 확인 + 더치페이 */}
          {step === 'confirm' && (
            <div className="space-y-5">
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-1">결제 금액</p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatPrice(totalAmount)}
                </p>
              </div>

              {/* 더치페이 토글 */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">더치페이</span>
                  <button
                    type="button"
                    onClick={() => setDutchPay(!dutchPay)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      dutchPay ? 'bg-[#0064FF]' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        dutchPay ? 'translate-x-5' : ''
                      }`}
                    />
                  </button>
                </div>

                {dutchPay && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">인원수</span>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setPeople(Math.max(2, people - 1))}
                          className="w-8 h-8 rounded-full bg-white border border-gray-300 text-sm font-bold hover:bg-gray-100"
                        >
                          -
                        </button>
                        <span className="text-lg font-bold w-6 text-center">{people}</span>
                        <button
                          type="button"
                          onClick={() => setPeople(Math.min(20, people + 1))}
                          className="w-8 h-8 rounded-full bg-white border border-gray-300 text-sm font-bold hover:bg-gray-100"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                      <span className="text-sm text-gray-600">1인당 금액</span>
                      <span className="text-lg font-bold" style={{ color: TOSS_BLUE }}>
                        {formatPrice(perPerson)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep('method')}
                  className="flex-1 py-3 rounded-xl text-sm font-bold border border-gray-300 text-gray-600 hover:bg-gray-50"
                >
                  이전
                </button>
                <button
                  type="button"
                  onClick={handlePay}
                  className="flex-[2] py-3 rounded-xl text-white font-bold text-sm transition-colors"
                  style={{ backgroundColor: TOSS_BLUE }}
                >
                  {formatPrice(dutchPay ? perPerson : totalAmount)} 결제하기
                </button>
              </div>
            </div>
          )}

          {/* Step 3: 결제 처리 중 */}
          {step === 'processing' && (
            <div className="py-12 flex flex-col items-center gap-4">
              <div
                className="w-12 h-12 border-4 border-gray-200 rounded-full animate-spin"
                style={{ borderTopColor: TOSS_BLUE }}
              />
              <p className="text-sm text-gray-600 font-medium">결제 처리 중...</p>
              <p className="text-xs text-gray-400">잠시만 기다려 주세요</p>
            </div>
          )}

          {/* Step 4: 결제 완료 */}
          {step === 'complete' && (
            <div className="py-12 flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-3xl text-green-600">✓</span>
              </div>
              <p className="text-lg font-bold text-gray-900">결제 완료</p>
              <p className="text-sm text-gray-500">
                {formatPrice(dutchPay ? perPerson : totalAmount)} 결제되었습니다
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

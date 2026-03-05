export function PainPointSection() {
  const painPoints = [
    {
      icon: '⏱️',
      before: '결제 6분',
      after: '결제 2분',
      description: '실제 Ubling BBQ 파일럿에서 검증된 수치',
    },
    {
      icon: '📱',
      before: '구두 주문 → 미스',
      after: 'QR 셀프 주문',
      description: '고객이 직접 QR로 주문, 주문 실수 제로',
    },
    {
      icon: '🔄',
      before: '회전율 정체',
      after: '테이블 회전율 20%↑',
      description: '52분 → 41분 테이블 타임 단축 (파일럿 데이터)',
    },
    {
      icon: '💰',
      before: 'Toast/Clover 범용 POS',
      after: 'AYCE 전용 설계',
      description: 'AYCE 플랜·라운드·타이머를 네이티브 지원',
    },
  ];

  return (
    <section className="py-20 px-6 bg-brand-cream">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-display text-brand-dark text-center mb-12">
          왜 기존 POS로는 안 되는가
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {painPoints.map((point) => (
            <div key={point.after} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <span className="text-3xl mb-3 block">{point.icon}</span>
              <div className="flex items-center gap-3 mb-2">
                <span className="line-through text-brand-muted text-sm">{point.before}</span>
                <span className="text-brand-red font-bold">&rarr;</span>
                <span className="text-brand-dark font-bold">{point.after}</span>
              </div>
              <p className="text-sm text-brand-warm font-body">{point.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HeroSection() {
  return (
    <section className="bg-brand-dark text-brand-cream py-20 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <p className="text-brand-red-light font-body text-sm tracking-wider uppercase mb-4">
          AYCE 전문 POS - 베타 3곳 한정
        </p>
        <h1 className="text-4xl md:text-6xl font-display leading-tight mb-6">
          결제 시간<br />
          <span className="text-brand-red">6분 &rarr; 2분</span>으로<br />
          줄여드립니다
        </h1>
        <p className="text-xl text-brand-brown-light font-body max-w-2xl mx-auto mb-8">
          Korean BBQ AYCE 레스토랑 전용 POS 시스템.<br />
          QR 주문 - 실시간 주방 연동 - 자동 결제까지 하나로.
        </p>
        <a
          href="#signup"
          className="inline-block bg-brand-red hover:bg-brand-red-light text-white
                     font-bold py-4 px-8 rounded-full text-lg transition-colors
                     font-body shadow-lg shadow-brand-red/30"
        >
          무료 베타 신청하기
        </a>
        <p className="text-brand-muted text-sm mt-3 font-body">
          첫 달 100% 무료 - 회전율 안 오르면 무조건 철수
        </p>
      </div>
    </section>
  );
}

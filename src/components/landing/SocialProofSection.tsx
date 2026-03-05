export function SocialProofSection() {
  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-display text-brand-dark mb-12">
          실제 파일럿 결과
        </h2>

        {/* 핵심 수치 */}
        <div className="grid grid-cols-3 gap-8 mb-12">
          <div>
            <p className="text-5xl font-display font-bold text-brand-red">52&rarr;41</p>
            <p className="text-sm text-brand-muted mt-1">분 - 테이블 타임</p>
          </div>
          <div>
            <p className="text-5xl font-display font-bold text-brand-red">21%</p>
            <p className="text-sm text-brand-muted mt-1">회전율 향상</p>
          </div>
          <div>
            <p className="text-5xl font-display font-bold text-brand-red">0건</p>
            <p className="text-sm text-brand-muted mt-1">주문 실수</p>
          </div>
        </div>

        {/* 인용 */}
        <blockquote className="bg-brand-light rounded-2xl p-8 max-w-2xl mx-auto">
          <p className="text-lg text-brand-dark font-body italic mb-4">
            "런치 타임에 테이블 한 번 더 돌릴 수 있게 됐어요.
            주문 실수도 사라졌고, 직원들이 서빙에만 집중할 수 있어서 좋습니다."
          </p>
          <p className="text-sm text-brand-muted">
            -- Ubling Korean BBQ, LA
          </p>
        </blockquote>
      </div>
    </section>
  );
}
